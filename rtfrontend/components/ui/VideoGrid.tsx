import React from "react";
import VideoCard from "./VideoCard";
import { VideoMetaData } from "@/types/types";

interface VideoGridProps {
  hashtag: string;
  videos: VideoMetaData[]; 
}

const VideoGrid: React.FC<VideoGridProps> = ({ hashtag, videos }) => {
  console.log(videos)
  return (
    <section className="mb-12">
      <div
        className="flex overflow-x-scroll space-x-4"
        role="list"
        aria-label={`Videos for hashtag ${hashtag}`}
      >
        {videos && videos.length > 0 ? (
          videos.map((video) => (
            <VideoCard key={video.videoId} video={video} />
          ))
        ) : (
          <div className="flex items-center justify-center w-full">
            <p className="text-gray-500">No videos available.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default VideoGrid;
