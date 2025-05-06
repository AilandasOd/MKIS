// ClubMembership.cs
using MKInformacineSistemaBack.Auth.Models;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MKInformacineSistemaBack.Models
{
    public class ClubMembership
    {
        [Key]
        public int Id { get; set; }

        public int ClubId { get; set; }
        [ForeignKey("ClubId")]
        public virtual Club Club { get; set; } = null!;

        public string UserId { get; set; }
        [ForeignKey("UserId")]
        public virtual User User { get; set; } = null!;

        public string Role { get; set; } = "Member"; // Can be "Member", "Admin", "Owner"
        public DateTime JoinDate { get; set; } = DateTime.UtcNow;
        public bool IsActive { get; set; } = true;
    }
}