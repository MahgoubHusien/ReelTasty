using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Amazon.S3;
using rtbackend.Models;
using Npgsql;

public class TikApi
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;
    private readonly S3Service _s3Service;
    private readonly string _connectionString;

    public TikApi(HttpClient httpClient, S3Service s3Service)
    {
        _httpClient = httpClient ?? throw new ArgumentNullException(nameof(httpClient));
        _apiKey = Environment.GetEnvironmentVariable("TIKAPI_KEY") ?? throw new InvalidOperationException("TikApiKey is not set in the environment variables.");
        _s3Service = s3Service ?? throw new ArgumentNullException(nameof(s3Service));

        var dbHost = Environment.GetEnvironmentVariable("DB_HOST") ?? throw new InvalidOperationException("DB_HOST is not set in the environment variables.");
        var dbName = Environment.GetEnvironmentVariable("DB_NAME") ?? throw new InvalidOperationException("DB_NAME is not set in the environment variables.");
        var dbUser = Environment.GetEnvironmentVariable("DB_USER") ?? throw new InvalidOperationException("DB_USER is not set in the environment variables.");
        var dbPassword = Environment.GetEnvironmentVariable("DB_PASSWORD") ?? throw new InvalidOperationException("DB_PASSWORD is not set in the environment variables.");
        var dbPort = Environment.GetEnvironmentVariable("DB_PORT");

        _connectionString = $"Host={dbHost};Database={dbName};Username={dbUser};Password={dbPassword};Port={dbPort}";
    }

    public async Task<string> GetTrendingPostsAsync(string sessionId, string country)
    {
        var requestUrl = $"https://api.tikapi.io/public/explore?session_id={sessionId}&country={country}";
        return await SendApiRequestAsync(requestUrl);
    }

    public async Task<string> GetHashtagIdByNameAsync(string hashtagName)
    {
        Console.WriteLine($"Fetching hashtag ID for: {hashtagName}");
        
        var requestUrl = $"https://api.tikapi.io/public/hashtag?name={Uri.EscapeDataString(hashtagName)}";
        var jsonResponse = await SendApiRequestAsync(requestUrl);

        var json = JsonDocument.Parse(jsonResponse);
        var hashtagId = json.RootElement
            .GetProperty("challengeInfo")
            .GetProperty("challenge")
            .GetProperty("id")
            .GetString();

        Console.WriteLine($"Received hashtag ID: {hashtagId}");
        return hashtagId ?? throw new InvalidOperationException("Failed to retrieve hashtag ID.");
    }

    public async Task<string> GetPostsByHashtagIdAsync(string hashtagId, int count = 30, string? cursor = null, string country = "us")
    {
        Console.WriteLine($"Fetching posts for hashtag ID: {hashtagId}");
        
        var requestUrl = $"https://api.tikapi.io/public/hashtag?id={hashtagId}&count={count}&country={country}";
        if (!string.IsNullOrEmpty(cursor))
        {
            requestUrl += $"&cursor={cursor}";
        }
        return await SendApiRequestAsync(requestUrl);
    }

    private async Task<string> SendApiRequestAsync(string requestUrl)
    {
        var request = new HttpRequestMessage(HttpMethod.Get, requestUrl);
        request.Headers.Add("X-API-KEY", _apiKey);
        request.Headers.Add("accept", "application/json");

        Console.WriteLine($"Sending API request to: {requestUrl}");
        
        var response = await _httpClient.SendAsync(request);
        response.EnsureSuccessStatusCode();
        var responseContent = await response.Content.ReadAsStringAsync();

        Console.WriteLine($"Received response: {responseContent.Substring(0, Math.Min(100, responseContent.Length))}...");
        return responseContent;
    }

    public async Task<string> DownloadAndUploadVideoAsync(string downloadAddr, string fileName, string videoId, string author, string description, string hashtags)
    {
        if (string.IsNullOrEmpty(downloadAddr)) throw new ArgumentNullException(nameof(downloadAddr));
        if (string.IsNullOrEmpty(fileName)) throw new ArgumentNullException(nameof(fileName));
        if (string.IsNullOrEmpty(videoId)) throw new ArgumentNullException(nameof(videoId));

        try
        {
            Console.WriteLine($"Downloading video from: {downloadAddr}");
            var localFilePath = await DownloadVideoAsync(downloadAddr, fileName);

            Console.WriteLine($"Uploading video to S3: {fileName}");
            var s3Url = await _s3Service.UploadFileAsync(localFilePath, fileName);

            if (File.Exists(localFilePath))
            {
                File.Delete(localFilePath);
                Console.WriteLine($"Deleted local video file: {localFilePath}");
            }

            await SaveVideoMetadataAsync(videoId, author, description, hashtags, s3Url);

            return s3Url;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in DownloadAndUploadVideoAsync: {ex.Message}");
            throw;
        }
    }

    public async Task ProcessHashtagsAsync(IEnumerable<string> hashtags, int videoCount = 30)
    {
        foreach (var hashtag in hashtags)
        {
            try
            {
                Console.WriteLine($"Processing hashtag: {hashtag} with video count: {videoCount}");
                await ProcessHashtagAsync(hashtag, videoCount);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error processing hashtag {hashtag}: {ex.Message}");
            }
        }
    }

    public async Task<IEnumerable<VideoMetadata>> GetStoredVideoMetadataAsync(string hashtag = null)
    {
        Console.WriteLine("Fetching stored video metadata...");
        
        using var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = "SELECT video_id, author, description, hashtags, s3_url FROM tiktok_videos";
        var parameters = new List<NpgsqlParameter>();

        if (!string.IsNullOrEmpty(hashtag))
        {
            query += " WHERE hashtags LIKE @Hashtag";
            parameters.Add(new NpgsqlParameter("@Hashtag", $"%{hashtag}%"));
        }

        using var cmd = new NpgsqlCommand(query, connection);
        cmd.Parameters.AddRange(parameters.ToArray());

        using var reader = await cmd.ExecuteReaderAsync();
        var results = new List<VideoMetadata>();

        while (await reader.ReadAsync())
        {
            results.Add(new VideoMetadata
            {
                VideoId = reader.GetString(0),
                Author = reader.GetString(1),
                Description = reader.GetString(2),
                Hashtags = reader.GetString(3),
                S3Url = reader.GetString(4)
            });
        }

        Console.WriteLine($"Retrieved {results.Count} video metadata entries.");
        return results;
    }

    private async Task<string> DownloadVideoAsync(string downloadAddr, string fileName)
    {
        Console.WriteLine($"Initiating download for video: {fileName} from {downloadAddr}");
        
        var downloadRequest = new HttpRequestMessage(HttpMethod.Get, downloadAddr);
        var downloadResponse = await _httpClient.SendAsync(downloadRequest);
        downloadResponse.EnsureSuccessStatusCode();

        var localFilePath = Path.Combine(Path.GetTempPath(), fileName);

        using (var fs = new FileStream(localFilePath, FileMode.Create, FileAccess.Write, FileShare.None))
        {
            await downloadResponse.Content.CopyToAsync(fs);
        }

        Console.WriteLine($"Video downloaded to: {localFilePath}");
        return localFilePath;
    }

    private async Task SaveVideoMetadataAsync(string videoId, string author, string description, string hashtags, string s3Url)
    {
        Console.WriteLine($"Saving video metadata for video ID: {videoId}");
        
        using var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = @"INSERT INTO tiktok_videos (video_id, author, description, hashtags, s3_url) 
                      VALUES (@VideoId, @Author, @Description, @Hashtags, @S3Url)
                      ON CONFLICT (video_id) DO UPDATE 
                      SET author = @Author, description = @Description, hashtags = @Hashtags, s3_url = @S3Url";

        using var cmd = new NpgsqlCommand(query, connection);
        cmd.Parameters.AddWithValue("VideoId", videoId);
        cmd.Parameters.AddWithValue("Author", author);
        cmd.Parameters.AddWithValue("Description", description);
        cmd.Parameters.AddWithValue("Hashtags", hashtags);
        cmd.Parameters.AddWithValue("S3Url", s3Url);

        var rowsAffected = await cmd.ExecuteNonQueryAsync();
        Console.WriteLine($"Rows affected in DB: {rowsAffected}");
    }

    private async Task ProcessHashtagAsync(string hashtag, int videoCount)
    {
        var hashtagId = await GetHashtagIdByNameAsync(hashtag);
        string? cursor = null;

        while (videoCount > 0)
        {
            Console.WriteLine($"Processing videos for hashtag: {hashtag} with ID: {hashtagId}");
            
            var postsJson = await GetPostsByHashtagIdAsync(hashtagId, Math.Min(30, videoCount), cursor);
            var jsonResponse = JsonDocument.Parse(postsJson);
            var itemList = jsonResponse.RootElement.GetProperty("itemList").EnumerateArray();

            foreach (var item in itemList)
            {
                Console.WriteLine($"Processing video item: {item.GetProperty("id").GetString()}");
                await ProcessVideoItemAsync(item);
                videoCount--;
                if (videoCount <= 0) break;
            }

            cursor = jsonResponse.RootElement.GetProperty("cursor").GetString();
            if (string.IsNullOrEmpty(cursor)) break;
        }
    }

    private async Task ProcessVideoItemAsync(JsonElement item)
    {
        string videoId = item.GetProperty("id").GetString() ?? throw new InvalidOperationException("Video ID is null");
        string author = item.GetProperty("author").GetProperty("nickname").GetString() ?? throw new InvalidOperationException("Author is null");
        string description = item.GetProperty("desc").GetString() ?? string.Empty;
        var hashtagsJson = item.GetProperty("textExtra").EnumerateArray();
        string hashtagsString = string.Join(", ", hashtagsJson.Select(h => h.GetProperty("hashtagName").GetString() ?? string.Empty));

        string fileName = $"{videoId}.mp4";
        string downloadAddr = item.GetProperty("video").GetProperty("downloadAddr").GetString() ?? throw new InvalidOperationException("Download address not found");

        Console.WriteLine($"Processing video with ID: {videoId}, Author: {author}, Description: {description}");
        
        await DownloadAndUploadVideoAsync(downloadAddr, fileName, videoId, author, description, hashtagsString);
    }

    public async Task TestDownloadAndStoreTikTokVideosAsync()
    {
        var testHashtags = new List<string> { "recipe", "food", "cooking" };

        Console.WriteLine("Starting test download and store TikTok videos...");

        await ProcessHashtagsAsync(testHashtags);

        Console.WriteLine("TestDownloadAndStoreTikTokVideosAsync completed.");
    }
}
