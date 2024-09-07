"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchVideoById, fetchVideoUrlById } from "@/service/api";
import { submitTikTokLink } from "@/service/api";
import { VideoMetaData } from "@/types/types";
import Chatbot from "@/components/ui/chatbot";
import { AiOutlineRobot } from "react-icons/ai";
import 'dotenv/config';

const VideoDetailPage: React.FC = () => {
  const params = useParams();
  const videoId = params?.videoId as string;
  const [videoData, setVideoData] = useState<VideoMetaData | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProcessedVideo = async (videoId: string) => {
    const res = await fetch(`http://localhost:8080/processVideo/${videoId}`);
    if (!res.ok) {
      throw new Error("Failed to process video");
    }
    return res.json();
  };

  useEffect(() => {
    if (videoId) {
      const fetchData = async () => {
        try {
          let videoResponse = await fetchVideoById(videoId);
          console.log("Fetched video metadata from .NET backend:", videoResponse);
  
          if (!videoResponse || !videoResponse.video) {
            console.log("Video not found in .NET backend, processing video in Node.js backend...");
            videoResponse = await fetchProcessedVideo(videoId);
            console.log("Processed video metadata from Node.js backend:", videoResponse);
          }
  
          const finalVideoMetadata = videoResponse?.video || videoResponse;
          console.log("Final video metadata:", finalVideoMetadata);
  
          if (finalVideoMetadata) {
            setVideoData(finalVideoMetadata);
            setVideoUrl(finalVideoMetadata.s3Url);
  
            const tiktokLink = `https://www.tiktok.com/${videoId}`;  
            await submitTikTokLink(tiktokLink, finalVideoMetadata);
          } else {
            throw new Error("Failed to fetch or process video metadata.");
          }
        } catch (err: any) {
          setError(err.message);
          console.error("Error fetching video data:", err);
        } finally {
          setLoading(false);
        }
      };
  
      fetchData();
    }
  }, [videoId]);
  
  

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center min-h-screen">{error}</div>;
  }

  if (!videoData || !videoUrl) {
    return <div className="flex items-center justify-center min-h-screen">No video details available.</div>;
  }

  return (
    <div className="min-h-screen w-full bg-background dark:bg-background-dark text-gray-900 dark:text-gray-100 py-8 px-2 pt-24">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-stretch space-y-6 lg:space-y-0 lg:space-x-4 px-2">
        
        {/* Video Section */}
        <div className="flex flex-col lg:w-1/3 bg-card dark:bg-card-dark p-2 rounded-lg shadow-lg">
          <video
            src={videoUrl}
            controls
            className="w-full h-[650px] object-cover rounded-lg mt-0.5"
          />
        </div>

        <div className="flex flex-col lg:w-1/3 bg-card dark:bg-card-dark p-4 rounded-lg shadow-lg overflow-y-auto max-h-[665px]">
          <div className="space-y-2 text-xs lg:text-sm text-gray-900 dark:text-gray-100">
            <h2 className="pt-1 text-lg font-semibold mb- text-gray-900 dark:text-gray-100">
              Author Stats
            </h2>
            <p>Author: {videoData.author}</p>
            <h2 className="pt-4 text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Video Stats
            </h2>
            <p>Likes: {videoData.stats?.diggCount ?? videoData?.diggCount ?? "N/A"}</p>
            <p>Comments: {videoData.stats?.commentCount ?? videoData?.commentCount ?? "N/A"}</p>
            <p>Shares: {videoData.stats?.shareCount ?? videoData?.shareCount ?? "N/A"}</p>
            <p>Play Count: {videoData.stats?.playCount ?? videoData?.playCount ?? "N/A"}</p>

            <h2 className="pt-4 text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Description
            </h2>
            <p className="text-sm lg:text-base text-gray-900 dark:text-gray-100">
              {videoData.description}
            </p>

            {Array.isArray(videoData.hashtags) ? (
              <div className="flex flex-wrap gap-2 mt-3">
                {videoData.hashtags.map((tag: string) => (
                  <span
                    key={tag}
                    className="bg-primary text-white px-2 py-1 rounded-lg text-xs lg:text-sm dark:bg-primary-dark"
                  >
                    #{tag.trim()}
                  </span>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 mt-3">
                {videoData.hashtags?.split(",").map((tag: string) => (
                  <span
                    key={tag}
                    className="bg-primary text-white px-2 py-1 rounded-lg text-xs lg:text-sm dark:bg-primary-dark"
                  >
                    #{tag.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Video Transcription Section */}
        <div className="flex flex-col lg:w-1/3 bg-card dark:bg-card-dark p-4 rounded-lg shadow-lg overflow-y-auto">
          <div className="mb-4">
            <h2 className="chatbot-name text-gray-900 dark:text-gray-100">
              Video Transcription
            </h2>
            <p>Transcription content here...</p>
          </div>
        </div>

        {/* Chatbot Section */}
        <div className="flex flex-col lg:w-2/5 bg-card dark:bg-card-dark p-4 rounded-lg shadow-lg h-[630px] lg:h-auto">
          <div className="chatbot-header flex items-center gap-4 mb-4">
            <AiOutlineRobot className="text-3xl text-primary dark:text-primary-dark" />
            <h2 className="chatbot-name text-gray-900 dark:text-gray-100">
              Reelest Bot
            </h2>
          </div>
          <div className="flex-grow h-full overflow-y-auto lg:overflow-hidden">
            <Chatbot videoId={videoId ?? ""} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoDetailPage;
