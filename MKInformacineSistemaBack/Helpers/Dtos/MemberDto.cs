namespace MKInformacineSistemaBack.Helpers.Dtos
{
    public class MemberDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public DateTime BirthDate { get; set; }
        public string Photo { get; set; }
        public int Activity { get; set; }
        public DateTime HuntingSince { get; set; }
        public string Status { get; set; }
    }
}
