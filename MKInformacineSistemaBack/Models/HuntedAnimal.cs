using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MKInformacineSistemaBack.Models
{
    public class HuntedAnimal
    {
        [Key]
        public int Id { get; set; }

        public int ParticipantId { get; set; }

        [ForeignKey("ParticipantId")]
        public virtual DrivenHuntParticipant Participant { get; set; } = null!;

        [Required]
        public string AnimalType { get; set; } = string.Empty;

        public int Count { get; set; } = 1;
    }
}