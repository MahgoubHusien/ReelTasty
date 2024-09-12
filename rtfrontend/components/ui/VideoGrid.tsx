import React, { useState } from "react";
import VideoCard from "./VideoCard";
import { VideoMetaData } from "@/types/types";

interface VideoGridProps {
  hashtag: string;
  videos: VideoMetaData[];
}

const VideoGrid: React.FC<VideoGridProps> = ({ hashtag, videos }) => {
  const [visibleCount, setVisibleCount] = useState(15);

  const handleShowMore = () => {
    setVisibleCount((prevCount) => prevCount + 15);
  };

  const visibleVideos = videos.slice(0, visibleCount);

  return (
    <section className="mb-12">
      <div
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
        role="list"
        aria-label={`Videos for hashtag ${hashtag}`}
      >
        {visibleVideos && visibleVideos.length > 0 ? (
          visibleVideos.map((video) => (
            <VideoCard key={video.videoId} video={video} />
          ))
        ) : (
          <div className="flex items-center justify-center w-full">
            <p className="text-gray-500">No videos available.</p>
          </div>
        )}

        {videos.length > visibleCount && (
          <div className="flex justify-center items-center">
            <button
              onClick={handleShowMore}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
            >
              Show More
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default VideoGrid;
