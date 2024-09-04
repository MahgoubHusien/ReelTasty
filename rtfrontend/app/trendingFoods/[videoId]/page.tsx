"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Chatbot from "@/components/ui/chatbot";
import {
  fetchVideoById,
  fetchVideoUrlById,
  saveVideoForUser,
  unsaveVideoForUser,
  checkIfVideoIsSaved,
  addToRecentlySeen,
  fetchUserId,
} from "@/service/api";
import { VideoMetaData } from "@/types/types";
import { AiOutlineRobot } from "react-icons/ai";

const TikTokDetailPage: React.FC = () => {
  const params = useParams();
  const videoId = params?.videoId as string | undefined;
  const [videoData, setVideoData] = useState<VideoMetaData | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (videoId) {
      const fetchData = async () => {
        try {
          console.log("Fetching video data for videoId:", videoId);

          const data = await fetchVideoById(videoId);
          const videoMetadata = data?.video; // Access the video data

          if (videoMetadata) {
            setVideoData(videoMetadata);
            const url = await fetchVideoUrlById(videoId);
            setVideoUrl(videoMetadata.s3Url || url);
            console.log("Fetched video URL:", url);

            const { isSaved } = await checkIfVideoIsSaved(videoId);
            setIsSaved(isSaved);

            const userId = await fetchUserId();
            if (userId) {
              const addedToRecentlySeen = await addToRecentlySeen(userId, videoId);
              if (!addedToRecentlySeen) {
                console.error("Failed to add video to recently seen.");
              }
            } else {
              console.error("User ID is not available.");
            }
          } else {
            setVideoData(null);
            setVideoUrl(null);
          }
        } catch (err: any) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [videoId]);

  const handleSave = async () => {
    if (videoId) {
      const result = await saveVideoForUser(videoId);
      if (result) {
        setIsSaved(true);
      }
    }
  };

  const handleUnsave = async () => {
    if (videoId) {
      const result = await unsaveVideoForUser(videoId);
      if (result) {
        setIsSaved(false);
      }
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!videoData || !videoUrl) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>No video details available.</p>
      </div>
    );
    }

  // Safely handle hashtags, ensuring it's either a string or array
  const hashtagsArray = Array.isArray(videoData.hashtags)
    ? videoData.hashtags
    : typeof videoData.hashtags === "string"
    ? videoData.hashtags.split(",")
    : [];

  return (
    <div className="min-h-screen w-full bg-background dark:bg-background-dark text-gray-900 dark:text-gray-100 py-8 px-2 pt-24">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-stretch space-y-6 lg:space-y-0 lg:space-x-4 px-2">
        
        {/* Video Section */}
        <div className="flex flex-col lg:w-1/3 bg-card dark:bg-card-dark p-2 rounded-lg shadow-lg">
          <video
            src={videoUrl}
            controls
            className="w-full h-[600px] object-cover rounded-lg mt-2"
          />
          <div className="mt-2 flex justify-center">
            {isSaved ? (
              <button
                onClick={handleUnsave}
                className="bg-red-500 text-white px-4 py-2 rounded-lg"
              >
                Unsave Video
              </button>
            ) : (
              <button
                onClick={handleSave}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg"
              >
                Save Video
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:w-1/3 bg-card dark:bg-card-dark p-4 rounded-lg shadow-lg overflow-y-auto max-h-[700px]">
          <div className="space-y-2 text-xs lg:text-sm text-gray-900 dark:text-gray-100">
            <h2 className="pt-1 text-lg font-semibold mb- text-gray-900 dark:text-gray-100">
              Author Stats
            </h2>
            <p>Author: {videoData.author}</p>
            <h2 className="pt-4 text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Video Stats
            </h2>
            <p>Likes: {videoData.diggCount ?? "N/A"}</p>
            <p>Comments: {videoData.commentCount ?? "N/A"}</p>
            <p>Shares: {videoData.shareCount ?? "N/A"}</p>
            <p>Play Count: {videoData.playCount ?? "N/A"}</p>
            <p>Collect Count: {videoData.collectCount ?? "N/A"}</p>

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

export default TikTokDetailPage;
