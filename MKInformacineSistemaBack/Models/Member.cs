using System.ComponentModel.DataAnnotations;

namespace MKInformacineSistemaBack.Models
{
    public class Member
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public string Name { get; set; }

        [Required]
        public DateTime BirthDate { get; set; }

        public string Photo { get; set; }

        public int Activity { get; set; }

        public DateTime HuntingSince { get; set; }

        [Required]
        public string Status { get; set; }
    }
}
