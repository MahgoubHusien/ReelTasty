"use strict";
// import express, { Request, Response } from 'express';
// import OpenAI from 'openai';
// import axios from 'axios';
// require('dotenv').config();
// const openAIClient = new OpenAI({
//     apiKey: process.env.OPENAI_API,
// })
// const chatCompletion = await openAIClient.chat.completions.create({
//     model: 'gpt-3.5-turbo',
//     messages: [
//         { role: 'system', content: 'You are a helpful assistant.' },
//         { role: 'user', content: 'What is the meaning of life?' },
//     ],
// });
// const router = express.Router();
// // POST /api/chat
// router.post('/chat', async (req: Request, res: Response) => {
//   const { userId, videoId, userMessage } = req.body;
//   if (!userMessage || !userId || !videoId) {
//     return res.status(400).json({ error: 'Missing required fields.' });
//   }
//   try {
//     // Call OpenAI API to get a response
//     const completion = await openai.createCompletion({
//       model: 'text-davinci-003',
//       prompt: userMessage,
//       max_tokens: 100,
//     });
//     const botMessage = completion.data.choices[0]?.text?.trim() || 'No response from AI.';
//     // Send the user message and bot response to .NET for storage
//     await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/chat`, {
//       userId,
//       videoId,
//       userMessage,
//       botMessage,
//     });
//     return res.json({ botMessage });
//   } catch (err) {
//     console.error('Error generating AI response:', err);
//     return res.status(500).json({ error: 'Error generating response.' });
//   }
// });
// export default router;
