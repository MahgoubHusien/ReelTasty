export interface AuthorStats {
    diggCount?: number;
    followerCount?: number;
    followingCount?: number;
    friendCount?: number;
    heartCount?: number;
    videoCount?: number;
}

export interface VideoMetaData {
    videoId: string;
    s3Url: string;
    avatarLarger?: string;
    author: string;
    date?: string;
    description: string;
    hashtags: string | string[];
    collectCount?: number;
    commentCount?: number;
    diggCount?: number;
    playCount?: number;
    shareCount?: number;
  }
  
export interface TikTokLinkSubmissionWithMetadata {
    id: number;
    userId: string;
    tikTokLink: string;
    submittedAt: string;
    videoMetaData: VideoMetaData;
  }
  