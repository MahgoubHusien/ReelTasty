using MailKit.Net.Smtp;
using MimeKit;
using MimeKit.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using dotenv.net;
using MailKit.Security;
using System;
using System.Threading.Tasks;

namespace rtbackend.Services
{
    public class EmailSender : IEmailSender
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailSender> _logger;

        public EmailSender(IConfiguration configuration, ILogger<EmailSender> logger)
        {
            // Load environment variables from .env file
            DotEnv.Load();

            _configuration = configuration;
            _logger = logger;
        }

        public async Task SendEmailAsync(string email, string subject, string message)
        {
            // Fetching all values from environment variables or fallback to configuration
            var server = Environment.GetEnvironmentVariable("SERVER") ?? _configuration["SmtpSettings:Server"];
            var portString = Environment.GetEnvironmentVariable("PORT") ?? _configuration["SmtpSettings:Port"];
            var senderName = Environment.GetEnvironmentVariable("SENDERNAME") ?? _configuration["SmtpSettings:SenderName"];
            var senderEmail = Environment.GetEnvironmentVariable("SENDEREMAIL") ?? _configuration["SmtpSettings:SenderEmail"];
            var username = Environment.GetEnvironmentVariable("USERNAME") ?? _configuration["SmtpSettings:Username"];
            var password = Environment.GetEnvironmentVariable("PASSWORD") ?? _configuration["SmtpSettings:Password"];
            var useSslString = Environment.GetEnvironmentVariable("USESSL") ?? _configuration["SmtpSettings:UseSsl"];

            _logger.LogInformation($"Server: {server}");
            _logger.LogInformation($"Port: {portString}");
            _logger.LogInformation($"Sender Name: {senderName}");
            _logger.LogInformation($"Sender Email: {senderEmail}");
            _logger.LogInformation($"Username: {username}");
            _logger.LogInformation($"Use SSL: {useSslString}");

            var emailMessage = new MimeMessage();
            emailMessage.From.Add(new MailboxAddress(senderName, senderEmail));
            emailMessage.To.Add(new MailboxAddress("", email));
            emailMessage.Subject = subject;
            emailMessage.Body = new TextPart(TextFormat.Html) { Text = message };

            try
            {
                using (var client = new SmtpClient())
                {
                    _logger.LogInformation("Connecting to SMTP server...");

                    // Use STARTTLS if port is 587, otherwise connect directly using SSL if port is 465
                    var useSsl = bool.Parse(useSslString);
                    var port = int.Parse(portString);
                    SecureSocketOptions secureSocketOptions = port == 587 ? SecureSocketOptions.StartTls : SecureSocketOptions.SslOnConnect;

                    await client.ConnectAsync(server, port, secureSocketOptions);

                    _logger.LogInformation("Authenticating to SMTP server...");
                    await client.AuthenticateAsync(username, password);

                    _logger.LogInformation($"Sending email to {email}...");
                    await client.SendAsync(emailMessage);

                    _logger.LogInformation("Disconnecting from SMTP server...");
                    await client.DisconnectAsync(true);
                }

                _logger.LogInformation("Email sent successfully.");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Failed to send email: {ex.Message}");
                throw;
            }
        }
    }
}