"use client";

import React, { useState } from "react";

const RecipeGenerationPage: React.FC = () => {
  const [videoLink, setVideoLink] = useState("");
  const [transcription, setTranscription] = useState("");
  const [generatedRecipe, setGeneratedRecipe] = useState("");
  const [chatMessages, setChatMessages] = useState<string[]>([]);
  const [message, setMessage] = useState("");

  const handleVideoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Example API call to get transcription (replace with your logic)
    try {
      const response = await fetch("/api/transcribe-video", {
        method: "POST",
        body: JSON.stringify({ videoLink }),
      });
      const data = await response.json();
      setTranscription(data.transcription);

      // Example API call to generate a recipe using ChatGPT
      const recipeResponse = await fetch("/api/generate-recipe", {
        method: "POST",
        body: JSON.stringify({ transcription: data.transcription }),
      });
      const recipeData = await recipeResponse.json();
      setGeneratedRecipe(recipeData.recipe);
    } catch (error) {
      console.error("Failed to process video. Please try again.");
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) return;

    setChatMessages((prev) => [...prev, `User: ${message}`]);

    // Example API call to ChatGPT for interaction
    try {
      const response = await fetch("/api/chatgpt", {
        method: "POST",
        body: JSON.stringify({ message }),
      });
      const data = await response.json();
      setChatMessages((prev) => [...prev, `ChatGPT: ${data.response}`]);
    } catch (error) {
      setChatMessages((prev) => [...prev, "ChatGPT: Unable to respond."]);
    }

    setMessage("");
  };

  return (
    <div className="min-h-screen w-full bg-background dark:bg-background-dark text-foreground dark:text-foreground-dark py-8 px-4 pt-20">
      <div className="max-w-7xl mx-auto">
        {/* Main Container */}
        <div className="flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-6">
          {/* Video Submission & Display */}
          <div className="flex-1 bg-card dark:bg-card-dark p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-4">Submit a Video Link</h2>
            <form onSubmit={handleVideoSubmit} className="space-y-4">
              <input
                type="text"
                value={videoLink}
                onChange={(e) => setVideoLink(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg text-gray-900 bg-gray-100 focus:outline-none focus:ring-primary-light focus:border-primary-light"
                placeholder="Enter the link to your cooking video"
                required
              />
              <button
                type="submit"
                className="w-full py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                Load Video
              </button>
            </form>
            {videoLink && (
              <div className="mt-6">
                <h3 className="text-xl font-semibold mb-4">Video Preview</h3>
                <div className="aspect-w-16 aspect-h-9">
                  <iframe
                    className="w-full h-full rounded-lg"
                    src={videoLink}
                    title="Video Preview"
                    frameBorder="0"
                    allowFullScreen
                  />
                </div>
              </div>
            )}
          </div>

          {/* Speech-to-Text Display */}
          <div className="flex-1 bg-card dark:bg-card-dark p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-4">Transcribed Text</h2>
            <div className="bg-gray-100 text-gray-900 p-4 rounded-lg overflow-y-auto max-h-64">
              {transcription || "Transcription will appear here after processing the video."}
            </div>
          </div>

          {/* Chatbot Interaction */}
          <div className="flex-1 bg-card dark:bg-card-dark p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-4">Chat with ChatGPT</h2>
            <div className="bg-gray-100 text-gray-900 p-4 rounded-lg overflow-y-auto max-h-64 mb-4">
              {chatMessages.map((msg, index) => (
                <p key={index} className={`mb-2 ${msg.startsWith("ChatGPT") ? "text-green-500" : "text-blue-500"}`}>
                  {msg}
                </p>
              ))}
            </div>
            <form onSubmit={handleChatSubmit} className="flex space-x-4">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-1 px-4 py-2 border rounded-lg text-gray-900 bg-gray-100 focus:outline-none focus:ring-primary-light focus:border-primary-light"
                placeholder="Ask a question or request cooking tips"
                required
              />
              <button
                type="submit"
                className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeGenerationPage;