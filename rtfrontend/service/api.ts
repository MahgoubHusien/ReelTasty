export const fetchVideos = async (hashtag: string) => {
    try {
        const response = await fetch(`http://localhost:5252/api/TikAPI/Videos?hashtag=${encodeURIComponent(hashtag)}`);
        if (!response.ok) {
        throw new Error("Failed to fetch videos");
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching videos:", error);
      return [];
    }
  };
  