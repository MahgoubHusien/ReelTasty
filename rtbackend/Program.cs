using Amazon.S3;
using dotenv.net;
using rtbackend.Data;
using rtbackend.Models;
using rtbackend.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

Console.WriteLine("Loading environment variables...");
// Load environment variables from .env file
DotEnv.Load();

Console.WriteLine("Loading JWT_SECRET_KEY from environment...");
string secretKey = Environment.GetEnvironmentVariable("JWT_SECRET_KEY");

if (string.IsNullOrEmpty(secretKey))
{
    Console.WriteLine("Error: JWT_SECRET_KEY is not set in the environment variables.");
    throw new InvalidOperationException("JWT_SECRET_KEY is not set in the environment variables.");
}

byte[] secretBytes;
try
{
    Console.WriteLine("Decoding JWT_SECRET_KEY...");
    secretBytes = Convert.FromBase64String(secretKey);
}
catch (FormatException ex)
{
    Console.WriteLine("Error: JWT_SECRET_KEY is not a valid base64-encoded string. Treating as plain text...");
    secretBytes = Encoding.UTF8.GetBytes(secretKey);  // Fallback in case base64 decoding fails
}

Console.WriteLine($"Secret key length: {secretBytes.Length}");
if (secretBytes.Length == 0)
{
    Console.WriteLine("Error: The JWT secret key is invalid or empty.");
    throw new InvalidOperationException("The JWT secret key is invalid or empty.");
}

// Set up CORS policy
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowSpecificOrigin",
        corsBuilder =>
        {
            var frontendUrl1 = Environment.GetEnvironmentVariable("FRONTEND_URL");
            var frontendUrl2 = Environment.GetEnvironmentVariable("FRONTEND_URL2");

            Console.WriteLine($"FRONTEND_URL1: {frontendUrl1}");
            Console.WriteLine($"FRONTEND_URL2: {frontendUrl2}");

            var allowedOrigins = new List<string>();

            if (!string.IsNullOrEmpty(frontendUrl1))
            {
                Console.WriteLine($"Adding {frontendUrl1} to allowed CORS origins.");
                allowedOrigins.Add(frontendUrl1);
            }

            if (!string.IsNullOrEmpty(frontendUrl2))
            {
                Console.WriteLine($"Adding {frontendUrl2} to allowed CORS origins.");
                allowedOrigins.Add(frontendUrl2);
            }

            if (allowedOrigins.Count > 0)
            {
                corsBuilder.WithOrigins(allowedOrigins.ToArray())
                           .AllowAnyHeader()
                           .AllowAnyMethod()
                           .AllowCredentials();
            }
            else
            {
                Console.WriteLine("Error: CORS origin URLs are not set in the environment variables.");
                throw new Exception("CORS origin URLs are not set in the environment variables.");
            }
        });
});

Console.WriteLine("Setting up database connection string...");
var connectionString = $"Host={Environment.GetEnvironmentVariable("DB_HOST")};" +
                      $"Port={Environment.GetEnvironmentVariable("DB_PORT")};" +
                      $"Database={Environment.GetEnvironmentVariable("DB_NAME")};" +
                      $"Username={Environment.GetEnvironmentVariable("DB_USER")};" +
                      $"Password={Environment.GetEnvironmentVariable("DB_PASSWORD")}";

Console.WriteLine($"Database connection string: {connectionString}");

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString));

// SMTP settings
Console.WriteLine("Setting up SMTP settings...");
var smtpSettings = new SmtpSettings
{
    Server = Environment.GetEnvironmentVariable("SERVER"),
    Port = int.Parse(Environment.GetEnvironmentVariable("SPORT")),
    SenderName = Environment.GetEnvironmentVariable("SENDERNAME"),
    SenderEmail = Environment.GetEnvironmentVariable("SENDEREMAIL"),
    Username = Environment.GetEnvironmentVariable("USERNAME"),
    Password = Environment.GetEnvironmentVariable("PASSWORD"),
    UseSsl = bool.Parse(Environment.GetEnvironmentVariable("USESSL"))
};

Console.WriteLine($"SMTP Server: {smtpSettings.Server}, Port: {smtpSettings.Port}, Sender: {smtpSettings.SenderEmail}");
builder.Services.AddSingleton(smtpSettings);

// AWS S3 settings
Console.WriteLine("Setting up AWS S3 client...");
builder.Services.AddSingleton<IAmazonS3>(sp =>
{
    var region = Environment.GetEnvironmentVariable("REGION");
    Console.WriteLine($"AWS S3 Region: {region}");

    var config = new AmazonS3Config
    {
        RegionEndpoint = Amazon.RegionEndpoint.GetBySystemName(region),
    };
    return new AmazonS3Client(
        Environment.GetEnvironmentVariable("ACCESS_KEY_ID"),
        Environment.GetEnvironmentVariable("SECRET_ACCESS_KEY"),
        config
    );
});

builder.Services.AddScoped<IEmailSender, EmailSender>();

// Identity configuration
Console.WriteLine("Setting up Identity...");
builder.Services.AddIdentity<User, IdentityRole>(options =>
{
    options.User.RequireUniqueEmail = true;
    options.SignIn.RequireConfirmedAccount = true;
    options.Password.RequiredLength = 8;
    options.Password.RequireDigit = false;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = false;
    options.Password.RequireLowercase = false;
})
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

// JWT Authentication
Console.WriteLine("Setting up JWT Authentication...");
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
    .AddJwtBearer(options =>
    {
        Console.WriteLine("Configuring JWT Token Validation...");
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = Environment.GetEnvironmentVariable("JWT_ISSUER"),
            ValidAudience = Environment.GetEnvironmentVariable("JWT_AUDIENCE"),
            IssuerSigningKey = new SymmetricSecurityKey(secretBytes)
        };
    });

builder.Services.AddAuthorization();

// Register TikApi service
Console.WriteLine("Registering TikApi service...");
builder.Services.AddScoped<TikApi>();

// Add Controllers and Swagger
Console.WriteLine("Setting up Controllers and Swagger...");
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "My API", Version = "v1" });
});

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    Console.WriteLine("Environment is Development. Enabling Swagger...");
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "My API V1");
    });
}
else
{
    Console.WriteLine("Environment is Production. Skipping Swagger setup.");
}

// Set the application to listen on a specific port
string port = Environment.GetEnvironmentVariable("PORT") ?? "5000"; // Fallback to port 5000 if not set
Console.WriteLine($"Starting application on port {port}...");
app.Urls.Add($"http://*:{port}");

// Uncomment HTTPS redirection if using HTTPS in production
// app.UseHttpsRedirection();

app.UseRouting();

// Handle CORS
Console.WriteLine("Enabling CORS...");
app.UseCors("AllowSpecificOrigin");

// Authentication and Authorization
Console.WriteLine("Enabling Authentication and Authorization...");
app.UseAuthentication();
app.UseAuthorization();

// Map Endpoints
Console.WriteLine("Mapping Controllers...");
app.UseEndpoints(endpoints =>
{
    endpoints.MapControllers();
});

app.MapControllers();

app.MapGet("/", () =>
{
    Console.WriteLine("Handling root GET request...");
    return "Welcome to the root directory";
});

Console.WriteLine("Application setup complete. Running the application...");
app.Run();
