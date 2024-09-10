import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { getOpenAIResponse } from "./services/openai";
import { transcribeVideoFromS3 } from "./services/transcription";
import { processVideo } from "./controllers/process" 
import { processHashtag } from "./controllers/process" 

dotenv.config();

const app = express();
app.use(cors({
  origin: 'http://localhost:3000', 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
app.use(express.json());

const port = process.env.PORT;

app.post("/api/chat", async (req, res) => {
  const { message, userId, videoId } = req.body;


  if (!message || !videoId) {
    return res.status(400).json({ error: "Message and Video ID are required" });
  }

  try {
    const botResponse = await getOpenAIResponse(message);

    return res.status(200).json({ botMessage: botResponse });
  } catch (error) {
    console.error('Error getting response from OpenAI:', error);
    return res.status(500).json({ error: "Failed to get response from OpenAI" });
  }
});

app.post("/api/transcribe", async (req, res) => {
  const { videoId } = req.body;

  if (!videoId) {
    return res.status(400).json({ error: "Video ID is required" });
  }

  try {
    const transcription = await transcribeVideoFromS3(videoId); 
    return res.status(200).json({ transcription });
  } catch (error) {
    console.error("Error transcribing video:", error);
    return res.status(500).json({ error: "Failed to transcribe video" });
  }
});

// Define an API route for processing a specific video
app.get('/processVideo/:videoId', async (req, res) => {

  const { videoId } = req.params;


  if (!videoId) {
    return res.status(400).json({ error: "Missing videoId parameter." });
  }

  try {
    const videoMetadata = await processVideo(videoId);
    res.status(200).json({ message: "Video processed successfully", video: videoMetadata });
  } catch (error) {
    console.error('Error processing video:', error);
    res.status(500).json({ error: 'Error processing video' });
  }
});

const hashtags = [
  "food",
  "cooking",
  "foodtok",
  "recipesoftiktok",
  "baking",
  "healthyfood",
  "tiktokfood"
];


app.get('/fetchHashtagVideos', async (req, res) => {
  try {
    for (const hashtag of hashtags) {
      await processHashtag(hashtag);
    }
    res.status(200).json({ message: 'Hashtag videos fetched and processed successfully.' });
  } catch (err) {
    console.error('Error fetching hashtag videos:', err);
    res.status(500).json({ error: 'Error fetching hashtag videos' });
  }
});


app.listen(port, () => {});
