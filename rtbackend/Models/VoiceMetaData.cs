namespace rtbackend.Models 
{
    public class VideoMetadata
    {
        public string VideoId { get; set; }
        public string Author { get; set; }
        public string Description { get; set; }
        public string Hashtags { get; set; }
        public string S3Url { get; set; }
    }
}