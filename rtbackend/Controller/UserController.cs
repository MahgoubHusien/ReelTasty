using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
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

            Console.WriteLine($"JWT Secret Key: {_jwtSecretKey}");
            Console.WriteLine($"JWT Issuer: {_jwtIssuer}");
            Console.WriteLine($"JWT Audience: {_jwtAudience}");
        }

        // POST: api/User/Register
        [HttpPost("Register")]
        public async Task<IActionResult> Register([FromBody] Register model)
        {
            if (ModelState.IsValid)
            {
                if (model.Password != model.ConfirmPassword)
                {
                    return BadRequest("Passwords do not match.");
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

                    // Send the confirmation email
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


        // POST: api/User/Login
        [HttpPost("Login")]
        public async Task<IActionResult> Login([FromBody] Login model)
        {
            if (string.IsNullOrEmpty(model.Email) || string.IsNullOrEmpty(model.Password))
            {
                return BadRequest("Email and Password are required.");
            }

            Console.WriteLine($"Attempting to log in with email: {model.Email}");

            // Find the user by email first
            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user == null)
            {
                return Unauthorized("Invalid login attempt.");
            }

            //use the UserName for sign-in, which should be the email
            var result = await _signInManager.PasswordSignInAsync(user.UserName, model.Password, false, false);

            if (result.Succeeded)
            {
                var token = GenerateJwtToken(user);
                return Ok(new { token });
            }
            else
            {
                Console.WriteLine($"Login failed for user: {model.Email}. Result: {result}");
                return Unauthorized("Invalid login attempt.");
            }
        }


        // GET: api/User/ConfirmEmail
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

        // POST: api/User/ResendConfirmationEmail
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

        // POST: api/User/ForgotPassword
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
            var callbackUrl = Url.Action(nameof(ResetPassword), "User",
                new { code }, Request.Scheme);


            return Ok("Password reset email sent.");
        }

        // POST: api/User/ResetPassword
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

        // GET: api/User/Profile
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

        // PUT: api/User/UpdateProfile
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

        // DELETE: api/User/Delete
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

        // POST: api/User/RefreshToken
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

            return Ok(new { token = newJwtToken });
        }

        private string GenerateJwtToken(User user)
        {
            var secretKey = Environment.GetEnvironmentVariable("JWT_SECRET_KEY");
            var jwtIssuer = Environment.GetEnvironmentVariable("JWT_ISSUER");
            var jwtAudience = Environment.GetEnvironmentVariable("JWT_AUDIENCE");

            if (string.IsNullOrEmpty(secretKey))
            {
                throw new InvalidOperationException("JWT_SECRET_KEY is not set in the environment variables.");
            }

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.UserName ?? string.Empty),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(ClaimTypes.NameIdentifier, user.Id)
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: jwtIssuer,
                audience: jwtAudience,
                claims: claims,
                expires: DateTime.Now.AddMinutes(30),
                signingCredentials: creds);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }



        private ClaimsPrincipal? GetPrincipalFromExpiredToken(string token)
        {
            var secretKey = Environment.GetEnvironmentVariable("JWT_SECRET_KEY");

            if (string.IsNullOrEmpty(secretKey))
            {
                throw new InvalidOperationException("JWT_SECRET_KEY is not set in the environment variables.");
            }

            var tokenValidationParameters = new TokenValidationParameters
            {
                ValidateAudience = false,
                ValidateIssuer = false,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
                ValidateLifetime = false // we want to get the principal even if the token is expired
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