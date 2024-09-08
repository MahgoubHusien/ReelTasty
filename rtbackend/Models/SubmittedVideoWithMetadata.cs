namespace rtbackend.Models
{
    public class SubmittedVideoWithMetadata
    {
        public int Id { get; set; } 
        public string UserId { get; set; } 
        public string TikTokLink { get; set; } 
        public DateTime SubmittedAt { get; set; }
        public VideoMetadata VideoMetaData { get; set; } 
    }
}
