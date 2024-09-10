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

// Load environment variables from .env file
DotEnv.Load();

// Get the JWT secret key from the environment variables
string secret = Environment.GetEnvironmentVariable("JWT_SECRET_KEY") 
    ?? throw new InvalidOperationException("JWT_SECRET_KEY is not set in the environment variables.");

// Set up CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowSpecificOrigin",
        builder =>
        {
            builder.WithOrigins("http://localhost:3000", "https://your-production-url.com") // Add your production URL here
                   .AllowAnyHeader()
                   .AllowAnyMethod()
                   .AllowCredentials(); 
        });
});

// Add services to the container
var connectionString = $"Host={Environment.GetEnvironmentVariable("DB_HOST")};" +
                      $"Port={Environment.GetEnvironmentVariable("DB_PORT")};" +
                      $"Database={Environment.GetEnvironmentVariable("DB_NAME")};" +
                      $"Username={Environment.GetEnvironmentVariable("DB_USER")};" +
                      $"Password={Environment.GetEnvironmentVariable("DB_PASSWORD")}";

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString));

// SMTP settings
var smtpSettings = new SmtpSettings
{
    Server = Environment.GetEnvironmentVariable("SERVER"),
    Port = int.Parse(Environment.GetEnvironmentVariable("PORT")),
    SenderName = Environment.GetEnvironmentVariable("SENDERNAME"),
    SenderEmail = Environment.GetEnvironmentVariable("SENDEREMAIL"),
    Username = Environment.GetEnvironmentVariable("USERNAME"),
    Password = Environment.GetEnvironmentVariable("PASSWORD"),
    UseSsl = bool.Parse(Environment.GetEnvironmentVariable("USESSL"))
};


builder.Services.AddSingleton(smtpSettings);

// AWS S3 settings
builder.Services.AddSingleton<IAmazonS3>(sp =>
{
    var config = new AmazonS3Config
    {
        RegionEndpoint = Amazon.RegionEndpoint.GetBySystemName(Environment.GetEnvironmentVariable("AWS_REGION")),
    };
    return new AmazonS3Client(
        Environment.GetEnvironmentVariable("AWS_ACCESS_KEY_ID"),
        Environment.GetEnvironmentVariable("AWS_SECRET_ACCESS_KEY"),
        config
    );
});

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

builder.Services.AddTransient<IEmailSender, EmailSender>();

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = Environment.GetEnvironmentVariable("JWT_ISSUER"),
            ValidAudience = Environment.GetEnvironmentVariable("JWT_AUDIENCE"),
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret))
        };
    });

builder.Services.AddAuthorization();

// Register TikApi service with required dependencies
builder.Services.AddScoped<TikApi>();

// Add Controllers and Swagger
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
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "My API V1");
    });
}

// app.UseHttpsRedirection();

app.UseRouting();

app.UseCors("AllowSpecificOrigin");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();


 
    