// MKInformacineSistemaBack/Helpers/Dtos/MapObjectDto.cs
namespace MKInformacineSistemaBack.Helpers.Dtos
{
    public class MapObjectDto
    {
        public int? Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public CoordinateDto Coordinate { get; set; } = new CoordinateDto();
    }

    public class CreateMapObjectDto
    {
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public double Lat { get; set; }
        public double Lng { get; set; }
    }

    public class UpdateMapObjectDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public double Lat { get; set; }
        public double Lng { get; set; }
    }
}