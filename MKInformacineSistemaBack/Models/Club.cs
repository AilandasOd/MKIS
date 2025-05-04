using System.ComponentModel.DataAnnotations;
using NetTopologySuite.Geometries;

namespace MKInformacineSistemaBack.Models
{
    public class Club
    {
        public int Id { get; set; }

        [Required]
        public string Name { get; set; } = string.Empty;

        [Required]
        public string ResidenceAddress { get; set; } = string.Empty;

        // Single point representing the hunting area location
        [Required]
        public Point HuntingAreaLocation { get; set; } = null!;

        // Boolean to determine which point to use as map center
        public bool UseResidenceAsCenter { get; set; }
    }
}
