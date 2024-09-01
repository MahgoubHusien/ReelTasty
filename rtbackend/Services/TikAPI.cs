using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Npgsql;
using rtbackend.Models;
using Amazon.S3;
using Amazon.S3.Model;

public class TikApi
{
    private readonly string _connectionString;
    private readonly IAmazonS3 _s3Client;
    private readonly string _bucketName;

    public TikApi(IAmazonS3 s3Client)
    {
        _connectionString = $"Host={Environment.GetEnvironmentVariable("DB_HOST")};" +
                            $"Database={Environment.GetEnvironmentVariable("DB_NAME")};" +
                            $"Username={Environment.GetEnvironmentVariable("DB_USER")};" +
                            $"Password={Environment.GetEnvironmentVariable("DB_PASSWORD")};" +
                            $"Port={Environment.GetEnvironmentVariable("DB_PORT")}";

        _s3Client = s3Client;
        _bucketName = Environment.GetEnvironmentVariable("S3_BUCKET_NAME");
    }

    public async Task<IEnumerable<VideoMetadata>> GetVideoMetadataAsync(string? hashtag = null)
    {
        Console.WriteLine("Fetching video metadata...");

        using var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = "SELECT video_id, author, description, hashtags, s3_url FROM tiktok_videos";
        if (!string.IsNullOrEmpty(hashtag))
        {
            query += " WHERE hashtags LIKE @Hashtag";
        }

        using var cmd = new NpgsqlCommand(query, connection);
        if (!string.IsNullOrEmpty(hashtag))
        {
            cmd.Parameters.AddWithValue("@Hashtag", $"%{hashtag}%");
        }

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

    public async Task<string> GetVideoUrlAsync(string videoId)
    {
        try
        {
            var request = new GetPreSignedUrlRequest
            {
                BucketName = _bucketName,
                Key = $"{videoId}.mp4",
                Expires = DateTime.UtcNow.AddHours(1) 
            };

            string url = _s3Client.GetPreSignedURL(request);
            return url;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error generating pre-signed URL: {ex.Message}");
            throw;
        }
    }

    public async Task AddVideoAsync(VideoMetadata videoMetadata)
    {
        using var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = @"
            INSERT INTO tiktok_videos (video_id, author, description, hashtags, s3_url)
            VALUES (@VideoId, @Author, @Description, @Hashtags, @S3Url)";

        using var cmd = new NpgsqlCommand(query, connection);
        cmd.Parameters.AddWithValue("@VideoId", videoMetadata.VideoId);
        cmd.Parameters.AddWithValue("@Author", videoMetadata.Author);
        cmd.Parameters.AddWithValue("@Description", videoMetadata.Description);
        cmd.Parameters.AddWithValue("@Hashtags", videoMetadata.Hashtags);
        cmd.Parameters.AddWithValue("@S3Url", videoMetadata.S3Url);

        await cmd.ExecuteNonQueryAsync();
        Console.WriteLine("Video added to the database.");
    }

    public async Task RemoveVideoAsync(string videoId)
    {
        using var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = "DELETE FROM tiktok_videos WHERE video_id = @VideoId";
        using var cmd = new NpgsqlCommand(query, connection);
        cmd.Parameters.AddWithValue("@VideoId", videoId);

        await cmd.ExecuteNonQueryAsync();
        Console.WriteLine("Video removed from the database.");

        var deleteRequest = new DeleteObjectRequest
        {
            BucketName = _bucketName,
            Key = $"{videoId}.mp4"
        };

        await _s3Client.DeleteObjectAsync(deleteRequest);
        Console.WriteLine("Video removed from S3.");
    }
}
