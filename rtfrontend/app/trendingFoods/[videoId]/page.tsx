"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Chatbot from "@/components/ui/chatbot";
import { fetchVideos } from "@/service/api";
import { VideoMetaData } from "@/types/types";

const TikTokDetailPage: React.FC = () => {
  const { videoId } = useParams();
  const [videoData, setVideoData] = useState<VideoMetaData | null>(null);

  useEffect(() => {
    if (videoId) {
      const fetchData = async () => {
        const data = await fetchVideos(videoId as string);
        setVideoData(data);
      };
      fetchData();
    }
  }, [videoId]);

  if (!videoData) return <div>Loading...</div>;

  return (
    <div className="min-h-screen w-full bg-background dark:bg-background-dark text-foreground dark:text-foreground-dark py-4 px-2 pt-16">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row space-y-6 lg:space-y-0 lg:space-x-6 px-4">
        
        <div className="lg:w-2/3 bg-card dark:bg-card-dark p-4 rounded-lg shadow-lg">
          <video
            src={videoData.s3Url}
            controls
            className="w-full h-[500px] object-cover rounded-lg mb-4"
          />
          <div className="mt-3">
            <h1 className="text-xl font-bold mb-2 text-foreground dark:text-foreground-dark">
              {videoData.author}
            </h1>
            <p className="text-sm text-muted dark:text-muted-dark">
              {new Date(videoData.date).toLocaleDateString()}
            </p>
            <p className="mt-3 text-base text-foreground dark:text-foreground-dark">
              {videoData.description}
            </p>
            {videoData.hashtags && (
              <div className="flex flex-wrap gap-2 mt-3">
                {videoData.hashtags.split(',').map((tag) => (
                  <span key={tag} className="bg-primary text-white px-2 py-1 rounded-lg text-sm">
                    #{tag.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:w-1/3 flex flex-col space-y-4">
          <div className="bg-card dark:bg-card-dark p-4 rounded-lg shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Author Info</h2>
            <div className="flex items-center mb-4">
              <img
                src={videoData.avatarLarger}
                alt={videoData.author}
                className="w-12 h-12 rounded-full mr-4"
              />
              <div>
                <p className="text-lg font-semibold">{videoData.author}</p>
                <p className="text-sm text-muted dark:text-muted-dark">Followers: {videoData.authorStats?.followerCount ?? "N/A"}</p>
                <p className="text-sm text-muted dark:text-muted-dark">Following: {videoData.authorStats?.followingCount ?? "N/A"}</p>
                <p className="text-sm text-muted dark:text-muted-dark">Total Likes: {videoData.authorStats?.heartCount ?? "N/A"}</p>
                <p className="text-sm text-muted dark:text-muted-dark">Total Videos: {videoData.authorStats?.videoCount ?? "N/A"}</p>
              </div>
            </div>
          </div>

          <div className="bg-card dark:bg-card-dark p-4 rounded-lg shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Video Stats</h2>
            <div className="space-y-2 text-sm text-muted dark:text-muted-dark">
              <p>Likes: {videoData.stats?.diggCount ?? "N/A"}</p>
              <p>Comments: {videoData.stats?.commentCount ?? "N/A"}</p>
              <p>Shares: {videoData.stats?.shareCount ?? "N/A"}</p>
              <p>Play Count: {videoData.stats?.playCount ?? "N/A"}</p>
              <p>Collection Count: {videoData.stats?.collectCount ?? "N/A"}</p>
              <p>Created: {new Date(videoData.date).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 px-4">
        <Chatbot />
      </div>
    </div>
  );
};

export default TikTokDetailPage;
