using System;
using System.ComponentModel.DataAnnotations;

namespace rtbackend.Models
{
    public class UpdateProfile
    {
        [Required]
        public string Username { get; set; }

        [Required]
        public string Email { get; set; }

    }
}