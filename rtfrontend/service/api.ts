import { VideoMetaData } from "../types/types";

export async function processVideo(videoId: string): Promise<{ videoId: string }> {
    const response = await fetch('/api/processVideo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId })
    });
  
    if (!response.ok) {
      throw new Error(`Failed to process video with ID: ${videoId}`);
    }
  
    const data = await response.json();
    return { videoId: data.videoId };
  }
  

export const fetchVideos = async (identifier: string, isVideoId: boolean = false): Promise<VideoMetaData[] | null> => {
    try {
        const queryParam = isVideoId ? `videoId=${encodeURIComponent(identifier)}` : `hashtag=${encodeURIComponent(identifier)}`;
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/TikAPI/Videos?${queryParam}`);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch ${isVideoId ? 'video' : 'videos'} with ${isVideoId ? 'ID' : 'hashtag'}: ${identifier}`);
        }

        const data = await response.json();
        
        if (!data || data.length === 0) {
            console.warn(`No ${isVideoId ? 'video' : 'videos'} found for ${isVideoId ? 'ID' : 'hashtag'}: ${identifier}`);
            return null;
        }

        return data;
    } catch (error) {
        console.error("Error fetching videos:", error);
        return null;
    }
};

export const fetchVideoUrl = async (videoId: string): Promise<string | null> => {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/TikAPI/VideoUrl?videoId=${encodeURIComponent(videoId)}`);
        if (!response.ok) {
            throw new Error("Failed to fetch video URL");
        }
        const data = await response.json();
        return data.videoUrl;
    } catch (error) {
        console.error("Error fetching video URL:", error);
        return null;
    }
};

export const addVideo = async (videoMetadata: VideoMetaData): Promise<boolean> => {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/TikAPI/AddVideo`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(videoMetadata),
        });
        
        if (!response.ok) {
            throw new Error("Failed to add video");
        }
        return true;
    } catch (error) {
        console.error("Error adding video:", error);
        return false;
    }
};

export const removeVideo = async (videoId: string): Promise<boolean> => {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/TikAPI/RemoveVideo?videoId=${encodeURIComponent(videoId)}`, {
            method: 'DELETE',
        });
        
        if (!response.ok) {
            throw new Error("Failed to remove video");
        }
        return true;
    } catch (error) {
        console.error("Error removing video:", error);
        return false;
    }
};

export const addToRecentlySeen = async (userId: string, videoId: string): Promise<boolean> => {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/TikAPI/RecentlySeen`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId, videoId }),
        });
        
        if (!response.ok) {
            throw new Error("Failed to add video to recently seen");
        }
        return true;
    } catch (error) {
        console.error("Error adding video to recently seen:", error);
        return false;
    }
};

export const fetchUserId = async (): Promise<string | null> => {
    const jwtToken = localStorage.getItem('authToken');
    
    if (!jwtToken) {
        console.error("JWT token not found in localStorage.");
        return null;
    }

    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/User/GetUserId`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${jwtToken}`,
            },
        });

        if (!response.ok) {
            throw new Error("Failed to fetch user ID");
        }

        const data = await response.json();
        return data.userId;
    } catch (error) {
        console.error("Error fetching user ID:", error);
        return null;
    }
};


export const fetchRecentlySeenVideos = async (): Promise<VideoMetaData[] | null> => {
    const userId = await fetchUserId();
    const jwtToken = localStorage.getItem('authToken');

    if (!userId) {
        console.error("User ID is not valid.");
        return null;
    }

    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/TikAPI/RecentlySeen?userId=${encodeURIComponent(userId)}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${jwtToken}`,
            },
        });

        if (!response.ok) {
            throw new Error("Failed to fetch recently seen videos");
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching recently seen videos:", error);
        return null;
    }
};


const isGuid = (value: string): boolean => {
    const guidPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    return guidPattern.test(value);
};

export const fetchVideoById = async (videoId: string): Promise<VideoMetaData | null> => {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/TikAPI/Video?videoId=${encodeURIComponent(videoId)}`);
        
        if (response.status === 404) {
            console.warn(`Video with ID: ${videoId} not found.`);
            return null;  
        }

        if (!response.ok) {
            throw new Error(`Failed to fetch video with ID: ${videoId}`);
        }

        const data = await response.json();
        return data as VideoMetaData;
    } catch (error) {
        console.error("Error fetching video by ID:", error);
        return null;  
    }
};


export const fetchVideoUrlById = async (videoId: string): Promise<string | null> => {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/TikAPI/VideoUrlbyId?videoId=${encodeURIComponent(videoId)}`);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch video URL for ID: ${videoId}`);
        }

        const data = await response.json();

        if (!data || !data.url) {
            console.warn(`No URL found for video ID: ${videoId}`);
            return null;
        }

        return data.url;
    } catch (error) {
        console.error("Error fetching video URL by ID:", error);
        return null;
    }
};

export const getSavedVideos = async (userId: string): Promise<VideoMetaData[] | null> => {
    try {
        const token = localStorage.getItem('authToken');

        if (!token) {
            console.error("User is not authenticated");
            return null;
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/TikAPI/SavedVideos?userId=${encodeURIComponent(userId)}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`, // Include auth token
            },
        });

        if (!response.ok) {
            throw new Error("Failed to fetch saved videos");
        }

        const data = await response.json();
        return data as VideoMetaData[];
    } catch (error) {
        console.error("Error fetching saved videos:", error);
        return null;
    }
};

export const saveVideoForUser = async (videoId: string): Promise<boolean> => {
    try {
        const token = localStorage.getItem('authToken');

        if (!token) {
            console.error("User is not authenticated");
            return false;
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/TikAPI/SaveVideo`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ videoId }),
        });

        if (!response.ok) {
            if (response.status === 409) {
                console.warn("Video is already saved.");
                return false; // Video already saved
            } else if (response.status === 401) {
                console.error("Unauthorized: Please log in again.");
                localStorage.removeItem('authToken');
                return false;
            } else {
                console.error(`Failed to save video: ${response.statusText}`);
                return false;
            }
        }

        return true;
    } catch (error) {
        console.error("Error saving video:", error);
        return false;
    }
};

export const unsaveVideoForUser = async (videoId: string): Promise<boolean> => {
    try {
        const token = localStorage.getItem('authToken');

        if (!token) {
            console.error("User is not authenticated");
            return false;
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/TikAPI/UnsaveVideo`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`, 
            },
            body: JSON.stringify({ videoId }), 
        });

        if (!response.ok) {
            if (response.status === 401) {
                console.error("Unauthorized: Please log in again.");
                localStorage.removeItem('authToken');
            } else {
                console.error(`Failed to unsave video: ${response.statusText}`);
            }
            return false;
        }

        return true;
    } catch (error) {
        console.error("Error unsaving video:", error);
        return false;
    }
};

export const checkIfVideoIsSaved = async (videoId: string): Promise<{ isSaved: boolean }> => {
    try {
        const token = localStorage.getItem('authToken');

        if (!token) {
            console.error("User is not authenticated");
            return { isSaved: false };
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/TikAPI/IsVideoSaved?videoId=${encodeURIComponent(videoId)}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error("Failed to check if video is saved");
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error checking if video is saved:", error);
        return { isSaved: false };
    }
};

export const fetchSavedVideos = async (): Promise<VideoMetaData[] | null> => {
    const userId = await fetchUserId();
    const jwtToken = localStorage.getItem('authToken');

    if (!userId) {
        console.error("User ID is not valid.");
        return null;
    }

    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/TikAPI/SavedVideos?userId=${encodeURIComponent(userId)}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${jwtToken}`,
            },
        });

        if (!response.ok) {
            throw new Error("Failed to fetch saved videos");
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching saved videos:", error);
        return null;
    }
};


export const fetchGeneratedVideos = async (): Promise<VideoMetaData[] | null> => {
    const token = localStorage.getItem('authToken');

    if (!token) {
        console.error("User is not authenticated");
        return null;
    }

    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/TikAPI/GeneratedVideos`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error("Failed to fetch generated videos");
        }

        const data = await response.json();
        return data as VideoMetaData[];
    } catch (error) {
        console.error("Error fetching generated videos:", error);
        return null;
    }
};


export const submitTikTokLink = async (tiktokLink: string): Promise<boolean> => {
    const userId = await fetchUserId();
    const token = localStorage.getItem('authToken');

    if (!userId || !token) {
        console.error("User is not authenticated");
        return false;
    }

    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/SubmittedVideo/SubmitTikTokLink`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ tiktokLink, userId }),
        });

        if (!response.ok) {
            throw new Error("Failed to submit TikTok link");
        }

        return true;
    } catch (error) {
        console.error("Error submitting TikTok link:", error);
        return false;
    }
};

export const fetchSubmittedVideos = async (): Promise<VideoMetaData[] | null> => {
    const token = localStorage.getItem('authToken');

    if (!token) {
        console.error("User is not authenticated");
        return null;
    }

    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/TikAPI/GetSubmittedVideos`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error("Failed to fetch submitted videos");
        }

        const data = await response.json();
        return data as VideoMetaData[];
    } catch (error) {
        console.error("Error fetching submitted videos:", error);
        return null;
    }
};