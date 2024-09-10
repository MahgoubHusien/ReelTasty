import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import AWS from 'aws-sdk';
import TikAPI from 'tikapi';
import cors from 'cors';
import { Pool } from 'pg';

dotenv.config();

const app = express();
app.use(
  cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  })
);

const port = process.env.PORT || 3000;

const api = TikAPI(process.env.TIKAPI_KEY);

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

interface VideoMetadata {
  videoId: string;
  author: string;
  description: string;
  hashtags: string;
  s3Url: string;
  avatarLargeUrl: string;
  stats: {
    playCount: number;
    shareCount: number;
    commentCount: number;
    diggCount: number;
  };
}


const excludedKeywords = ['pork', 'bacon', 'ham', 'alcohol', 'wine', 'beer', 'whiskey', 'vodka'];

const storeVideoMetadataInDB = async (videoMetadata: VideoMetadata) => {
  try {
    const existingVideo = await pool.query(
      'SELECT video_id FROM tiktok_videos WHERE video_id = $1',
      [videoMetadata.videoId]
    );

    if (existingVideo.rowCount ?? 0 > 0) {
      return;
    }

    const query = `
      INSERT INTO tiktok_videos 
      (video_id, author, description, hashtags, s3_url, avatar_large_url, play_count, share_count, comment_count, digg_count) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `;
    const values = [
      videoMetadata.videoId,
      videoMetadata.author,
      videoMetadata.description,
      videoMetadata.hashtags,
      videoMetadata.s3Url,
      videoMetadata.avatarLargeUrl,
      videoMetadata.stats.playCount,
      videoMetadata.stats.shareCount,
      videoMetadata.stats.commentCount,
      videoMetadata.stats.diggCount,
    ];

    await pool.query(query, values);
  } catch (err) {
    console.error('Error storing video metadata:', err);
  }
};

const uploadVideoToS3 = async (filePath: string, videoId: string): Promise<string> => {
  try {
    const fileContent = fs.readFileSync(filePath);
    const fileName = `${videoId}.mp4`;

    if (!process.env.S3_BUCKET_NAME) {
      throw new Error('S3_BUCKET_NAME is not defined in environment variables');
    }

    const s3Params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileName,
      Body: fileContent,
      ContentType: 'video/mp4',
    };

    const uploadResult = await s3.upload(s3Params).promise();

    return uploadResult.Location;
  } catch (err) {
    console.error('Error uploading video to S3:', err);
    throw err;
  }
};

export const processHashtag = async (hashtag: string) => {
  try {
    let response = await api.public.hashtag({ name: hashtag });

    if (!response?.json) {
      throw new Error('No response from TikAPI.');
    }

    const hashtagId = response.json.challengeInfo.challenge.id;
    response = await api.public.hashtag({ id: hashtagId });

    while (response) {
      const videos = response?.json?.itemList || [];

      for (const item of videos) {
        const description = item.desc.toLowerCase();

        if (excludedKeywords.some(keyword => description.includes(keyword))) {
          continue;
        }

        const videoMetadata: VideoMetadata = {
          videoId: item.id,
          author: item.author.nickname,
          description: item.desc,
          hashtags: item.challengeInfoList?.map((challenge: { challengeName: string }) => challenge.challengeName).join(', ') || '',
          s3Url: '',
          avatarLargeUrl: item.author.avatarLarger,
          stats: {
            playCount: item.stats.playCount,
            shareCount: item.stats.shareCount,
            commentCount: item.stats.commentCount,
            diggCount: item.stats.diggCount,
          },
        };

        const downloadAddr = item.video.downloadAddr;
        const filePath = path.join('/tmp', `${videoMetadata.videoId}.mp4`);

        if (response.saveVideo) {
          await response.saveVideo(downloadAddr, filePath);

          videoMetadata.s3Url = await uploadVideoToS3(filePath, videoMetadata.videoId);
          await storeVideoMetadataInDB(videoMetadata);

          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
      }

      if (response.nextItems) {
        response = await response.nextItems();
      } else {
        break;
      }
    }
  } catch (err) {
    console.error(`Error processing hashtag videos for: ${hashtag}`, err);
  }
};


export const processVideo = async (videoId: string) => {
  try {
    const videoResponse = await api.public.video({ id: videoId });

    if (!videoResponse?.json) {
      throw new Error('No video data received from TikAPI.');
    }

    const item = videoResponse.json.itemInfo.itemStruct;
    const description = item.desc.toLowerCase();

    if (excludedKeywords.some(keyword => description.includes(keyword))) {
      return { error: "Excluded content." };
    }

    const videoMetadata: VideoMetadata = {
      videoId: item.id,
      author: item.author.nickname,
      description: item.desc,
      hashtags: item.challengeInfoList?.map((challenge: { challengeName: string }) => challenge.challengeName).join(', ') || '',
      s3Url: '',
      avatarLargeUrl: item.author.avatarLarger,
      stats: {
        playCount: item.stats.playCount,
        shareCount: item.stats.shareCount,
        commentCount: item.stats.commentCount,
        diggCount: item.stats.diggCount,
      },
    };

    const downloadAddr = item.video.downloadAddr;
    const filePath = path.join('/tmp', `${videoMetadata.videoId}.mp4`);

    if (videoResponse.saveVideo) {
      await videoResponse.saveVideo(downloadAddr, filePath);

      videoMetadata.s3Url = await uploadVideoToS3(filePath, videoMetadata.videoId);
      
      await storeVideoMetadataInDB(videoMetadata);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      return videoMetadata;
    }
  } catch (error) {
    console.error(`Error processing video with ID ${videoId}:`, error);
    throw new Error(`Error processing video with ID ${videoId}`);
  }
};

