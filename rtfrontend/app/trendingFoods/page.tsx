"use client";

import React, { useEffect, useState } from "react";
import VideoGrid from "../../components/ui/VideoGrid";
import { fetchVideos } from "../../service/api";

const hashtags = [ "food", "cooking", "foodtok", "recipesoftiktok", "baking", "healthyfood", "tiktokfood"];
  

const TrendingFoodsPage: React.FC = () => {
  const [videos, setVideos] = useState<{ [key: string]: any[] }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllVideos = async () => {
      try {
        const videoData: { [key: string]: any[] } = {};
        for (const hashtag of hashtags) {
          const data = await fetchVideos(hashtag);
          videoData[hashtag] = data;
        }
        setVideos(videoData);
      } catch (err) {
        setError("Failed to fetch videos. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllVideos();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <p>Loading videos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background dark:bg-background-dark text-foreground dark:text-foreground-dark py-8 px-4 pt-20">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold mb-6">Trending Food Videos</h2>
        {hashtags.map((hashtag) => (
          <div key={hashtag} className="mb-12">
            <h3 className="text-2xl font-semibold mb-4">#{hashtag}</h3>
            <VideoGrid hashtag={hashtag} videos={videos[hashtag]} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrendingFoodsPage;
