import React from "react";
import VideoCard from "./VideoCard";

interface VideoGridProps {
  hashtag: string;
  videos: any[];
}

const VideoGrid: React.FC<VideoGridProps> = ({ hashtag, videos }) => {
  return (
    <section className="mb-12">
      <div className="flex overflow-x-scroll space-x-4">
        {videos && videos.length > 0 ? (
          videos.map((video) => (
            <VideoCard key={video.videoId} video={video} />
          ))
        ) : (
          <p>No videos available.</p>
        )}
      </div>
    </section>
  );
};

export default VideoGrid;
