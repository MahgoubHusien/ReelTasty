import React, { useState } from "react";

interface VideoCardProps {
  video: any;
}

const VideoCard: React.FC<VideoCardProps> = ({ video }) => {
  const [showMore, setShowMore] = useState(false);
  const maxDescriptionLength = 100;

  const toggleShowMore = () => {
    setShowMore((prevShowMore) => !prevShowMore);
  };

  return (
    <div className="bg-card dark:bg-card-dark p-4 rounded-lg shadow-lg hover:shadow-xl transition-shadow min-w-[250px]">
      <video
        src={video.s3Url}
        controls
        className="w-full h-[500px] object-cover rounded-lg mb-4"
      />
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center space-x-4">
          <img
            src={video.avatarLarger}
            alt={video.author}
            className="w-10 h-10 rounded-full"
          />
          <div>
            <h3 className="text-lg font-semibold text-foreground dark:text-foreground-dark">
              {video.author}
            </h3>
            <p className="text-sm text-muted dark:text-muted-dark">
              {new Date(video.date).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
      <p className="text-sm text-foreground dark:text-foreground-dark">
        {showMore || video.description.length <= maxDescriptionLength
          ? video.description
          : `${video.description.slice(0, maxDescriptionLength)}...`}
      </p>
      {video.description.length > maxDescriptionLength && (
        <button
          onClick={toggleShowMore}
          className="text-primary dark:text-primary-dark text-sm mt-2 underline hover:text-primary-light dark:hover:text-primary-light-dark"
        >
          {showMore ? "Show Less" : "Show More"}
        </button>
      )}

      <div className="mt-4">
        {video.stats && (
          <div className="flex justify-between text-sm text-muted dark:text-muted-dark">
            <span>Likes: {video.stats.diggCount ?? "N/A"}</span>
            <span>Comments: {video.stats.commentCount ?? "N/A"}</span>
            <span>Shares: {video.stats.shareCount ?? "N/A"}</span>
          </div>
        )}
        {video.authorStats && (
          <div className="flex justify-between text-sm text-muted dark:text-muted-dark mt-2">
            <span>Followers: {video.authorStats.followerCount ?? "N/A"}</span>
            <span>Following: {video.authorStats.followingCount ?? "N/A"}</span>
            <span>Videos: {video.authorStats.videoCount ?? "N/A"}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoCard;
