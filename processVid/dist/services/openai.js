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
exports.getOpenAIResponse = void 0;
const openai_1 = __importDefault(require("openai"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY || '',
});
const getOpenAIResponse = (userMessage) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    if (!openai.apiKey) {
        throw new Error("OpenAI API key is missing. Please set OPENAI_API_KEY in the environment.");
    }
    try {
        const response = yield openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || '',
            messages: [{ role: "user", content: userMessage }],
        });
        const botMessage = (_d = (_c = (_b = (_a = response.choices) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.content) === null || _d === void 0 ? void 0 : _d.trim();
        if (!botMessage) {
            throw new Error("OpenAI returned an empty response.");
        }
        return botMessage;
    }
    catch (error) {
        console.error("OpenAI API request failed:", error.message || error);
        throw new Error("Failed to fetch response from OpenAI.");
    }
});
exports.getOpenAIResponse = getOpenAIResponse;
