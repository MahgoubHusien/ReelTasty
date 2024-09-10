import TikAPI from 'tikapi';
import axios from 'axios';
import AWS from 'aws-sdk';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import 'dotenv/config';

const api = TikAPI(process.env.TIKAPI_KEY as string);

const s3 = new AWS.S3({
  accessKeyId: process.env.ACCESS_KEY_ID as string,
  secretAccessKey: process.env.SECRET_ACCESS_KEY as string,
  region: process.env.REGION as string,
});

async function uploadVideoStreamToS3(videoId: string, videoStream: any): Promise<string> {
  const uploadParams = {
    Bucket: process.env.S3_BUCKET_NAME as string,
    Key: `${videoId}.mp4`,
    Body: videoStream,
    ContentType: 'video/mp4',
  };

  try {
    const uploadResult = await s3.upload(uploadParams).promise();
    console.log(`Video uploaded to S3: ${uploadResult.Location}`);
    return uploadResult.Location;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error uploading to S3: ${error.message}`);
    } else {
      throw new Error('Unknown error uploading to S3');
    }
  }
}

async function downloadVideo(url: string): Promise<any> {
  try {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream',   
    });
    return response.data;   
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error downloading video: ${error.message}`);
    } else {
      throw new Error('Unknown error downloading video');
    }
  }
}

export async function fetchAndUploadVideo(videoId: string): Promise<string | null> {
  try {
    const response = await api.public.video({ id: videoId });

    if (!response?.json || !response.json.itemInfo.itemStruct.video.downloadAddr) {
      throw new Error('No valid download address found in TikAPI response.');
    }

    const downloadUrl = response.json.itemInfo.itemStruct.video.downloadAddr;
    console.log(`Download URL: ${downloadUrl}`);

    const videoStream = await downloadVideo(downloadUrl);

    const s3Url = await uploadVideoStreamToS3(videoId, videoStream);

    return s3Url;
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error processing video ${videoId}: ${error.message}`);
    } else {
      console.error(`Unknown error processing video ${videoId}:`, error);
    }
    return null;
  }
}

(async () => {
  const videoId = '7383383600030403870';  
  try {
    const s3Url = await fetchAndUploadVideo(videoId);
    if (s3Url) {
      console.log(`Video successfully uploaded to S3: ${s3Url}`);
    } else {
      console.log('Failed to upload video');
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error in the example run: ${error.message}`);
    } else {
      console.error('Unknown error occurred during the example run');
    }
  }
})();
