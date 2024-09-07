using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Npgsql;
using rtbackend.Models;
using Amazon.S3;
using Amazon.S3.Model;
using Amazon.S3;
using Amazon.S3.Model;
using Amazon.S3.Transfer; 


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

    public async Task<VideoMetadata?> GetVideoMetadataByIdAsync(string videoId)
    {
        using var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = @"
            SELECT video_id, author, description, hashtags, s3_url, 
                digg_count, comment_count, share_count, play_count, 
                collect_count, create_time
            FROM tiktok_videos 
            WHERE video_id = @VideoId";

        using var cmd = new NpgsqlCommand(query, connection);
        cmd.Parameters.AddWithValue("@VideoId", videoId);

        using var reader = await cmd.ExecuteReaderAsync();

        if (await reader.ReadAsync())
        {
            return new VideoMetadata
            {
                VideoId = reader.GetString(0),
                Author = reader.GetString(1),
                Description = reader.GetString(2),
                Hashtags = reader.GetString(3),
                S3Url = reader.GetString(4),
                DiggCount = reader.IsDBNull(5) ? (int?)null : reader.GetInt32(5),  
                CommentCount = reader.IsDBNull(6) ? (int?)null : reader.GetInt32(6),
                ShareCount = reader.IsDBNull(7) ? (int?)null : reader.GetInt32(7),
                PlayCount = reader.IsDBNull(8) ? (int?)null : reader.GetInt32(8),
                CollectCount = reader.IsDBNull(9) ? (int?)null : reader.GetInt32(9),
                CreateTime = reader.IsDBNull(10) ? (DateTime?)null : reader.GetDateTime(10)
            };
        }

        return null;
    }


    public async Task<bool> SaveVideoForUserAsync(string userId, string videoId)
    {
        using var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync();

        var checkQuery = @"
            SELECT 1 FROM user_saved_videos 
            WHERE user_id = @UserId AND video_id = @VideoId";

        using var checkCmd = new NpgsqlCommand(checkQuery, connection);
        checkCmd.Parameters.AddWithValue("@UserId", userId);
        checkCmd.Parameters.AddWithValue("@VideoId", videoId);

        var exists = await checkCmd.ExecuteScalarAsync();
        if (exists != null)
        {
            return false; 
        }

        var insertQuery = @"
            INSERT INTO user_saved_videos (user_id, video_id, saved_at) 
            VALUES (@UserId, @VideoId, @SavedAt)";

        using var insertCmd = new NpgsqlCommand(insertQuery, connection);
        insertCmd.Parameters.AddWithValue("@UserId", userId);
        insertCmd.Parameters.AddWithValue("@VideoId", videoId);
        insertCmd.Parameters.AddWithValue("@SavedAt", DateTime.UtcNow);

        await insertCmd.ExecuteNonQueryAsync();
        return true;
    }

    public async Task<bool> UnsaveVideoForUserAsync(string userId, string videoId)
    {
        using var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync();

        var deleteQuery = @"
            DELETE FROM user_saved_videos 
            WHERE user_id = @UserId AND video_id = @VideoId";

        using var deleteCmd = new NpgsqlCommand(deleteQuery, connection);
        deleteCmd.Parameters.AddWithValue("@UserId", userId);
        deleteCmd.Parameters.AddWithValue("@VideoId", videoId);

        var rowsAffected = await deleteCmd.ExecuteNonQueryAsync();
        return rowsAffected > 0; 
    }

    public async Task<List<VideoMetadata>> GetSavedVideosForUserAsync(string userId)
    {
        using var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = @"
            SELECT tv.video_id, tv.author, tv.description, tv.hashtags, tv.s3_url, 
                tv.digg_count, tv.comment_count, tv.share_count, tv.play_count, 
                tv.collect_count, tv.create_time
            FROM user_saved_videos usv
            JOIN tiktok_videos tv ON usv.video_id = tv.video_id
            WHERE usv.user_id = @UserId
            ORDER BY usv.saved_at DESC";

        using var cmd = new NpgsqlCommand(query, connection);
        cmd.Parameters.AddWithValue("@UserId", userId);

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
                S3Url = reader.GetString(4),
                DiggCount = reader.IsDBNull(5) ? (int?)null : reader.GetInt32(5),  
                CommentCount = reader.IsDBNull(6) ? (int?)null : reader.GetInt32(6),
                ShareCount = reader.IsDBNull(7) ? (int?)null : reader.GetInt32(7),
                PlayCount = reader.IsDBNull(8) ? (int?)null : reader.GetInt32(8),
                CollectCount = reader.IsDBNull(9) ? (int?)null : reader.GetInt32(9),
                CreateTime = reader.IsDBNull(10) ? (DateTime?)null : reader.GetDateTime(10)
            });
        }

        return results;
    }


    public async Task<string?> GetVideoUrlByIdAsync(string videoId)
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
            return null; 
        }
    }

    public async Task<IEnumerable<VideoMetadata>> GetVideoMetadataAsync(string? hashtag = null)
    {
        Console.WriteLine("Fetching video metadata...");

        using var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = @"
            SELECT video_id, author, description, hashtags, s3_url, 
                digg_count, comment_count, share_count, play_count, 
                collect_count, create_time 
            FROM tiktok_videos";
            
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
                S3Url = reader.GetString(4),
                DiggCount = reader.IsDBNull(5) ? (int?)null : reader.GetInt32(5),
                CommentCount = reader.IsDBNull(6) ? (int?)null : reader.GetInt32(6),
                ShareCount = reader.IsDBNull(7) ? (int?)null : reader.GetInt32(7),
                PlayCount = reader.IsDBNull(8) ? (int?)null : reader.GetInt32(8),
                CollectCount = reader.IsDBNull(9) ? (int?)null : reader.GetInt32(9),
                CreateTime = reader.IsDBNull(10) ? (DateTime?)null : reader.GetDateTime(10)
            });
        }

        Console.WriteLine($"Retrieved {results.Count} video metadata entries.");
        return results;
    }


    public async Task<bool> CheckIfVideoIsSavedAsync(string userId, string videoId)
    {
        using var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = "SELECT 1 FROM user_saved_videos WHERE user_id = @UserId AND video_id = @VideoId";
        using var cmd = new NpgsqlCommand(query, connection);
        cmd.Parameters.AddWithValue("@UserId", userId);
        cmd.Parameters.AddWithValue("@VideoId", videoId);

        var result = await cmd.ExecuteScalarAsync();
        return result != null;
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
        try
        {
            using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync();

            var query = @"
                INSERT INTO tiktok_videos 
                (video_id, author, description, hashtags, s3_url, digg_count, comment_count, share_count, play_count, collect_count, create_time)
                VALUES 
                (@VideoId, @Author, @Description, @Hashtags, @S3Url, @DiggCount, @CommentCount, @ShareCount, @PlayCount, @CollectCount, @CreateTime)";

            using var cmd = new NpgsqlCommand(query, connection);
            cmd.Parameters.AddWithValue("@VideoId", videoMetadata.VideoId);
            cmd.Parameters.AddWithValue("@Author", videoMetadata.Author);
            cmd.Parameters.AddWithValue("@Description", videoMetadata.Description);
            cmd.Parameters.AddWithValue("@Hashtags", videoMetadata.Hashtags);
            cmd.Parameters.AddWithValue("@S3Url", videoMetadata.S3Url);
            cmd.Parameters.AddWithValue("@DiggCount", videoMetadata.DiggCount ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@CommentCount", videoMetadata.CommentCount ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@ShareCount", videoMetadata.ShareCount ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@PlayCount", videoMetadata.PlayCount ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@CollectCount", videoMetadata.CollectCount ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@CreateTime", videoMetadata.CreateTime ?? (object)DBNull.Value);

            await cmd.ExecuteNonQueryAsync();
            Console.WriteLine("Video added to the database.");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error inserting video data: {ex.Message}");
            throw; 
        }
    }

    public async Task<string> UploadVideoToS3Async(string filePath, string videoId)
    {
        var transferUtility = new TransferUtility(_s3Client);  

        var uploadRequest = new TransferUtilityUploadRequest
        {
            FilePath = filePath,
            BucketName = "your-bucket-name",
            Key = $"{videoId}.mp4",
            ContentType = "video/mp4"
        };

        await transferUtility.UploadAsync(uploadRequest);

        return $"https://your-bucket-name.s3.amazonaws.com/{videoId}.mp4";
    }
    public async Task RemoveVideoAsync(string videoId)
    {
        using var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync();

        using var transaction = await connection.BeginTransactionAsync();

        try
        {
            var query = "DELETE FROM tiktok_videos WHERE video_id = @VideoId";
            using var cmd = new NpgsqlCommand(query, connection);
            cmd.Parameters.AddWithValue("@VideoId", videoId);
            await cmd.ExecuteNonQueryAsync();

            Console.WriteLine("Video removed from the database.");

            await transaction.CommitAsync();
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            Console.WriteLine($"Error removing video from the database: {ex.Message}");
            throw;
        }

        try
        {
            var deleteRequest = new DeleteObjectRequest
            {
                BucketName = _bucketName,
                Key = $"{videoId}.mp4"
            };

            await _s3Client.DeleteObjectAsync(deleteRequest);
            Console.WriteLine("Video removed from S3.");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error removing video from S3: {ex.Message}");
            throw;
        }
    }


    public async Task AddRecentlySeenVideoAsync(Guid userId, string videoId)
    {
        try
        {
            using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync();

            var query = @"
                INSERT INTO recently_seen_videos (user_id, video_id)
                VALUES (@UserId, @VideoId)
                ON CONFLICT (user_id, video_id) DO UPDATE SET seen_at = NOW()";

            using var cmd = new NpgsqlCommand(query, connection);
            cmd.Parameters.AddWithValue("@UserId", userId);
            cmd.Parameters.AddWithValue("@VideoId", videoId);

            await cmd.ExecuteNonQueryAsync();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in AddRecentlySeenVideoAsync: {ex.Message}");
            throw;  
        }
    }

    public async Task<List<VideoMetadata>> GetRecentlySeenVideosAsync(Guid userId)
    {
        using var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = @"
            SELECT tv.video_id, tv.author, tv.description, tv.hashtags, tv.s3_url, 
                tv.digg_count, tv.comment_count, tv.share_count, tv.play_count, 
                tv.collect_count, tv.create_time
            FROM recently_seen_videos rsv
            JOIN tiktok_videos tv ON rsv.video_id = tv.video_id
            WHERE rsv.user_id = @UserId
            ORDER BY rsv.seen_at DESC";

        using var cmd = new NpgsqlCommand(query, connection);
        cmd.Parameters.AddWithValue("@UserId", userId);

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
                S3Url = reader.GetString(4),
                DiggCount = reader.IsDBNull(5) ? null : reader.GetInt32(5),
                CommentCount = reader.IsDBNull(6) ? null : reader.GetInt32(6),
                ShareCount = reader.IsDBNull(7) ? null : reader.GetInt32(7),
                PlayCount = reader.IsDBNull(8) ? null : reader.GetInt32(8),
                CollectCount = reader.IsDBNull(9) ? null : reader.GetInt32(9),
                CreateTime = reader.IsDBNull(10) ? null : reader.GetDateTime(10)
            });
        }

        return results;
    }

    public async Task<bool> SubmitTikTokLinkAsync(string userId, string tiktokLink)
    {
        using var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = @"
            INSERT INTO submitted_videos (user_id, tiktok_link)
            VALUES (@UserId, @TikTokLink)";

        using var cmd = new NpgsqlCommand(query, connection);
        cmd.Parameters.AddWithValue("@UserId", Guid.Parse(userId));
        cmd.Parameters.AddWithValue("@TikTokLink", tiktokLink);

        var rowsAffected = await cmd.ExecuteNonQueryAsync();
        return rowsAffected > 0;
    }

    public async Task<List<SubmittedVideo>> GetSubmittedVideosByUserAsync(string userId)
    {
        try
        {
            using var connection = new NpgsqlConnection(_connectionString);
            await connection.OpenAsync();

            var query = @"
                SELECT id, user_id, tiktok_link, submitted_at
                FROM submitted_videos
                WHERE user_id = @UserId";

            using var cmd = new NpgsqlCommand(query, connection);
            cmd.Parameters.AddWithValue("@UserId", userId);  

            using var reader = await cmd.ExecuteReaderAsync();
            var submittedVideos = new List<SubmittedVideo>();

            while (await reader.ReadAsync())
            {
                submittedVideos.Add(new SubmittedVideo
                {
                    Id = reader.GetInt32(0),
                    UserId = reader.GetString(1),  
                    TikTokLink = reader.GetString(2),
                    SubmittedAt = reader.GetDateTime(3)
                });
            }

            return submittedVideos;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in GetSubmittedVideosByUserAsync: {ex.Message}");
            throw;
        }
    }
}