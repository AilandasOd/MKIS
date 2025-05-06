using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using MKInformacineSistemaBack.Auth.Models;

namespace MKInformacineSistemaBack.Models
{
    public class Post
    {
        [Key]
        public int Id { get; set; }

        // Post basics
        [Required]
        public string Type { get; set; } = "Įrašas"; // "Įrašas" (Regular post) or "Sumedžiotas žvėris" (Hunted animal)

        [Required]
        public string Title { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Image path
        public string ImageUrl { get; set; } = string.Empty;

        // Hunted animal specific fields (null if not an animal post)
        public string? AnimalType { get; set; }
        public DateTime? HuntedDate { get; set; }

        // Author information
        [Required]
        public string AuthorId { get; set; }

        [ForeignKey("AuthorId")]
        public virtual User Author { get; set; } = null!;

        // Club relationship
        [Required]
        public int ClubId { get; set; }

        [ForeignKey("ClubId")]
        public virtual Club Club { get; set; } = null!;
    }
}