// First, let's modify the Member model to ensure future entries will have unique UserIds
using MKInformacineSistemaBack.Auth.Models;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

public class Member
{
    [Key]
    public Guid Id { get; set; }

    // Reference to User - making it unique but allowing for the migration to handle existing data
    public string UserId { get; set; }

    [ForeignKey("UserId")]
    public User User { get; set; }

    // Additional member-specific fields
    public string Status { get; set; } = "Medžiotojas"; // "Administratorius" or "Medžiotojas"

    public int Activity { get; set; } // Calculated from driven hunts participation

    // Note: These fields might be redundant with User properties but kept for backward compatibility
    public string Name { get; set; }
    public DateTime BirthDate { get; set; }
    public string Photo { get; set; }
    public DateTime HuntingSince { get; set; }
}