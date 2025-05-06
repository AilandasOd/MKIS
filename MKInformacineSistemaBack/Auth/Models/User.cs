using Microsoft.AspNetCore.Identity;
using MKInformacineSistemaBack.Models;
using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace MKInformacineSistemaBack.Auth.Models
{
    public class User : IdentityUser
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public DateTime DateOfBirth { get; set; }
        public string AvatarPhoto { get; set; } = string.Empty;
        public DateTime HuntingTicketIssueDate { get; set; }

        public virtual ICollection<ClubMembership> ClubMemberships { get; set; } = new List<ClubMembership>();
        public virtual ICollection<DrivenHuntParticipant> HuntParticipations { get; set; } = new List<DrivenHuntParticipant>();
        public virtual ICollection<UserStatistics> Statistics { get; set; } = new List<UserStatistics>();
        public virtual ICollection<Post> Posts { get; set; } = new List<Post>();


        // Calculated property for age
        [NotMapped]
        public int Age
        {
            get
            {
                var today = DateTime.Today;
                var age = today.Year - DateOfBirth.Year;
                if (DateOfBirth.Date > today.AddYears(-age)) age--;
                return age;
            }
        }
    }
}