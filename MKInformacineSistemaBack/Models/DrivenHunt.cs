using MKInformacineSistemaBack.Auth.Models;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MKInformacineSistemaBack.Models
{
    public class DrivenHunt
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string Name { get; set; } = string.Empty;

        [Required]
        public string Location { get; set; } = string.Empty;

        [Required]
        public DateTime Date { get; set; }

        public string Game { get; set; } = string.Empty;

        [Required]
        public string LeaderId { get; set; } = string.Empty;

        [ForeignKey("LeaderId")]
        public virtual User Leader { get; set; } = null!;

        public bool IsCompleted { get; set; } = false;

        public DateTime? CompletedDate { get; set; }

        // Navigation property
        public virtual ICollection<DrivenHuntParticipant> Participants { get; set; } = new List<DrivenHuntParticipant>();
    }
}