import TikAPI from 'tikapi';
import AWS from 'aws-sdk';
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import type { NextApiRequest, NextApiResponse } from 'next';
import 'dotenv/config';

const api = TikAPI(process.env.TIKAPI_KEY as string);
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  region: process.env.AWS_REGION as string,
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

async function storeVideoMetadataInDB(videoMetadata: VideoMetadata) {
  try {
    // Check if the video already exists in the database
    const existingVideo = await pool.query(
      `SELECT video_id FROM tiktok_videos WHERE video_id = $1`,
      [videoMetadata.videoId]
    );

    if (existingVideo.rowCount ?? 0 > 0) {
      console.log(`Video with ID ${videoMetadata.videoId} already exists. Skipping insert.`);
      return;
    }

    // Insert the new video metadata
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
    console.log(`Video metadata stored for video ID: ${videoMetadata.videoId}`);
  } catch (err) {
    console.error(`Error storing video metadata for video ID: ${videoMetadata.videoId}`, err);
  }
}


async function uploadVideoToS3(filePath: string, videoId: string): Promise<string> {
  const fileContent = fs.readFileSync(filePath);
  const fileName = `${videoId}.mp4`;

  const s3Params: AWS.S3.PutObjectRequest = {
    Bucket: process.env.S3_BUCKET_NAME as string,
    Key: fileName,
    Body: fileContent,
    ContentType: 'video/mp4',
  };

  const uploadResult = await s3.upload(s3Params).promise();
  console.log(`Video uploaded to S3 with key: ${fileName}`);

  return uploadResult.Location;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { videoId } = req.query;

  if (!videoId || typeof videoId !== 'string') {
    return res.status(400).json({ error: 'Video ID is required' });
  }

  try {
    const response = await api.public.video({ id: videoId });

    if (!response?.json) {
      throw new Error('No response from TikAPI.');
    }

    const item = response.json.itemInfo.itemStruct;
    console.log(`Fetched metadata for video ID: ${videoId}`);

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
    const filePath = path.join('/tmp', `${videoId}.mp4`);

    if (response.saveVideo) {
      await response.saveVideo(downloadAddr, filePath);
      console.log(`Video downloaded to: ${filePath}`);
    }

    videoMetadata.s3Url = await uploadVideoToS3(filePath, videoId);
    await storeVideoMetadataInDB(videoMetadata);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Temporary file deleted: ${filePath}`);
    }

    res.status(200).json(videoMetadata);
  } catch (err) {
    console.error(`Error processing video ${videoId}:`, err);
    res.status(500).json({ error: 'Error processing video' });
  }
}
