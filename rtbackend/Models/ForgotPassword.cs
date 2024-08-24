using System.ComponentModel.DataAnnotations;

namespace rtbackend.Models
{
    public class ForgotPassword
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; }
    }
}
