namespace MKInformacineSistemaBack.Helpers.Dtos
{
    public class DrivenHuntDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public string Game { get; set; } = string.Empty;
        public string LeaderId { get; set; } = string.Empty;
        public string LeaderName { get; set; } = string.Empty;
        public bool IsCompleted { get; set; }
        public DateTime? CompletedDate { get; set; }
        public List<DrivenHuntParticipantDto> Participants { get; set; } = new List<DrivenHuntParticipantDto>();
    }

    public class CreateDrivenHuntDto
    {
        public string Name { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public string Game { get; set; } = string.Empty;
        public string LeaderId { get; set; } = string.Empty;
        public List<string> ParticipantIds { get; set; } = new List<string>();
    }

    public class DrivenHuntParticipantDto
    {
        public int Id { get; set; }
        public string UserId { get; set; } = string.Empty; // Changed from MemberId to UserId
        public string UserName { get; set; } = string.Empty; // Changed from MemberName to UserName
        public int ShotsTaken { get; set; }
        public int ShotsHit { get; set; }
        public List<HuntedAnimalDto> HuntedAnimals { get; set; } = new List<HuntedAnimalDto>();
    }

    public class HuntedAnimalDto
    {
        public int Id { get; set; }
        public string AnimalType { get; set; } = string.Empty;
        public int Count { get; set; }
    }

    public class AddAnimalDto
    {
        public int ParticipantId { get; set; }
        public string AnimalType { get; set; } = string.Empty;
    }

    public class UpdateShotsDto
    {
        public int ParticipantId { get; set; }
        public int ShotsTaken { get; set; }
        public int ShotsHit { get; set; }
    }

    public class UpdateDrivenHuntDto
    {
        public string Name { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public string Game { get; set; } = string.Empty;
        public string LeaderId { get; set; } = string.Empty;
        public bool IsCompleted { get; set; }
    }
}