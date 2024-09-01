export interface VideoStats {
    diggCount?: number;
    commentCount?: number;
    shareCount?: number;
    playCount?: number;
    collectCount?: number;
  }
  
  export interface AuthorStats {
    followerCount?: number;
    followingCount?: number;
    friendCount?: number;
    heartCount?: number;
    videoCount?: number;
  }
  
  export interface VideoMetaData {
    videoId: string;
    s3Url: string;
    avatarLarger: string;
    author: string;
    date: string;
    description: string;
    hashtags: string; 
    stats?: VideoStats;
    authorStats?: AuthorStats;
  }
  