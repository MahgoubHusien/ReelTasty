using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;
using rtbackend.Models;

[ApiController]
[Route("api/[controller]")]
public class TikAPIController : ControllerBase
{
    private readonly TikApi _tikApi;

    public TikAPIController(TikApi tikApi)
    {
        _tikApi = tikApi;
    }

    [HttpGet("Videos")]
    public async Task<IActionResult> GetVideos([FromQuery] string? hashtag = null)
    {
        try
        {
            var videos = await _tikApi.GetVideoMetadataAsync(hashtag);
            return Ok(videos);
        }
        catch (System.Exception ex)
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
        catch (System.Exception ex)
        {
            return StatusCode((int)System.Net.HttpStatusCode.InternalServerError, ex.Message);
        }
    }

    [HttpPost("AddVideo")]
    public async Task<IActionResult> AddVideo([FromBody] VideoMetadata videoMetadata)
    {
        if (videoMetadata == null)
        {
            return BadRequest("Video metadata cannot be null.");
        }

        try
        {
            await _tikApi.AddVideoAsync(videoMetadata);
            return Ok("Video added successfully.");
        }
        catch (System.Exception ex)
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
        catch (System.Exception ex)
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
