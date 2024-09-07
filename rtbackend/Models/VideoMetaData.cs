namespace rtbackend.Models
{
    public class VideoMetadata
    {
        public string VideoId { get; set; }
        public string Author { get; set; }
        public string Description { get; set; }
        public string Hashtags { get; set; }
        public string S3Url { get; set; }
        public int? DiggCount { get; set; }
        public int? CommentCount { get; set; }
        public int? ShareCount { get; set; }
        public int? PlayCount { get; set; }
        public int? CollectCount { get; set; }
        public DateTime? CreateTime { get; set; }
    }
}
