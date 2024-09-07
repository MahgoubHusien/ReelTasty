"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

const RecipeGenerationPage: React.FC = () => {
  const [videoLink, setVideoLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleVideoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
  
    try {
      const urlPattern = /video\/(\d+)/;
      const match = videoLink.match(urlPattern);
  
      if (match && match[1]) {
        const videoId = match[1];
        console.log("Extracted Video ID:", videoId);
  
        router.push(`/recipeGeneration/${encodeURIComponent(videoId)}`);
      } else {
        setError('Invalid TikTok video link.');
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center">
      <form onSubmit={handleVideoSubmit} className="w-full max-w-lg bg-card dark:bg-card-dark p-4 rounded-lg shadow-lg">
        <div className="mb-4">
          <label htmlFor="videoLink" className="block text-foreground dark:text-white mb-2">
            Enter TikTok Video Link
          </label>
          <input
            type="text"
            id="videoLink"
            value={videoLink}
            onChange={(e) => setVideoLink(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg dark:border-gray-700 dark:bg-background-dark text-foreground dark:text-white"
            placeholder="Enter the TikTok video link"
          />
        </div>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <button
          type="submit"
          className="w-full bg-primary text-white py-2 rounded-lg hover:bg-primary-dark transition-all"
        >
          Generate Recipe
        </button>
      </form>
    </div>
  );
};

export default RecipeGenerationPage;
