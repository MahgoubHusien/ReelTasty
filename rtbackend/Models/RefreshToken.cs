using System.ComponentModel.DataAnnotations;

namespace rtbackend.Models
{
    public class RefreshToken
    {
        [Required]
        public string Token { get; set; } = string.Empty;
    }
}