using System;
using System.ComponentModel.DataAnnotations;

namespace rtbackend.Models
{
    public class UpdateProfile
    {
        [Required]
        public string? FirstName { get; set; }

        [Required]
        public string? LastName { get; set; }

        [Required]
        public DateTime DateOfBirth { get; set; }
    }
}
