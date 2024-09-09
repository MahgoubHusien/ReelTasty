import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export const getOpenAIResponse = async (userMessage: string): Promise<string> => {
  if (!openai.apiKey) {
    throw new Error("OpenAI API key is missing. Please set OPENAI_API_KEY in the environment.");
  }

  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || '',  
      messages: [{ role: "user", content: userMessage }],
    });

    const botMessage = response.choices?.[0]?.message?.content?.trim();
    
    if (!botMessage) {
      throw new Error("OpenAI returned an empty response.");
    }

    return botMessage;
  } catch (error: any) {
    console.error("OpenAI API request failed:", error.message || error);
    throw new Error("Failed to fetch response from OpenAI.");
  }
};
