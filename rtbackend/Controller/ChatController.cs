using Microsoft.AspNetCore.Mvc;
using Npgsql;
using System.Collections.Generic;
using System.Threading.Tasks;
using System;

[ApiController]
[Route("api/[controller]")]
public class ChatController : ControllerBase
{
    private readonly string _connectionString;

    public ChatController()
    {
        var host = Environment.GetEnvironmentVariable("DB_HOST");
        var port = Environment.GetEnvironmentVariable("DB_PORT");
        var user = Environment.GetEnvironmentVariable("DB_USER");
        var password = Environment.GetEnvironmentVariable("DB_PASSWORD");
        var database = Environment.GetEnvironmentVariable("DB_NAME");

        _connectionString = $"Host={host};Port={port};Username={user};Password={password};Database={database}";
        Console.WriteLine("Connection String: " + _connectionString);
    }

    [HttpPost("save")]
    public async Task<IActionResult> SaveChatMessage([FromBody] ChatMessageModel model)
    {
        if (model.Messages == null || model.Messages.Count == 0)
        {
            return BadRequest("Messages cannot be empty.");
        }

        try
        {
            foreach (var message in model.Messages)
            {
                await SaveMessageToDb(model.UserId, model.VideoId, message.Text, message.Sender);
            }

            return Ok("Chat messages saved successfully.");
        }
        catch (System.Exception ex)
        {
            Console.WriteLine($"Error saving chat messages: {ex.Message}");
            return StatusCode(500, $"Error saving chat messages: {ex.Message}");
        }
    }

    [HttpGet("{userId}/{videoId}")]
    public async Task<IActionResult> GetChatHistory(string userId, string videoId)
    {
        if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(videoId))
        {
            return BadRequest("User ID and Video ID are required.");
        }

        try
        {
            var chatHistory = await GetChatHistoryFromDb(userId, videoId);
            return Ok(new { messages = chatHistory });
        }
        catch (System.Exception ex)
        {
            Console.WriteLine($"Error retrieving chat history: {ex.Message}");
            return StatusCode(500, $"Error retrieving chat history: {ex.Message}");
        }
    }

    private async Task SaveMessageToDb(string userId, string videoId, string message, string sender)
    {
        try
        {
            using var conn = new NpgsqlConnection(_connectionString);
            await conn.OpenAsync();

            string query = "INSERT INTO chat_messages (user_id, video_id, message, sender, timestamp) VALUES (@userId, @videoId, @message, @sender, CURRENT_TIMESTAMP)";
            using var cmd = new NpgsqlCommand(query, conn);
            cmd.Parameters.AddWithValue("userId", userId);
            cmd.Parameters.AddWithValue("videoId", videoId);
            cmd.Parameters.AddWithValue("message", message);
            cmd.Parameters.AddWithValue("sender", sender);

            await cmd.ExecuteNonQueryAsync();
        }
        catch (System.Exception ex)
        {
            Console.WriteLine($"Error saving message to the database: {ex.Message}");
            throw new System.Exception($"Error saving message to the database: {ex.Message}");
        }
    }

    private async Task<List<ChatMessage>> GetChatHistoryFromDb(string userId, string videoId)
    {
        var chatHistory = new List<ChatMessage>();

        try
        {
            using var conn = new NpgsqlConnection(_connectionString);
            await conn.OpenAsync();

            string query = "SELECT message, sender, timestamp FROM chat_messages WHERE user_id = @userId AND video_id = @videoId ORDER BY timestamp ASC";
            using var cmd = new NpgsqlCommand(query, conn);
            cmd.Parameters.AddWithValue("userId", userId);
            cmd.Parameters.AddWithValue("videoId", videoId);

            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                chatHistory.Add(new ChatMessage
                {
                    Sender = reader.GetString(1),
                    Text = reader.GetString(0),
                    Timestamp = reader.GetDateTime(2)
                });
            }

            return chatHistory;
        }
        catch (System.Exception ex)
        {
            Console.WriteLine($"Error retrieving chat history from the database: {ex.Message}");
            throw new System.Exception($"Error retrieving chat history from the database: {ex.Message}");
        }
    }
}

public class ChatMessageModel
{
    public string UserId { get; set; }
    public string VideoId { get; set; }
    public List<ChatMessage> Messages { get; set; }
}

public class ChatMessage
{
    public string Sender { get; set; }
    public string Text { get; set; }
    public System.DateTime Timestamp { get; set; }
}
