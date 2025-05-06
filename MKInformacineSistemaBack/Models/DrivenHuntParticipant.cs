using MKInformacineSistemaBack.Auth.Models;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MKInformacineSistemaBack.Models
{
    public class DrivenHuntParticipant
    {
        [Key]
        public int Id { get; set; }

        public int DrivenHuntId { get; set; }

        [ForeignKey("DrivenHuntId")]
        public virtual DrivenHunt DrivenHunt { get; set; } = null!;

        // Changed from MemberId to UserId
        public string UserId { get; set; } = string.Empty;

        [ForeignKey("UserId")]
        public virtual User User { get; set; } = null!;

        public int ShotsTaken { get; set; }

        public int ShotsHit { get; set; }

        // Collection of animals hunted by this participant
        public virtual ICollection<HuntedAnimal> HuntedAnimals { get; set; } = new List<HuntedAnimal>();
    }
}