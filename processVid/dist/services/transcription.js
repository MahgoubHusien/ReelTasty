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
exports.transcribeVideoFromS3 = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const openai_1 = require("openai");
const fs_1 = __importDefault(require("fs"));
const child_process_1 = require("child_process");
const util_1 = __importDefault(require("util"));
const path_1 = __importDefault(require("path"));
const execPromise = util_1.default.promisify(child_process_1.exec);
const s3 = new client_s3_1.S3Client({
    region: process.env.REGION,
    credentials: {
        accessKeyId: process.env.ACCESS_KEY_ID,
        secretAccessKey: process.env.SECRET_ACCESS_KEY,
    },
});
const openai = new openai_1.OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});
const transcribeVideoFromS3 = (videoKey) => __awaiter(void 0, void 0, void 0, function* () {
    const fullKey = `${videoKey}.mp4`;
    const params = { Bucket: process.env.S3_BUCKET_NAME, Key: fullKey };
    try {
        const { Body } = yield s3.send(new client_s3_1.GetObjectCommand(params));
        if (!Body) {
            throw new Error(`File with key "${fullKey}" not found in S3.`);
        }
        const videoFilePath = `/tmp/${fullKey}`;
        const mp3FilePath = `/tmp/${path_1.default.basename(fullKey, path_1.default.extname(fullKey))}.mp3`;
        const streamBody = Body;
        const fileStream = fs_1.default.createWriteStream(videoFilePath);
        streamBody.pipe(fileStream);
        yield new Promise((resolve, reject) => {
            fileStream.on('close', resolve);
            fileStream.on('error', reject);
        });
        yield execPromise(`ffmpeg -i ${videoFilePath} -q:a 0 -map a ${mp3FilePath}`);
        const transcription = yield openai.audio.transcriptions.create({
            file: fs_1.default.createReadStream(mp3FilePath),
            model: 'whisper-1',
            response_format: 'text',
        });
        if (fs_1.default.existsSync(videoFilePath)) {
            fs_1.default.unlinkSync(videoFilePath);
        }
        if (fs_1.default.existsSync(mp3FilePath)) {
            fs_1.default.unlinkSync(mp3FilePath);
        }
        return transcription;
    }
    catch (error) {
        console.error(`Error transcribing video with key "${fullKey}":`, error);
        throw new Error('Transcription failed');
    }
});
exports.transcribeVideoFromS3 = transcribeVideoFromS3;
