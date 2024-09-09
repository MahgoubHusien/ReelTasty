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
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

interface TranscriptionResponse {
  text: string;
}

export const transcribeVideoFromS3 = async (videoKey: string): Promise<TranscriptionResponse> => {
  const params = { Bucket: process.env.S3_BUCKET_NAME!, Key: videoKey };

  try {
    console.log('Fetching video from S3...');
    const { Body } = await s3.send(new GetObjectCommand(params));
    
    if (!Body) throw new Error('File not found or empty.');

    const videoFilePath = `/tmp/${videoKey}`;
    const mp3FilePath = `/tmp/${path.basename(videoKey, path.extname(videoKey))}.mp3`;
    const streamBody = Body as SdkStreamMixin & Readable;

    const fileStream = fs.createWriteStream(videoFilePath);
    streamBody.pipe(fileStream);
    await new Promise((resolve, reject) => {
      fileStream.on('close', resolve);
      fileStream.on('error', reject);
    });

    console.log('Converting video to mp3...');
    await execPromise(`ffmpeg -i ${videoFilePath} -q:a 0 -map a ${mp3FilePath}`);

    console.log('Sending mp3 file to OpenAI for transcription...');
    const transcription: TranscriptionResponse = await openai.audio.transcriptions.create({
      file: fs.createReadStream(mp3FilePath),
      model: 'whisper-1',
      response_format: 'text',
    });

    console.log('Full OpenAI API response:', transcription);

    fs.unlinkSync(videoFilePath);
    fs.unlinkSync(mp3FilePath);

    return transcription; 
  } catch (error) {
    console.error('Error transcribing video:', error);
    throw new Error('Transcription failed');
  }
};
