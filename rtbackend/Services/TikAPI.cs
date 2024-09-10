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

    public async Task SaveTranscription(string userId, string videoId, string transcriptionText)
    {
        var s3Key = $"{userId}/{videoId}/transcription.txt";

        var transferUtility = new TransferUtility(_s3Client);
        using (var stream = new System.IO.MemoryStream(System.Text.Encoding.UTF8.GetBytes(transcriptionText)))
        {
            var uploadRequest = new TransferUtilityUploadRequest
            {
                InputStream = stream,
                Key = s3Key,
                BucketName = _bucketName,
                ContentType = "text/plain"
            };
            await transferUtility.UploadAsync(uploadRequest);
        }

        await SaveTranscriptionMetadataToDb(userId, videoId, s3Key);
    }

    public async Task<string> GetTranscription(string userId, string videoId)
    {
        var s3Key = await GetTranscriptionMetadataFromDb(userId, videoId);
        if (string.IsNullOrEmpty(s3Key))
        {
            return null; 
        }

        var request = new GetObjectRequest
        {
            BucketName = _bucketName,
            Key = s3Key
        };

        using (var response = await _s3Client.GetObjectAsync(request))
        using (var reader = new System.IO.StreamReader(response.ResponseStream))
        {
            var transcriptionText = await reader.ReadToEndAsync();
            return transcriptionText;
        }
    }

    private async Task SaveTranscriptionMetadataToDb(string userId, string videoId, string s3Key)
    {
        using (var conn = new NpgsqlConnection(_connectionString))
        {
            await conn.OpenAsync();
            var query = @"INSERT INTO transcriptions (user_id, video_id, s3_key, created_at)
                          VALUES (@userId, @videoId, @s3Key, @createdAt)
                          ON CONFLICT (user_id, video_id) DO UPDATE
                          SET s3_key = EXCLUDED.s3_key, created_at = EXCLUDED.created_at";

            using (var cmd = new NpgsqlCommand(query, conn))
            {
                cmd.Parameters.AddWithValue("userId", userId);
                cmd.Parameters.AddWithValue("videoId", videoId);
                cmd.Parameters.AddWithValue("s3Key", s3Key);
                cmd.Parameters.AddWithValue("createdAt", DateTime.UtcNow);
                await cmd.ExecuteNonQueryAsync();
            }
        }
    }

    private async Task<string> GetTranscriptionMetadataFromDb(string userId, string videoId)
    {
        using (var conn = new NpgsqlConnection(_connectionString))
        {
            await conn.OpenAsync();
            var query = "SELECT s3_key FROM transcriptions WHERE user_id = @userId AND video_id = @videoId";

            using (var cmd = new NpgsqlCommand(query, conn))
            {
                cmd.Parameters.AddWithValue("userId", userId);
                cmd.Parameters.AddWithValue("videoId", videoId);

                using (var reader = await cmd.ExecuteReaderAsync())
                {
                    if (await reader.ReadAsync())
                    {
                        return reader.GetString(0); 
                    }
                }
            }
        }
        return null;
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
            return null; 
        }
    }

    public async Task<IEnumerable<VideoMetadata>> GetVideoMetadataAsync(string? hashtag = null)
    {

        using var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = @"
            SELECT video_id, author, description, hashtags, s3_url, 
                digg_count, comment_count, share_count, play_count, 
                collect_count, create_time 
            FROM tiktok_videos";

        // If a hashtag is provided, add a WHERE clause to filter the results
        if (!string.IsNullOrEmpty(hashtag))
        {
            query += " WHERE hashtags LIKE @Hashtag";
        }

        // Order the results by create_time in reverse chronological order
        query += " ORDER BY create_time DESC";

        using var cmd = new NpgsqlCommand(query, connection);

        // If a hashtag is provided, bind it to the parameter
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
        }
        catch (Exception ex)
        {
            throw; 
        }
    }

    public async Task<string> UploadVideoToS3Async(string filePath, string videoId)
    {
        var transferUtility = new TransferUtility(_s3Client);  

        var uploadRequest = new TransferUtilityUploadRequest
        {
            FilePath = filePath,
            BucketName = _bucketName,
            Key = $"{videoId}.mp4",
            ContentType = "video/mp4"
        };

        await transferUtility.UploadAsync(uploadRequest);

        return $"https://{_bucketName}.s3.amazonaws.com/{videoId}.mp4";
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


            await transaction.CommitAsync();
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
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
        }
        catch (Exception ex)
        {
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

    public async Task<bool> SubmitTikTokLinkAsync(string userId, string tiktokLink, string videoId)
    {
        using var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = @"
            INSERT INTO submitted_videos (user_id, tiktok_link, video_id)
            VALUES (@UserId, @TikTokLink, @VideoId)";

        using var cmd = new NpgsqlCommand(query, connection);
        cmd.Parameters.AddWithValue("@UserId", Guid.Parse(userId));
        cmd.Parameters.AddWithValue("@TikTokLink", tiktokLink);
        cmd.Parameters.AddWithValue("@VideoId", videoId);

        var rowsAffected = await cmd.ExecuteNonQueryAsync();
        return rowsAffected > 0;
    }

    public async Task<List<SubmittedVideoWithMetadata>> GetSubmittedVideosByUserAsync(string userId)
    {
        using var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync();

        var query = @"
            SELECT sv.id, sv.user_id, sv.tiktok_link, sv.submitted_at, tv.video_id, tv.author, tv.description, tv.hashtags, tv.s3_url, 
                tv.digg_count, tv.comment_count, tv.share_count, tv.play_count, tv.collect_count, tv.create_time
            FROM submitted_videos sv
            LEFT JOIN tiktok_videos tv ON sv.video_id = tv.video_id
            WHERE sv.user_id = @UserId
            ORDER BY sv.submitted_at DESC";  

        using var cmd = new NpgsqlCommand(query, connection);
        cmd.Parameters.AddWithValue("@UserId", userId);

        using var reader = await cmd.ExecuteReaderAsync();
        var results = new List<SubmittedVideoWithMetadata>();

        while (await reader.ReadAsync())
        {
            var videoMetaData = reader.IsDBNull(4) ? null : new VideoMetadata
            {
                VideoId = reader.GetString(4),
                Author = reader.IsDBNull(5) ? null : reader.GetString(5),
                Description = reader.IsDBNull(6) ? null : reader.GetString(6),
                Hashtags = reader.IsDBNull(7) ? null : reader.GetString(7),
                S3Url = reader.IsDBNull(8) ? null : reader.GetString(8),
                DiggCount = reader.IsDBNull(9) ? null : reader.GetInt32(9),
                CommentCount = reader.IsDBNull(10) ? null : reader.GetInt32(10),
                ShareCount = reader.IsDBNull(11) ? null : reader.GetInt32(11),
                PlayCount = reader.IsDBNull(12) ? null : reader.GetInt32(12),
                CollectCount = reader.IsDBNull(13) ? null : reader.GetInt32(13),
                CreateTime = reader.IsDBNull(14) ? (DateTime?)null : reader.GetDateTime(14),
            };

            results.Add(new SubmittedVideoWithMetadata
            {
                Id = reader.GetInt32(0),
                UserId = reader.GetString(1),
                TikTokLink = reader.GetString(2),
                SubmittedAt = reader.GetDateTime(3),
                VideoMetaData = videoMetaData
            });
        }

        return results;
    }


}