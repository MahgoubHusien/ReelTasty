import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { getOpenAIResponse } from "./services/openai";
import { transcribeVideoFromS3 } from "./services/transcription"; 

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 3000;

app.post("/api/chat", async (req, res) => {
  const { message, userId, videoId } = req.body;

  console.log('Incoming chat request:', { userId, videoId, message });

  if (!message || !videoId) {
    console.log('Bad Request: Message and Video ID are required');
    return res.status(400).json({ error: "Message and Video ID are required" });
  }

  try {
    const botResponse = await getOpenAIResponse(message);
    console.log('OpenAI response:', botResponse);

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

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
