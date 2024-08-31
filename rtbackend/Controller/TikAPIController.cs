using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading.Tasks;

[ApiController]
[Route("api/[controller]")]
public class TikAPIController : ControllerBase
{
    private readonly TikApi _tikApi;

    public TikAPIController(TikApi tikApi)
    {
        _tikApi = tikApi;
    }

    [HttpGet("TrendingPosts")]
    public async Task<IActionResult> GetTrendingPosts(string sessionId = "0", string country = "us")
    {
        try
        {
            var response = await _tikApi.GetTrendingPostsAsync(sessionId, country);

            var jsonResponse = JsonDocument.Parse(response);
            var itemList = jsonResponse.RootElement.GetProperty("itemList").EnumerateArray();
            var trendingPosts = new List<object>();

            foreach (var item in itemList)
            {
                trendingPosts.Add(item);
            }

            return Ok(new { Posts = trendingPosts });
        }
        catch (HttpRequestException ex)
        {
            return StatusCode((int)System.Net.HttpStatusCode.InternalServerError, ex.Message);
        }
    }

    [HttpGet("PostsByHashtag")]
    public async Task<IActionResult> GetPostsByHashtag(string hashtagName)
    {
        if (string.IsNullOrWhiteSpace(hashtagName))
        {
            return BadRequest("Hashtag name cannot be empty.");
        }

        try
        {
            var hashtagId = await _tikApi.GetHashtagIdByNameAsync(hashtagName);
            var response = await _tikApi.GetPostsByHashtagIdAsync(hashtagId);

            var jsonResponse = JsonDocument.Parse(response);
            var itemList = jsonResponse.RootElement.GetProperty("itemList").EnumerateArray();
            var hashtagPosts = new List<object>();

            foreach (var item in itemList)
            {
                hashtagPosts.Add(item);
            }

            return Ok(new { Posts = hashtagPosts });
        }
        catch (HttpRequestException ex)
        {
            return StatusCode((int)System.Net.HttpStatusCode.InternalServerError, ex.Message);
        }
    }

    [HttpPost("DownloadAndUploadVideo")]
    public async Task<IActionResult> DownloadAndUploadVideo(string downloadAddr, string fileName, string videoId, string author, string description, string hashtags)
    {
        try
        {
            var s3Url = await _tikApi.DownloadAndUploadVideoAsync(downloadAddr, fileName, videoId, author, description, hashtags);
            return Ok(new { S3Url = s3Url });
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode((int)System.Net.HttpStatusCode.InternalServerError, ex.Message);
        }
    }

    [HttpPost("TestDownloadAndStore")]
    public async Task<IActionResult> TestDownloadAndStore()
    {
        try
        {
            await _tikApi.TestDownloadAndStoreTikTokVideosAsync();
            return Ok("Test completed successfully.");
        }
        catch (Exception ex)
        {
            return StatusCode((int)System.Net.HttpStatusCode.InternalServerError, ex.Message);
        }
    }

    [HttpPost("ProcessHashtags")]
    public async Task<IActionResult> ProcessHashtags([FromBody] HashtagRequest request)
    {
        if (request == null || request.Hashtags == null || !request.Hashtags.Any())
        {
            return BadRequest("Hashtags cannot be null or empty.");
        }

        try
        {
            await _tikApi.ProcessHashtagsAsync(request.Hashtags, request.VideoCount);
            return Ok("Hashtags processed successfully.");
        }
        catch (Exception ex)
        {
            return StatusCode((int)System.Net.HttpStatusCode.InternalServerError, ex.Message);
        }
    }

    public class HashtagRequest
    {
        public List<string> Hashtags { get; set; }
        public int VideoCount { get; set; }
    }
}
