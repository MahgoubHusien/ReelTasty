import Link from 'next/link';
import { VideoMetaData } from "@/types/types";
import React, { useState } from "react";

interface VideoCardProps {
  video: VideoMetaData;
}

const VideoCard: React.FC<VideoCardProps> = ({ video }) => {
  const [showMore, setShowMore] = useState(false);
  const maxDescriptionLength = 80;

  const toggleShowMore = () => {
    setShowMore((prevShowMore) => !prevShowMore);
  };

  return (
    <Link href={`/trendingFoods/${video.videoId}`}>
      <div className="cursor-pointer bg-card dark:bg-card-dark p-4 rounded-lg shadow-lg hover:shadow-xl transition-shadow min-w-[250px] h-[620px]">
        <video
          src={video.s3Url}
          controls
          className="w-full h-[400px] object-cover rounded-lg mb-4"
        />
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center space-x-4">
            <div>
              <h3 className="text-lg font-semibold text-black dark:text-white">
                {video.author}
              </h3>
            </div>
          </div>
        </div>
        
        {video.description ? (
          <>
            <p className="text-sm text-black dark:text-white">
              {showMore || video.description.length <= maxDescriptionLength
                ? video.description
                : `${video.description.slice(0, maxDescriptionLength)}...`}
            </p>
            {video.description.length > maxDescriptionLength && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  toggleShowMore();
                }}
                className="text-primary dark:text-primary-dark text-sm mt-2 underline hover:text-primary-light dark:hover:text-primary-light-dark"
              >
                {showMore ? "Show Less" : "Show More"}
              </button>
            )}
          </>
        ) : (
          <p className="text-sm text-muted dark:text-muted-dark">No description available.</p>
        )}
      </div>
    </Link>
  );
};

export default VideoCard;
