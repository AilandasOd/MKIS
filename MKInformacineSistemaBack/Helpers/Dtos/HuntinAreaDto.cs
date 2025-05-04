namespace MKInformacineSistemaBack.Helpers.Dtos
{
    public class HuntingAreaDto
    {
        public int? Id { get; set; }

        public string Name { get; set; } = string.Empty;

        public List<CoordinateDto> Coordinates { get; set; } = new();
    }

    public class CoordinateDto
    {
        public double Lat { get; set; }
        public double Lng { get; set; }
    }
}
