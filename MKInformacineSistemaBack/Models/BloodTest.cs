using System.ComponentModel.DataAnnotations;
using MKInformacineSistemaBack.Auth.Models;
using System.ComponentModel.DataAnnotations.Schema;

namespace MKInformacineSistemaBack.Models
{
    public class BloodTest
    {
        [Key]
        public int Id { get; set; }
        public string TestName { get; set; } = string.Empty;
        public string AnimalType { get; set; } = string.Empty;
        public DateTime DateHunted { get; set; }
        public DateTime TestStartDate { get; set; }
        public string Status { get; set; } = string.Empty; // "Patvirtinta", "Laukiama", "Netinkamas"
        public DateTime? CompletedDate { get; set; }
        public string Description { get; set; } = string.Empty;

        // Club relationship
        public int ClubId { get; set; }
        [ForeignKey("ClubId")]
        public virtual Club Club { get; set; } = null!;

        // Participants
        public virtual ICollection<BloodTestParticipant> Participants { get; set; } = new List<BloodTestParticipant>();
    }

    public class BloodTestParticipant
    {
        [Key]
        public int Id { get; set; }
        public int BloodTestId { get; set; }
        [ForeignKey("BloodTestId")]
        public virtual BloodTest BloodTest { get; set; } = null!;

        public string UserId { get; set; }
        [ForeignKey("UserId")]
        public virtual User User { get; set; } = null!;
    }
}