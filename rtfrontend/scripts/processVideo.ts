import TikAPI from 'tikapi';
import AWS from 'aws-sdk';
import pkg from 'pg';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

const { Pool } = pkg;

// Set up TikAPI
const api = TikAPI(process.env.TIKAPI_KEY as string);

// Set up AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  region: process.env.AWS_REGION as string,
});

// Set up PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Type for video metadata
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

// Store video metadata in PostgreSQL
async function storeVideoMetadataInDB(videoMetadata: VideoMetadata) {
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
}

// Upload video to S3
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

  // Return S3 URL
  return uploadResult.Location;
}

// Process video and store it in S3 and PostgreSQL
export async function processAndStoreVideo(videoId: string): Promise<VideoMetadata | null> {
  try {
    // Fetch video metadata from TikAPI
    const response = await api.public.video({ id: videoId });

    if (!response?.json) {
      throw new Error('No response from TikAPI.');
    }

    const item = response.json.itemInfo.itemStruct;
    console.log(`Fetched metadata for video ID: ${videoId}`);

    // Define video metadata
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

    // Download video to local file
    const downloadAddr = item.video.downloadAddr;
    const filePath = path.join('/tmp', `${videoId}.mp4`);

    if (response.saveVideo) {
      await response.saveVideo(downloadAddr, filePath);
      console.log(`Video downloaded to: ${filePath}`);
    } else {
      throw new Error('saveVideo method is not defined');
    }

    // Upload video to S3
    videoMetadata.s3Url = await uploadVideoToS3(filePath, videoId);

    // Store video metadata in PostgreSQL
    await storeVideoMetadataInDB(videoMetadata);

    // Clean up local file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Temporary file deleted: ${filePath}`);
    }

    return videoMetadata;

  } catch (err) {
    console.error(`Error processing video ${videoId}:`, err);
    return null;
  }
}
