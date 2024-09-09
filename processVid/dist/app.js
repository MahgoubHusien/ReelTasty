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
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const port = process.env.PORT || 3000;
app.post("/api/chat", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { message, userId, videoId } = req.body;
    console.log('Incoming chat request:', { userId, videoId, message });
    if (!message || !videoId) {
        console.log('Bad Request: Message and Video ID are required');
        return res.status(400).json({ error: "Message and Video ID are required" });
    }
    try {
        const botResponse = yield (0, openai_1.getOpenAIResponse)(message);
        console.log('OpenAI response:', botResponse);
        return res.status(200).json({ botMessage: botResponse });
    }
    catch (error) {
        console.error('Error getting response from OpenAI:', error);
        return res.status(500).json({ error: "Failed to get response from OpenAI" });
    }
}));
app.listen(port, () => { });
