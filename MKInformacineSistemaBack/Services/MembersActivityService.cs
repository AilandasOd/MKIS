using MKInformacineSistemaBack.Data;
using Microsoft.EntityFrameworkCore;

namespace MKInformacineSistemaBack.Services
{
    public class MemberActivityService
    {
        private readonly ApplicationDbContext _context;

        public MemberActivityService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task UpdateMemberActivityAsync(Guid memberId)
        {
            // Get the total number of driven hunts in the system
            var totalDrivenHunts = await _context.DrivenHunts.CountAsync();

            if (totalDrivenHunts == 0)
            {
                // No hunts yet, set activity to 0
                await UpdateActivityPercentage(memberId, 0);
                return;
            }

            // Get the number of hunts this member participated in
            var participatedHunts = await _context.DrivenHuntParticipants
                .CountAsync(p => p.MemberId == memberId);

            // Calculate the percentage (0-100)
            int activityPercentage = (int)Math.Round((double)participatedHunts / totalDrivenHunts * 100);

            // Cap at 100%
            activityPercentage = Math.Min(activityPercentage, 100);

            // Update the member's activity
            await UpdateActivityPercentage(memberId, activityPercentage);
        }

        private async Task UpdateActivityPercentage(Guid memberId, int percentage)
        {
            var member = await _context.Members.FindAsync(memberId);
            if (member != null)
            {
                member.Activity = percentage;
                await _context.SaveChangesAsync();
            }
        }

        public async Task UpdateAllMembersActivityAsync()
        {
            var members = await _context.Members.Select(m => m.Id).ToListAsync();
            foreach (var memberId in members)
            {
                await UpdateMemberActivityAsync(memberId);
            }
        }
    }
}