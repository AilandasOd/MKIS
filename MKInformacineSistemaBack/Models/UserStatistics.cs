// Updates for Club.cs
using System.ComponentModel.DataAnnotations;
using MKInformacineSistemaBack.Auth.Models;
using System.ComponentModel.DataAnnotations.Schema;
using NetTopologySuite.Geometries;

namespace MKInformacineSistemaBack.Models
{
    public class UserStatistics
    {
        [Key]
        public int Id { get; set; }

        public string UserId { get; set; }
        [ForeignKey("UserId")]
        public virtual User User { get; set; } = null!;

        public int ClubId { get; set; }
        [ForeignKey("ClubId")]
        public virtual Club Club { get; set; } = null!;

        // Time period (optional - for seasonal stats)
        public int Year { get; set; } = DateTime.UtcNow.Year;

        // Participation statistics
        public int DrivenHuntsParticipated { get; set; }
        public int DrivenHuntsLed { get; set; }
        public int ActivityPercentage { get; set; } // Percentage of club hunts participated in

        // Animal statistics - stored as JSON for flexibility
        public string AnimalsHuntedJson { get; set; } = "{}"; // JSON object with animal types and counts

        // Shot statistics
        public int ShotsTaken { get; set; }
        public int ShotsHit { get; set; }

        // Calculated property
        [NotMapped]
        public double AccuracyPercentage => ShotsTaken > 0 ? (double)ShotsHit / ShotsTaken * 100 : 0;

        // Tracking
        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
    }
}