using rtbackend.Models;

namespace rtbackend.Models
{
    public class TikTokLinkSubmission
    {
        public string TikTokLink { get; set; }
        public string UserId { get; set; }
        public VideoMetadata VideoMetadata { get; set; } 
    }
}