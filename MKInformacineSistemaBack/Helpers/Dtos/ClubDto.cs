namespace MKInformacineSistemaBack.Helpers.Dtos
{
    public class ClubDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string ResidenceAddress { get; set; } = string.Empty;
        public bool UseResidenceAsCenter { get; set; }
        public double[] HuntingAreaLocation { get; set; } = Array.Empty<double>(); // [lng, lat]
        public string Description { get; set; } = string.Empty;
        public string LogoUrl { get; set; } = string.Empty;
        public DateTime FoundedDate { get; set; }
        public string ContactEmail { get; set; } = string.Empty;
        public string ContactPhone { get; set; } = string.Empty;
        public int MembersCount { get; set; }
        public bool IsUserMember { get; set; }
    }

    public class ClubDetailsDto : ClubDto
    {
        public List<MemberBasicDto> Members { get; set; } = new();
    }

    public class CreateClubDto
    {
        public string Name { get; set; } = string.Empty;
        public string ResidenceAddress { get; set; } = string.Empty;
        public bool UseResidenceAsCenter { get; set; }
        public double[] HuntingAreaLocation { get; set; } = Array.Empty<double>(); // [lng, lat]
        public string Description { get; set; } = string.Empty;
        public string ContactEmail { get; set; } = string.Empty;
        public string ContactPhone { get; set; } = string.Empty;
        public DateTime FoundedDate { get; set; }
    }

    public class UpdateClubDto : CreateClubDto
    {
        public int Id { get; set; }
    }

    public class MemberBasicDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string AvatarPhoto { get; set; } = string.Empty;
    }

    public class ClubMembershipDto
    {
        public int Id { get; set; }
        public int ClubId { get; set; }
        public string ClubName { get; set; } = string.Empty;
        public Guid MemberId { get; set; }
        public string MemberName { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public DateTime JoinDate { get; set; }
        public bool IsActive { get; set; }
    }

    public class AddClubMemberDto
    {
        public int ClubId { get; set; }
        public Guid MemberId { get; set; }
        public string Role { get; set; } = "Member";
    }
}