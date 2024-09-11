using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;  
using rtbackend.Models;
using Amazon.S3;
using Amazon.S3.Model;
using Amazon.S3.Transfer; 
using Newtonsoft.Json;



[ApiController]
[Route("api/[controller]")]
public class TikAPIController : ControllerBase
{
    private readonly TikApi _tikApi;
    
    public TikAPIController(TikApi tikApi)
    {
        _tikApi = tikApi;
    }

    [HttpPost("saveTranscription")]
    public async Task<IActionResult> SaveTranscription([FromBody] TranscriptionModel model)
    {
        if (string.IsNullOrEmpty(model.TranscriptionText))
        {
            return BadRequest("Transcription text is required.");
        }

        try
        {
            await _tikApi.SaveTranscription(model.UserId, model.VideoId, model.TranscriptionText);
            return Ok("Transcription saved successfully.");
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Error saving transcription: {ex.Message}");
        }
    }

    [HttpGet("getTranscription/{userId}/{videoId}")]
    public async Task<IActionResult> GetTranscription(string userId, string videoId)
    {
        try
        {
            var transcription = await _tikApi.GetTranscription(userId, videoId);
            if (string.IsNullOrEmpty(transcription))
            {
                return NotFound("Transcription not found.");
            }
            return Ok(new { transcription });
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Error retrieving transcription: {ex.Message}");
        }
    }

    [HttpPost("AddVideo")]
    public async Task<IActionResult> AddVideo([FromBody] VideoMetaData videoMetadata)
    {
        if (videoMetadata == null)
        {
            return BadRequest("Video metadata is null.");
        }

        try
        {
            await _tikApi.AddVideoAsync(videoMetadata);
            return Ok(new { message = "Video metadata added successfully." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }

    [HttpPost("UploadVideoToS3")]
    public async Task<IActionResult> UploadVideoToS3([FromForm] IFormFile file, [FromForm] string videoId)
    {
        if (file == null || string.IsNullOrEmpty(videoId))
        {
            return BadRequest("File or videoId is missing.");
        }

        var tempFileName = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString());

        try
        {
            using (var stream = new FileStream(tempFileName, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var s3Url = await _tikApi.UploadVideoToS3Async(tempFileName, videoId);

            return Ok(new { s3Url });
        }
        catch (AmazonS3Exception s3Ex)  
        {
            return StatusCode(500, $"S3 internal server error: {s3Ex.Message}");
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
        finally
        {
            if (System.IO.File.Exists(tempFileName))
            {
                System.IO.File.Delete(tempFileName);
            }
        }
    }


    [HttpGet("Video")]
    public async Task<IActionResult> GetVideoById([FromQuery] string videoId)
    {
        if (string.IsNullOrEmpty(videoId))
        {
            return BadRequest(new { error = "Video ID is required." });
        }

        try
        {
            var video = await _tikApi.GetVideoMetadataByIdAsync(videoId);
            if (video == null)
            {
                return Ok(new { video = (object)null });
            }

            return Ok(new { video });
        }
        catch (Exception ex)
        {
            return StatusCode((int)System.Net.HttpStatusCode.InternalServerError, new { error = "Error fetching video." });
        }
    }

    [HttpGet("VideoUrlbyId")]
    public async Task<IActionResult> GetVideoUrlById([FromQuery] string videoId)
    {
        if (string.IsNullOrEmpty(videoId))
        {
            return BadRequest("Video ID is required.");
        }

        try
        {
            var url = await _tikApi.GetVideoUrlByIdAsync(videoId);
            if (url == null)
            {
                return NotFound("Video not found or unable to generate URL.");
            }

            return Ok(new { url });
        }
        catch (Exception ex)
        {
            return StatusCode((int)System.Net.HttpStatusCode.InternalServerError, "Error fetching video URL.");
        }
    }

    [HttpGet("Videos")]
    public async Task<IActionResult> GetVideos([FromQuery] string? hashtag = null)
    {
        try
        {
            var videos = await _tikApi.GetVideoMetadataAsync(hashtag);
            return Ok(videos);
        }
        catch (Exception ex)
        {
            return StatusCode((int)System.Net.HttpStatusCode.InternalServerError, ex.Message);
        }
    }

    [HttpGet("VideoUrl")]
    public async Task<IActionResult> GetVideoUrl([FromQuery] string videoId)
    {
        if (string.IsNullOrWhiteSpace(videoId))
        {
            return BadRequest("Video ID cannot be empty.");
        }

        try
        {
            var videoUrl = await _tikApi.GetVideoUrlAsync(videoId);
            return Ok(new { VideoUrl = videoUrl });
        }
        catch (Exception ex)
        {
            return StatusCode((int)System.Net.HttpStatusCode.InternalServerError, ex.Message);
        }
    }

    [HttpDelete("RemoveVideo")]
    public async Task<IActionResult> RemoveVideo([FromQuery] string videoId)
    {
        if (string.IsNullOrWhiteSpace(videoId))
        {
            return BadRequest("Video ID cannot be empty.");
        }

        try
        {
            await _tikApi.RemoveVideoAsync(videoId);
            return Ok("Video removed successfully.");
        }
        catch (Exception ex)
        {
            return StatusCode((int)System.Net.HttpStatusCode.InternalServerError, ex.Message);
        }
        
    }

    [HttpPost("RecentlySeen")]
    public async Task<IActionResult> AddRecentlySeenVideo([FromBody] RecentlySeenRequest request)
    {
        if (request == null || request.UserId == Guid.Empty || string.IsNullOrEmpty(request.VideoId))
        {
            return BadRequest("Invalid request");
        }

        try
        {
            await _tikApi.AddRecentlySeenVideoAsync(request.UserId, request.VideoId);
            return Ok("Video added to recently seen list");
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }

    [HttpGet("RecentlySeen")]
    public async Task<IActionResult> GetRecentlySeenVideos([FromQuery] Guid userId)
    {
        if (userId == Guid.Empty)
        {
            return BadRequest("Invalid user ID");
        }

        try
        {
            var videos = await _tikApi.GetRecentlySeenVideosAsync(userId);
            return Ok(videos);
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }

    [HttpPost("SaveVideo")]
    [Authorize]
    public async Task<IActionResult> SaveVideo([FromBody] SaveVideoRequest request) 
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(request.VideoId))
        {
            return BadRequest("Invalid user ID or video ID.");
        }

        var result = await _tikApi.SaveVideoForUserAsync(userId, request.VideoId);

        if (!result)
        {
            return Conflict("Video is already saved.");
        }

        return Ok("Video saved successfully.");
    }


    [HttpGet("SavedVideos")]
    [Authorize]
    public async Task<ActionResult<List<VideoMetaData>>> GetSavedVideos()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrEmpty(userId))
        {
            return BadRequest("Invalid user ID.");
        }

        var savedVideos = await _tikApi.GetSavedVideosForUserAsync(userId);
        return Ok(savedVideos);
    }

    [HttpPost("UnsaveVideo")]
    [Authorize]
    public async Task<IActionResult> UnsaveVideo([FromBody] UnsaveVideoRequest request)
    {
        if (string.IsNullOrEmpty(request.VideoId))
        {
            return BadRequest("Video ID cannot be empty.");
        }

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrEmpty(userId))
        {
            return BadRequest("Invalid user ID.");
        }

        var result = await _tikApi.UnsaveVideoForUserAsync(userId, request.VideoId);

        if (!result)
        {
            return NotFound("Video not found in saved list.");
        }

        return Ok("Video unsaved successfully.");
    }


    [HttpGet("IsVideoSaved")]
    [Authorize]
    public async Task<IActionResult> IsVideoSaved([FromQuery] string videoId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(videoId))
        {
            return BadRequest("Invalid user ID or video ID.");
        }

        var isSaved = await _tikApi.CheckIfVideoIsSavedAsync(userId, videoId);
        return Ok(new { IsSaved = isSaved });
    }

    [HttpPost("SubmitTikTokLink")]
    public async Task<IActionResult> SubmitTikTokLink([FromBody] TikTokLinkSubmission model)
    {
        if (model == null || string.IsNullOrEmpty(model.TikTokLink) || string.IsNullOrEmpty(model.UserId))
        {
            return BadRequest("TikTok link and user ID are required.");
        }

        Console.WriteLine("Received JSON data: ");
        Console.WriteLine($"TikTokLink: {model.TikTokLink}");
        Console.WriteLine($"UserId: {model.UserId}");
        Console.WriteLine($"VideoMetaData: {JsonConvert.SerializeObject(model.VideoMetaData, Formatting.Indented)}");

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId) || userId != model.UserId)
        {
            return Unauthorized("User ID does not match.");
        }

        var result = await _tikApi.SubmitTikTokLinkAsync(userId, model.TikTokLink, model.VideoMetaData.VideoId);
        Console.WriteLine($"RESULTS: {result}");

        if (result)
        {
            return Ok(new { message = "TikTok link submitted successfully." });
        }

        return BadRequest("Failed to submit TikTok link.");
    }
    
    [Authorize]
    [HttpGet("GetSubmittedVideos")]
    public async Task<IActionResult> GetSubmittedVideos()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized("User not found.");
        }

        var videos = await _tikApi.GetSubmittedVideosByUserAsync(userId);


        return Ok(videos);
    }

    public class TranscriptionModel
    {
        public string UserId { get; set; }
        public string VideoId { get; set; }
        public string TranscriptionText { get; set; }
    }

    public class RecentlySeenRequest
    {
        public Guid UserId { get; set; }
        public string VideoId { get; set; }
    }

        public class UnsaveVideoRequest
    {
        public string VideoId { get; set; }
    }

    public class HashtagRequest
    {
        public List<string> Hashtags { get; set; }
        public int VideoCount { get; set; }
    }

    public class SaveVideoRequest
    {
        public Guid UserId { get; set; }
        public string VideoId { get; set; }
    }
}
