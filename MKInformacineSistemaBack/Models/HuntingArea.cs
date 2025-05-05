using System.ComponentModel.DataAnnotations.Schema;

namespace MKInformacineSistemaBack.Models
{
    public class HuntingArea
    {
        public int Id { get; set; }

        public string Name { get; set; } = string.Empty;

        public string CoordinatesJson { get; set; } = string.Empty;

        public int ClubId { get; set; }
        [ForeignKey("ClubId")]
        public virtual Club Club { get; set; } = null!;
    }
}