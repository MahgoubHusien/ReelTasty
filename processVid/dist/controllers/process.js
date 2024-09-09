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
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const tikapi_1 = __importDefault(require("tikapi"));
const cors_1 = __importDefault(require("cors"));
const pg_1 = require("pg");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
}));
const port = process.env.PORT || 3000;
const api = (0, tikapi_1.default)(process.env.TIKAPI_KEY);
const s3 = new aws_sdk_1.default.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
});
// List of hashtags to fetch
const hashtags = [
    "food",
    "cooking",
    "foodtok",
    "recipesoftiktok",
    "baking",
    "healthyfood",
    "tiktokfood"
];
const excludedKeywords = ['pork', 'bacon', 'ham', 'alcohol', 'wine', 'beer', 'whiskey', 'vodka'];
const storeVideoMetadataInDB = (videoMetadata) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const existingVideo = yield pool.query('SELECT video_id FROM tiktok_videos WHERE video_id = $1', [videoMetadata.videoId]);
        if ((_a = existingVideo.rowCount) !== null && _a !== void 0 ? _a : 0 > 0) {
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
        yield pool.query(query, values);
        console.log(`Video metadata stored for video ID: ${videoMetadata.videoId}`);
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
        const uploadResult = yield s3.upload(s3Params).promise();
        console.log(`Video uploaded to S3 with key: ${fileName}`);
        return uploadResult.Location;
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
        console.log(`Fetched initial videos for hashtag: ${hashtag}`);
        while (response) {
            const videos = ((_a = response === null || response === void 0 ? void 0 : response.json) === null || _a === void 0 ? void 0 : _a.itemList) || [];
            for (const item of videos) {
                const description = item.desc.toLowerCase();
                if (excludedKeywords.some(keyword => description.includes(keyword))) {
                    console.log(`Video with ID ${item.id} excluded due to matching keywords.`);
                    continue;
                }
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
                    console.log(`Video downloaded to: ${filePath}`);
                    videoMetadata.s3Url = yield uploadVideoToS3(filePath, videoMetadata.videoId);
                    yield storeVideoMetadataInDB(videoMetadata);
                    if (fs_1.default.existsSync(filePath)) {
                        fs_1.default.unlinkSync(filePath);
                        console.log(`Temporary file deleted: ${filePath}`);
                    }
                }
            }
            if (response.nextItems) {
                console.log('Fetching next items...');
                response = yield response.nextItems();
            }
            else {
                console.log('No more items to fetch.');
                break;
            }
        }
    }
    catch (err) {
        console.error(`Error processing hashtag videos for: ${hashtag}`, err);
    }
});
app.get('/fetchHashtagVideos', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        for (const hashtag of hashtags) {
            yield processHashtag(hashtag);
        }
        res.status(200).json({ message: 'Hashtag videos fetched and processed successfully.' });
    }
    catch (err) {
        console.error('Error fetching hashtag videos:', err);
        res.status(500).json({ error: 'Error fetching hashtag videos' });
    }
}));
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
