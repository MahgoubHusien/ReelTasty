using System;
using System.ComponentModel.DataAnnotations;

namespace rtbackend.Models
{
    public class Register
    {
        [Required]
        [EmailAddress]
        public string? Email { get; set; }

        [Required]
        public string Username { get; set; }

        [Required]
        [MinLength(8)]
        public string? Password { get; set; }

        [Required]
        public string ConfirmPassword { get; set; }
    }
}