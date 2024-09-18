import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { OpenAI } from 'openai';
import fs from 'fs';
import { exec } from 'child_process';
import util from 'util';
import { Readable } from 'stream';
import path from 'path';
import { SdkStreamMixin } from '@aws-sdk/types'; 

const execPromise = util.promisify(exec);

const s3 = new S3Client({
  region: process.env.REGION,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID!,
    secretAccessKey: process.env.SECRET_ACCESS_KEY!,
  },
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

interface TranscriptionResponse {
  text: string;
}

export const transcribeVideoFromS3 = async (videoKey: string): Promise<TranscriptionResponse> => {
  const fullKey = `${videoKey}.mp4`; 
  const params = { Bucket: process.env.S3_BUCKET_NAME!, Key: fullKey };

  
  try {
    const { Body } = await s3.send(new GetObjectCommand(params));
    
    if (!Body) {
      throw new Error(`File with key "${fullKey}" not found in S3.`);
    }

    const videoFilePath = `/tmp/${fullKey}`;
    const mp3FilePath = `/tmp/${path.basename(fullKey, path.extname(fullKey))}.mp3`;

    const streamBody = Body as SdkStreamMixin & Readable;
    const fileStream = fs.createWriteStream(videoFilePath);

    streamBody.pipe(fileStream);

    await new Promise((resolve, reject) => {
      fileStream.on('close', resolve);
      fileStream.on('error', (err) => {
        console.error(`Error writing video file to local storage: ${err}`);
        reject(err);
      });
    });

    await execPromise(`ffmpeg -i ${videoFilePath} -q:a 0 -map a ${mp3FilePath}`);

    const transcription: TranscriptionResponse = await openai.audio.transcriptions.create({
      file: fs.createReadStream(mp3FilePath),
      model: 'whisper-1',
      response_format: 'text',
    });


    if (fs.existsSync(videoFilePath)) {
      fs.unlinkSync(videoFilePath);
    }
    
    if (fs.existsSync(mp3FilePath)) {
      fs.unlinkSync(mp3FilePath);
    }

    return transcription;
  } catch (error) {
    console.error(`Error during transcription process for video with key "${fullKey}":`, error);
    throw new Error('Transcription failed');
  }
};
