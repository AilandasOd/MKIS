// Updates for Club.cs
using System.ComponentModel.DataAnnotations;
using MKInformacineSistemaBack.Auth.Models;
using System.ComponentModel.DataAnnotations.Schema;
using NetTopologySuite.Geometries;

namespace MKInformacineSistemaBack.Models
{
    public class ClubStatistics
    {
        [Key]
        public int Id { get; set; }

        public int ClubId { get; set; }
        [ForeignKey("ClubId")]
        public virtual Club Club { get; set; } = null!;

        // Time period (optional - for seasonal stats)
        public int Year { get; set; } = DateTime.UtcNow.Year;

        // Driven hunt statistics
        public int TotalDrivenHunts { get; set; }
        public int CompletedDrivenHunts { get; set; }

        // Animal statistics - stored as JSON for flexibility
        public string AnimalsHuntedJson { get; set; } = "{}"; // JSON object with animal types and counts

        // Shot statistics
        public int TotalShotsTaken { get; set; }
        public int TotalShotsHit { get; set; }

        // Member statistics
        public int ActiveMembersCount { get; set; }
        public string TopHuntersJson { get; set; } = "[]"; // Array of {userId, name, count}

        // Calculated property
        [NotMapped]
        public double AccuracyPercentage => TotalShotsTaken > 0 ? (double)TotalShotsHit / TotalShotsTaken * 100 : 0;

        // Tracking
        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;
    }
}