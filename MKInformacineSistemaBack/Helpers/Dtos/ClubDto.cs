namespace MKInformacineSistemaBack.Helpers.Dtos
{
    public class ClubDto
    {
        public string Name { get; set; } = string.Empty;
        public string ResidenceAddress { get; set; } = string.Empty;
        public bool UseResidenceAsCenter { get; set; }
        public double[] HuntingAreaLocation { get; set; } = Array.Empty<double>(); // [lng, lat]
    }
}
