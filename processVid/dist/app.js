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
const cors_1 = __importDefault(require("cors"));
const openai_1 = require("./services/openai");
const transcription_1 = require("./services/transcription");
const process_1 = require("./controllers/process");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
app.use(express_1.default.json());
app.get("/", (req, res) => {
    res.status(200).json({ message: "Welcome to the Video Processing and Chat API!" });
});
app.post("/api/chat", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { message, videoId } = req.body;
    if (!message || !videoId) {
        return res.status(400).json({ error: "Message and Video ID are required" });
    }
    try {
        const botResponse = yield (0, openai_1.getOpenAIResponse)(message);
        return res.status(200).json({ botMessage: botResponse });
    }
    catch (error) {
        console.error('Error getting response from OpenAI:', error);
        return res.status(500).json({ error: "Failed to get response from OpenAI" });
    }
}));
app.post("/api/transcribe", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { videoId } = req.body;
    if (!videoId) {
        return res.status(400).json({ error: "Video ID is required" });
    }
    try {
        const transcription = yield (0, transcription_1.transcribeVideoFromS3)(videoId);
        return res.status(200).json({ transcription });
    }
    catch (error) {
        console.error("Error transcribing video:", error);
        return res.status(500).json({ error: "Failed to transcribe video" });
    }
}));
app.get('/processVideo/:videoId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { videoId } = req.params;
    if (!videoId) {
        return res.status(400).json({ error: "Missing videoId parameter." });
    }
    try {
        const videoMetadata = yield (0, process_1.processVideo)(videoId);
        res.status(200).json({ message: "Video processed successfully", video: videoMetadata });
    }
    catch (error) {
        console.error('Error processing video:', error);
        res.status(500).json({ error: 'Error processing video' });
    }
}));
const hashtags = [
    "food",
    "cooking",
    "foodtok",
    "recipesoftiktok",
    "baking",
    "healthyfood",
    "tiktokfood"
];
app.get('/fetchHashtagVideos', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield Promise.all(hashtags.map(hashtag => (0, process_1.processHashtag)(hashtag)));
        res.status(200).json({ message: 'Hashtag videos fetched and processed successfully.' });
    }
    catch (err) {
        console.error('Error fetching hashtag videos:', err);
        res.status(500).json({ error: 'Error fetching hashtag videos' });
    }
}));
app.use((req, res) => {
    res.status(404).json({ error: "Not Found" });
});
const port = process.env.PORT;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
