namespace rtbackend.Models
{
    public class TikTokLinkSubmission
    {
        public int Id { get; set; }
        public string TikTokLink { get; set; }
        public string UserId { get; set; }
        public VideoMetaData VideoMetaData { get; set; }
        public DateTime SubmittedAt { get; set; }
    }

}
