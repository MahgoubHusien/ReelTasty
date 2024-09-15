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
exports.processVideo = exports.processHashtag = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const client_s3_1 = require("@aws-sdk/client-s3");
const tikapi_1 = __importDefault(require("tikapi"));
const pg_1 = require("pg");
dotenv_1.default.config();
const api = (0, tikapi_1.default)(process.env.TIKAPI_KEY);
const s3 = new client_s3_1.S3Client({
    credentials: {
        accessKeyId: process.env.ACCESS_KEY_ID || '',
        secretAccessKey: process.env.SECRET_ACCESS_KEY || '',
    },
    region: process.env.REGION || '',
});
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
});
const storeVideoMetadataInDB = (videoMetadata) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const existingVideo = yield pool.query('SELECT video_id FROM tiktok_videos WHERE video_id = $1', [videoMetadata.videoId]);
        if ((_a = existingVideo.rowCount) !== null && _a !== void 0 ? _a : 0 > 0) {
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
        yield pool.query(query, values);
    }
    catch (err) {
        console.error('Error storing video metadata:', err);
    }
});
const uploadVideoToS3 = (filePath, videoId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const fileContent = fs_1.default.readFileSync(filePath);
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
        const command = new client_s3_1.PutObjectCommand(s3Params);
        const uploadResult = yield s3.send(command);
        return `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/${fileName}`;
    }
    catch (err) {
        console.error('Error uploading video to S3:', err);
        throw err;
    }
});
const processHashtag = (hashtag) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        let response = yield api.public.hashtag({ name: hashtag });
        if (!(response === null || response === void 0 ? void 0 : response.json)) {
            throw new Error('No response from TikAPI.');
        }
        const hashtagId = response.json.challengeInfo.challenge.id;
        response = yield api.public.hashtag({ id: hashtagId });
        while (response) {
            const videos = ((_a = response === null || response === void 0 ? void 0 : response.json) === null || _a === void 0 ? void 0 : _a.itemList) || [];
            for (const item of videos) {
                const description = item.desc.toLowerCase();
                const videoMetadata = {
                    videoId: item.id,
                    author: item.author.nickname,
                    description: item.desc,
                    hashtags: ((_b = item.challengeInfoList) === null || _b === void 0 ? void 0 : _b.map((challenge) => challenge.challengeName).join(', ')) || '',
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
                const filePath = path_1.default.join('/tmp', `${videoMetadata.videoId}.mp4`);
                if (response.saveVideo) {
                    yield response.saveVideo(downloadAddr, filePath);
                    videoMetadata.s3Url = yield uploadVideoToS3(filePath, videoMetadata.videoId);
                    yield storeVideoMetadataInDB(videoMetadata);
                    if (fs_1.default.existsSync(filePath)) {
                        fs_1.default.unlinkSync(filePath);
                    }
                }
            }
            if (response.nextItems) {
                response = yield response.nextItems();
            }
            else {
                break;
            }
        }
    }
    catch (err) {
        console.error(`Error processing hashtag videos for: ${hashtag}`, err);
    }
});
exports.processHashtag = processHashtag;
const processVideo = (videoId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const videoResponse = yield api.public.video({ id: videoId });
        if (!(videoResponse === null || videoResponse === void 0 ? void 0 : videoResponse.json)) {
            throw new Error('No video data received from TikAPI.');
        }
        const item = videoResponse.json.itemInfo.itemStruct;
        const description = item.desc.toLowerCase();
        const videoMetadata = {
            videoId: item.id,
            author: item.author.nickname,
            description: item.desc,
            hashtags: ((_a = item.challengeInfoList) === null || _a === void 0 ? void 0 : _a.map((challenge) => challenge.challengeName).join(', ')) || '',
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
        const filePath = path_1.default.join('/tmp', `${videoMetadata.videoId}.mp4`);
        if (videoResponse.saveVideo) {
            yield videoResponse.saveVideo(downloadAddr, filePath);
            videoMetadata.s3Url = yield uploadVideoToS3(filePath, videoMetadata.videoId);
            yield storeVideoMetadataInDB(videoMetadata);
            if (fs_1.default.existsSync(filePath)) {
                fs_1.default.unlinkSync(filePath);
            }
            return videoMetadata;
        }
    }
    catch (error) {
        console.error(`Error processing video with ID ${videoId}:`, error);
        throw new Error(`Error processing video with ID ${videoId}`);
    }
});
exports.processVideo = processVideo;
