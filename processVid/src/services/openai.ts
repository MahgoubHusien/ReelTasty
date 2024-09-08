import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',  
});


export async function getOpenAIResponse(userMessage: string): Promise<string> {
  if (!openai.apiKey) {
    throw new Error("OpenAI API key is missing. Please set OPENAI_API_KEY in the environment.");
  }

  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || '',  
      messages: [{ role: "user", content: userMessage }],
    });

    const botMessage = response.choices[0]?.message?.content?.trim();
    
    if (!botMessage) {
      throw new Error("No response from OpenAI.");
    }

    return botMessage;
  } catch (error) {
    console.error("Error with OpenAI API request:", error);
    throw new Error("Failed to fetch response from OpenAI.");
  }
}
