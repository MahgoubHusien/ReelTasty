"use client";

import React, { useEffect, useState } from "react";
import VideoGrid from "../../components/ui/VideoGrid";
import { fetchRecentlySeenVideos, fetchSavedVideos, fetchSubmittedVideos, fetchUserId } from "@/service/api";
import { VideoMetaData } from "@/types/types"; 
import { useRouter } from "next/navigation";

const YourVideosPage: React.FC = () => {
  const [recentlySeenVideos, setRecentlySeenVideos] = useState<VideoMetaData[]>([]);
  const [savedVideos, setSavedVideos] = useState<VideoMetaData[]>([]);
  const [submittedVideos, setSubmittedVideos] = useState<VideoMetaData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState(true); 
  const router = useRouter(); 

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
    }
    setInitialLoading(false); 
  }, []);

  useEffect(() => {
    if (!isLoggedIn && !initialLoading) {
      router.push("/auth?view=login");
      return;
    }

    const fetchAllData = async () => {
      try {
        const userId = await fetchUserId();
        if (!userId) {
          throw new Error("User ID is missing");
        }

        const [recentlySeen, saved, submitted] = await Promise.all([
          fetchRecentlySeenVideos(),
          fetchSavedVideos(),
          fetchSubmittedVideos()
        ]);

        setRecentlySeenVideos(recentlySeen || []);
        setSavedVideos(saved || []);
        setSubmittedVideos(submitted || []);
      } catch (err) {
        setError("Failed to fetch videos. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (isLoggedIn && !initialLoading) {
      fetchAllData();
    }
  }, [isLoggedIn, initialLoading, router]);

  if (initialLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <p>Checking authentication status...</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <p>You must log in to view this page.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <p>Loading your videos...</p>
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
        <h2 className="text-3xl font-bold mb-6">Your Videos</h2>

        {recentlySeenVideos && recentlySeenVideos.length > 0 && (
          <div className="mb-12">
            <h3 className="text-2xl font-semibold mb-4">Recently Seen Videos</h3>
            <VideoGrid hashtag="recently-seen" videos={recentlySeenVideos} />
          </div>
        )}

        {savedVideos && savedVideos.length > 0 && (
          <div className="mb-12">
            <h3 className="text-2xl font-semibold mb-4">Saved Videos</h3>
            <VideoGrid hashtag="saved" videos={savedVideos} />
          </div>
        )}

        {submittedVideos && submittedVideos.length > 0 && (
          <div className="mb-12">
            <h3 className="text-2xl font-semibold mb-4">Submitted Videos</h3>
            <VideoGrid hashtag="submitted" videos={submittedVideos} />
          </div>
        )}

        {recentlySeenVideos.length === 0 && savedVideos.length === 0 && submittedVideos.length === 0 && (
          <div className="w-full text-center mt-12">
            <p className="text-gray-500">You don't have any videos yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default YourVideosPage;
