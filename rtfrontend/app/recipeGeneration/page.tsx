"use client";

import React, { useEffect, useState } from "react";
import VideoGrid from "../../components/ui/VideoGrid";
import { fetchVideos } from "../../service/api";

const hashtags = [
  'healthyrecipe', 'comfortfood', 'snacks', 
  'desserts', 'quickmeals',  'veganrecipe', 'asianrecipes', 'grilledfoodrecipe',
  'creativefoods', 'brunchfood', 'friedfoods', 'fusion', 'desserttrends',
  'cookinghacks', 'globalcuisine', 'homecooking', 'diytakeout', 'recipe', 'cooking', 'baking', 'trendfoodrecipe'
];

const TrendingFoodsPage: React.FC = () => {
  const [videos, setVideos] = useState<{ [key: string]: any[] }>({});

  useEffect(() => {
    const fetchAllVideos = async () => {
      const videoData: { [key: string]: any[] } = {};
      for (const hashtag of hashtags) {
        const data = await fetchVideos(hashtag);
        videoData[hashtag] = data;
      }
      setVideos(videoData);
    };

    fetchAllVideos();
  }, []);

  return (
    <div className="min-h-screen w-full bg-background dark:bg-background-dark text-foreground dark:text-foreground-dark py-8 px-4 pt-20">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold mb-6">Trending Food Videos</h2>
        {hashtags.map((hashtag) => (
          <VideoGrid key={hashtag} hashtag={hashtag} videos={videos[hashtag]} />
        ))}
      </div>
    </div>
  );
};

export default TrendingFoodsPage;
