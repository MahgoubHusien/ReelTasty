"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_s3_1 = require("@aws-sdk/client-s3");
const openai_1 = require("openai");
const dotenv_1 = __importDefault(require("dotenv"));
const form_data_1 = __importDefault(require("form-data"));
dotenv_1.default.config();
const s3 = new client_s3_1.S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});
const openai = new openai_1.OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});
// Helper to convert stream to buffer
function streamToBuffer(stream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
    });
}
// Function to transcribe video from S3
function transcribeVideoFromS3(videoKey) {
    return __awaiter(this, void 0, void 0, function* () {
        const params = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: videoKey,
        };
        try {
            // Get the video object from S3
            const command = new client_s3_1.GetObjectCommand(params);
            const data = yield s3.send(command);
            // Convert the S3 stream to a buffer
            const videoBuffer = yield streamToBuffer(data.Body);
            // Create a FormData instance to handle the buffer as a file
            const formData = new form_data_1.default();
            formData.append('file', videoBuffer, {
                filename: videoKey,
                contentType: 'audio/mp4', // Set the correct content type based on your file format
            });
            // Send the formData to OpenAI Whisper for transcription
            const transcription = yield openai.audio.transcriptions.create({
                model: 'whisper-1',
                file: formData, // Cast to 'any' because OpenAI API expects a File-like object
                response_format: 'text',
            });
            return transcription.text;
        }
        catch (error) {
            console.error('Error transcribing video:', error);
            throw new Error('Transcription failed');
        }
    });
}
// Example usage
const videoKey = '6809834735611710721.mp4'; // Replace with the actual S3 key for the video
transcribeVideoFromS3(videoKey)
    .then(transcript => {
})
    .catch(error => {
    console.error('Error:', error);
});
