// Updates for Club.cs
using System.ComponentModel.DataAnnotations;
using NetTopologySuite.Geometries;

namespace MKInformacineSistemaBack.Models
{
    public class Club
    {
        public int Id { get; set; }
        [Required]
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string ResidenceAddress { get; set; } = string.Empty;
        public Point HuntingAreaLocation { get; set; } = null!;
        public bool UseResidenceAsCenter { get; set; }
        public string LogoUrl { get; set; } = string.Empty;
        public DateTime FoundedDate { get; set; }
        public string ContactEmail { get; set; } = string.Empty;
        public string ContactPhone { get; set; } = string.Empty;

        // Navigation properties
        public virtual ICollection<ClubMembership> Memberships { get; set; } = new List<ClubMembership>();
        public virtual ICollection<DrivenHunt> DrivenHunts { get; set; } = new List<DrivenHunt>();
        public virtual ICollection<HuntingArea> HuntingAreas { get; set; } = new List<HuntingArea>();
        public virtual ICollection<Polygon> Polygons { get; set; } = new List<Polygon>();
        public virtual ICollection<BloodTest> BloodTests { get; set; } = new List<BloodTest>();
        public virtual ICollection<ClubStatistics> Statistics { get; set; } = new List<ClubStatistics>();
        public virtual ICollection<Post> Posts { get; set; } = new List<Post>();
        public virtual ICollection<MapObject> MapObjects { get; set; } = new List<MapObject>();

    }
}