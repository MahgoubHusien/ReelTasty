using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.Security.Cryptography; 
using rtbackend.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using rtbackend.Services;


namespace rtbackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly UserManager<User> _userManager;
        private readonly SignInManager<User> _signInManager;
        private readonly IEmailSender _emailSender;
        private readonly string _jwtSecretKey;
        private readonly string _jwtIssuer;
        private readonly string _jwtAudience;

        public UserController(
            UserManager<User> userManager,
            SignInManager<User> signInManager,
            IEmailSender emailSender) 
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _emailSender = emailSender;

            _jwtSecretKey = Environment.GetEnvironmentVariable("JWT_SECRET_KEY");
            _jwtIssuer = Environment.GetEnvironmentVariable("JWT_ISSUER");
            _jwtAudience = Environment.GetEnvironmentVariable("JWT_AUDIENCE");

            if (string.IsNullOrEmpty(_jwtSecretKey) || string.IsNullOrEmpty(_jwtIssuer) || string.IsNullOrEmpty(_jwtAudience))
            {
                throw new InvalidOperationException("JWT environment variables are not set properly.");
            }
        }

        [Authorize]
        [HttpGet("GetUserId")]
        public IActionResult GetUserId()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized("User not found.");
            }

            return Ok(new { userId });
        }

        [HttpPost("Register")]
        public async Task<IActionResult> Register([FromBody] Register model)
        {
            if (ModelState.IsValid)
            {
                if (model.Password != model.ConfirmPassword)
                {
                    return BadRequest("Passwords do not match.");
                }

                var existingUser = await _userManager.FindByEmailAsync(model.Email);
                if (existingUser != null)
                {
                    return BadRequest("Email is already registered.");
                }

                var user = new User
                {
                    UserName = model.Username,
                    Email = model.Email,
                };

                var result = await _userManager.CreateAsync(user, model.Password);

                if (result.Succeeded)
                {
                    var code = await _userManager.GenerateEmailConfirmationTokenAsync(user);
                    var callbackUrl = Url.Action(nameof(ConfirmEmail), "User",
                        new { userId = user.Id, code }, Request.Scheme);

                    await _emailSender.SendEmailAsync(
                        model.Email,
                        "Confirm your email",
                        $"Please confirm your account by clicking <a href='{callbackUrl}'>here</a>.");

                    return Ok(new { message = "User registered successfully. Please check your email to confirm your account." });
                }

                return BadRequest(result.Errors);
            }

            return BadRequest("Invalid model state");
        }


        [HttpPost("Login")]
        public async Task<IActionResult> Login([FromBody] Login model)
        {
            if (string.IsNullOrEmpty(model.Email) || string.IsNullOrEmpty(model.Password))
            {
                return BadRequest("Email and Password are required.");
            }

            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user == null)
            {
                return Unauthorized("Invalid login attempt.");
            }

            var result = await _signInManager.PasswordSignInAsync(user.UserName, model.Password, false, false);

            if (result.Succeeded)
            {
                var token = GenerateJwtToken(user);
                var refreshToken = GenerateRefreshToken();

                return Ok(new { token, refreshToken });
            }
            else
            {
                return Unauthorized("Invalid login attempt.");
            }
        }

        [HttpGet("ConfirmEmail")]
        public async Task<IActionResult> ConfirmEmail(string userId, string code)
        {
            if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(code))
            {
                return BadRequest("Invalid user ID or confirmation code.");
            }

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return NotFound("User not found.");
            }

            var result = await _userManager.ConfirmEmailAsync(user, code);
            if (result.Succeeded)
            {
                return Ok("Email confirmed successfully.");
            }

            return BadRequest("Error confirming email.");
        }

        [HttpGet("CheckEmailConfirmationStatus")]
        public async Task<IActionResult> CheckEmailConfirmationStatus(string userId)
        {
            if (string.IsNullOrEmpty(userId))
            {
                return BadRequest("Invalid user ID.");
            }

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return NotFound("User not found.");
            }

            bool isEmailConfirmed = await _userManager.IsEmailConfirmedAsync(user);

            return Ok(new { IsEmailConfirmed = isEmailConfirmed });
        }


        [HttpPost("ResendConfirmationEmail")]
        public async Task<IActionResult> ResendConfirmationEmail([FromBody] ResendConfirmationEmail model)
        {
            if (string.IsNullOrEmpty(model.Email))
            {
                return BadRequest("Email is required.");
            }

            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user == null || await _userManager.IsEmailConfirmedAsync(user))
            {
                return BadRequest("User not found or already confirmed.");
            }

            var code = await _userManager.GenerateEmailConfirmationTokenAsync(user);
            var callbackUrl = Url.Action(nameof(ConfirmEmail), "User",
                new { userId = user.Id, code }, Request.Scheme);

            return Ok("Confirmation email resent.");
        }

        [HttpPost("ForgotPassword")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPassword model)
        {
            if (string.IsNullOrEmpty(model.Email))
            {
                return BadRequest("Email is required.");
            }

            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user == null || !(await _userManager.IsEmailConfirmedAsync(user)))
            {
                return BadRequest("User not found or email not confirmed.");
            }

            var code = await _userManager.GeneratePasswordResetTokenAsync(user);

            var frontendUrl = Environment.GetEnvironmentVariable("FRONTEND_URL");
            if (string.IsNullOrEmpty(frontendUrl))
            {
                return StatusCode(StatusCodes.Status500InternalServerError, "Frontend URL not configured.");
            }

            var resetUrl = $"{frontendUrl}/resetPassword?code={Uri.EscapeDataString(code)}";

            await _emailSender.SendEmailAsync(user.Email, "Reset Password",
                $"Please reset your password by clicking <a href='{resetUrl}'>here</a>");

            return Ok("Password reset email sent.");
        }


        [HttpPost("ResetPassword")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPassword model)
        {
            if (string.IsNullOrEmpty(model.Email) || string.IsNullOrEmpty(model.Password) || string.IsNullOrEmpty(model.Code))
            {
                return BadRequest("Email, Password, and Code are required.");
            }

            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user == null)
            {
                return BadRequest("User not found.");
            }

            var result = await _userManager.ResetPasswordAsync(user, model.Code, model.Password);
            if (result.Succeeded)
            {
                return Ok("Password reset successfully.");
            }

            return BadRequest(result.Errors);
        }

        [Authorize]
        [HttpGet("Profile")]
        public async Task<IActionResult> GetUserProfile()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized("User not found.");
            }

            var user = await _userManager.FindByIdAsync(userId);
            if (user != null)
            {
                return Ok(new
                {
                    user.UserName,
                    user.Email
                });
            }

            return NotFound("User not found.");
        }

        [Authorize]
        [HttpPut("UpdateProfile")]
        public async Task<IActionResult> UpdateUserProfile([FromBody] UpdateProfile model)
        {
            if (string.IsNullOrEmpty(model.Username) || string.IsNullOrEmpty(model.Email))
            {
                return BadRequest("Username and Email are required.");
            }

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized("User not found.");
            }

            var user = await _userManager.FindByIdAsync(userId);
            if (user != null)
            {
                user.UserName = model.Username;
                user.Email = model.Email;

                var result = await _userManager.UpdateAsync(user);

                if (result.Succeeded)
                {
                    return Ok(new { message = "User profile updated successfully." });
                }

                return BadRequest(result.Errors);
            }

            return NotFound("User not found.");
        }

        [Authorize]
        [HttpDelete("Delete")]
        public async Task<IActionResult> DeleteUser()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized("User not found.");
            }

            var user = await _userManager.FindByIdAsync(userId);
            if (user != null)
            {
                var result = await _userManager.DeleteAsync(user);

                if (result.Succeeded)
                {
                    return Ok(new { message = "User deleted successfully." });
                }

                return BadRequest(result.Errors);
            }

            return NotFound("User not found.");
        }

        [HttpPost("RefreshToken")]
        public async Task<IActionResult> RefreshToken([FromBody] RefreshToken model)
        {
            if (string.IsNullOrEmpty(model.Token))
            {
                return BadRequest("Token is required.");
            }

            var principal = GetPrincipalFromExpiredToken(model.Token);
            if (principal == null)
            {
                return Unauthorized("Invalid token.");
            }

            var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
            var user = await _userManager.FindByIdAsync(userId);

            if (user == null || !await _signInManager.CanSignInAsync(user))
            {
                return Unauthorized("Invalid token or user not found.");
            }

            var newJwtToken = GenerateJwtToken(user);
            var newRefreshToken = GenerateRefreshToken();


            return Ok(new { token = newJwtToken, refreshToken = newRefreshToken });
        }

        private string GenerateJwtToken(User user)
        {
            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id), 
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(ClaimTypes.NameIdentifier, user.Id), 
                new Claim(ClaimTypes.Name, user.UserName) 
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSecretKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _jwtIssuer,
                audience: _jwtAudience,
                claims: claims,
                expires: DateTime.Now.AddMinutes(60),
                signingCredentials: creds);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private string GenerateRefreshToken()
        {
            var randomNumber = new byte[32];
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(randomNumber);
                return Convert.ToBase64String(randomNumber);
            }
        }

        private ClaimsPrincipal? GetPrincipalFromExpiredToken(string token)
        {
            var tokenValidationParameters = new TokenValidationParameters
            {
                ValidateAudience = false,
                ValidateIssuer = false,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSecretKey)),
                ValidateLifetime = false  
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            try
            {
                var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out var securityToken);

                if (securityToken is not JwtSecurityToken jwtSecurityToken ||
                    !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
                {
                    throw new SecurityTokenException("Invalid token.");
                }

                return principal;
            }
            catch
            {
                return null;
            }
        }
    }
}
