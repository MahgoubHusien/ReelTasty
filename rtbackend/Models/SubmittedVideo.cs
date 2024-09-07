namespace rtbackend.Models
{
    public class SubmittedVideo
    {
        public int Id { get; set; }
        public string UserId { get; set; } 
        public string TikTokLink { get; set; } 
        public DateTime SubmittedAt { get; set; } 
    }
}
