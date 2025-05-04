namespace MKInformacineSistemaBack.Helpers.Dtos
{
    public class LatLngDto
    {
        public double Lat { get; set; }
        public double Lng { get; set; }
    }

    public class PolygonDto
    {
        public string Name { get; set; }
        public List<LatLngDto> Coordinates { get; set; }
    }
}
