namespace MKInformacineSistemaBack.Helpers.Dtos
{
    public class UserProfileDto
    {
        public string UserName { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
        public DateTime DateOfBirth { get; set; }
        public int Age { get; set; }
        public string AvatarPhoto { get; set; }
        public DateTime HuntingTicketIssueDate { get; set; }
    }

    public class UpdateUserProfileDto
    {
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
        public DateTime DateOfBirth { get; set; }
        public DateTime HuntingTicketIssueDate { get; set; }
    }
}