// MKInformacineSistemaBack/Models/MapObject.cs
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MKInformacineSistemaBack.Models
{
    public class MapObject
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string Name { get; set; } = string.Empty;

        [Required]
        public string Type { get; set; } = string.Empty; // "Tower" or "EatingZone"

        [Required]
        public string CoordinatesJson { get; set; } = string.Empty; // Stores a JSON object with lat/lng

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Club relationship
        public int ClubId { get; set; }
        [ForeignKey("ClubId")]
        public virtual Club Club { get; set; } = null!;
    }
}