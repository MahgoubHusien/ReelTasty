"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchVideoById, fetchVideoUrlById, checkIfVideoIsSaved, saveVideoForUser, unsaveVideoForUser, fetchUserId, addToRecentlySeen, fetchTranscription } from "@/service/api";
import { submitTikTokLink } from "@/service/api";
import { VideoMetaData } from "@/types/types";
import 'dotenv/config';
import { AiOutlineLoading3Quarters, AiOutlineRobot } from "react-icons/ai";
import Chatbot from "@/components/ui/chatbot";

const VideoDetailPage: React.FC = () => {
  const params = useParams();
  const videoId = params?.videoId as string;
  const [videoData, setVideoData] = useState<VideoMetaData | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [recipe, setRecipe] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  const fetchProcessedVideo = async (videoId: string) => {
    try {
      const res = await fetch(`http://localhost:8080/processVideo/${videoId}`);
      if (!res.ok) {
        throw new Error("Failed to process video");
      }
      return await res.json();
    } catch (error) {
      console.error(`Error processing video: ${error}`);
      throw error;
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    setIsLoggedIn(!!token);

    if (videoId) {
      const fetchData = async () => {
        try {
          setLoading(true); // Start loading state

          // First, attempt to fetch the video by ID
          let videoResponse = await fetchVideoById(videoId);
          let videoMetadata = videoResponse?.video;

          // If video metadata is not found, process the video
          if (!videoMetadata) {
            videoResponse = await fetchProcessedVideo(videoId);
            videoMetadata = videoResponse?.video || videoResponse;
          }

          // Only proceed if videoMetadata is available
          if (videoMetadata) {
            setVideoData(videoMetadata);
            const url = await fetchVideoUrlById(videoId);
            setVideoUrl(videoMetadata.s3Url || url);

            // Handle TikTok link submission if not already done
            if (!isSubmitted) {
              const tiktokLink = `https://www.tiktok.com/${videoId}`;
              await submitTikTokLink(tiktokLink, videoMetadata);
              setIsSubmitted(true);
            }

            // Fetch transcription data
            const transcriptionData = await fetchTranscription(videoId);
            setTranscription(transcriptionData);

            // Generate a recipe based on transcription and video metadata
            if (transcriptionData) {
              const combinedText = `
                Video Description: ${videoMetadata.description || 'No description available'}.
                Transcription: ${transcriptionData || 'No transcription available'}.
              `;
              const recipeResponse = await fetch(`${process.env.NEXT_PUBLIC_NODE_API_BASE_URL}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  message: `Using the following combined text, generate a detailed recipe. It must look pretty and readable for the user. It should be sequential with numbers and spaces in between each.: ${combinedText}`,
                  videoId,
                }),
              });
              const { botMessage } = await recipeResponse.json();
              setRecipe(botMessage);
            }

            // Handle user actions (saving video, etc.) if logged in
            if (isLoggedIn) {
              const { isSaved } = await checkIfVideoIsSaved(videoId);
              setIsSaved(isSaved);

              const fetchedUserId = await fetchUserId();
              if (fetchedUserId) {
                setUserId(fetchedUserId);
                await addToRecentlySeen(fetchedUserId, videoId);
              }
            }
          } else {
            // Handle the case where no video metadata is found
            setVideoData(null);
            setVideoUrl(null);
          }
        } catch (err) {
          console.error("Error occurred during fetchData:", err);
          setError(err.message);
        } finally {
          setLoading(false); // End loading state
        }
      };

      fetchData();
    }
  }, [videoId, isSubmitted, isLoggedIn]);


  const handleSave = async () => {
    if (!isLoggedIn) {
      alert("Please log in to save videos.");
      return;
    }

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
    return (
      <div className="flex items-center justify-center min-h-screen">
        <AiOutlineLoading3Quarters className="animate-spin text-4xl text-primary" />
      </div>
    );
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

        {/* Video Meta Data Section */}
        <div className="flex flex-col lg:w-1/3 bg-card dark:bg-card-dark p-4 rounded-lg shadow-lg overflow-y-auto max-h-[670px]">
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

        <div className="flex flex-col lg:w-1/3 bg-card dark:bg-card-dark p-4 rounded-lg shadow-lg overflow-y-auto h-[670px]">
          <div className="mb-4">
            <h2 className="chatbot-name text-gray-900 dark:text-gray-100">
              Recipe
            </h2>
            <p>{recipe ? recipe : "Generating recipe..."}</p>
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
            <Chatbot videoId={videoId ?? ""} userId={userId ?? ""} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoDetailPage;
