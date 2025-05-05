namespace MKInformacineSistemaBack.Helpers.Dtos
{
    public class UserDto
    {
        public string Id { get; set; }
        public string UserName { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
        public DateTime DateOfBirth { get; set; }
        public string AvatarPhoto { get; set; }
        public DateTime HuntingTicketIssueDate { get; set; }
    }
}