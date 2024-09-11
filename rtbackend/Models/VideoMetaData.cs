using Newtonsoft.Json;

namespace rtbackend.Models
{
    public class VideoMetaData
    {
        [JsonProperty("videoId")]
        public string VideoId { get; set; }

        [JsonProperty("author")]
        public string Author { get; set; }

        [JsonProperty("description")]
        public string Description { get; set; }

        [JsonProperty("hashtags")]
        public string Hashtags { get; set; }

        [JsonProperty("s3Url")]
        public string S3Url { get; set; }

        [JsonProperty("avatarLargeUrl")]
        public string AvatarLargeUrl { get; set; }

        [JsonProperty("stats")]
        public VideoStats Stats { get; set; }

        [JsonProperty("collectCount")]
        public int? CollectCount { get; set; }  // This ensures CollectCount is included

        [JsonProperty("createTime")]
        public DateTime? CreateTime { get; set; }  // This ensures CreateTime is part of the model
    }

    public class VideoStats
    {
        [JsonProperty("playCount")]
        public int? PlayCount { get; set; }

        [JsonProperty("shareCount")]
        public int? ShareCount { get; set; }

        [JsonProperty("commentCount")]
        public int? CommentCount { get; set; }

        [JsonProperty("diggCount")]
        public int? DiggCount { get; set; }
    }
}
