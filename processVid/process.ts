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

const port = process.env.PORT;

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

async function storeVideoMetadataInDB(videoMetadata: VideoMetadata) {
  try {
    const existingVideo = await pool.query(
      `SELECT video_id FROM tiktok_videos WHERE video_id = $1`,
      [videoMetadata.videoId]
    );

    if (existingVideo.rowCount ?? 0 > 0) {
      console.log(`Video with ID ${videoMetadata.videoId} already exists. Skipping insert.`);
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
    console.log(`Video metadata stored for video ID: ${videoMetadata.videoId}`);
  } catch (err) {
    console.error(`Error storing video metadata:`, err);
  }
}

async function uploadVideoToS3(filePath: string, videoId: string): Promise<string> {
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
  console.log(`Video uploaded to S3 with key: ${fileName}`);

  return uploadResult.Location;
}

app.get('/processVideo/:videoId', async (req, res) => {
  const { videoId } = req.params;

  try {
    const response = await api.public.video({ id: videoId });

    if (!response?.json) {
      throw new Error('No response from TikAPI.');
    }

    const item = response.json.itemInfo.itemStruct;
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
    console.error(`Error processing video:`, err);
    res.status(500).json({ error: 'Error processing video' });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
