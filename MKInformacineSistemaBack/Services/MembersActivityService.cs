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

        public async Task UpdateClubMembersActivityAsync(int clubId)
        {
            // Get all members for this club
            var clubMembers = await _context.ClubMemberships
                .Where(cm => cm.ClubId == clubId && cm.IsActive)
                .Select(cm => cm.MemberId)
                .ToListAsync();

            // Get the total number of driven hunts for this club
            var totalDrivenHunts = await _context.DrivenHunts
                .CountAsync(h => h.ClubId == clubId);

            if (totalDrivenHunts == 0)
            {
                // No hunts yet, set activity to 0 for all members
                foreach (var memberId in clubMembers)
                {
                    await UpdateActivityPercentage(memberId, 0);
                }
                return;
            }

            // Update activity for each club member
            foreach (var memberId in clubMembers)
            {
                // Get the number of hunts this member participated in for this club
                var participatedHunts = await _context.DrivenHuntParticipants
                    .Include(p => p.DrivenHunt)
                    .CountAsync(p => p.MemberId == memberId && p.DrivenHunt.ClubId == clubId);

                // Calculate the percentage (0-100)
                int activityPercentage = (int)Math.Round((double)participatedHunts / totalDrivenHunts * 100);

                // Cap at 100%
                activityPercentage = Math.Min(activityPercentage, 100);

                // Update the member's activity
                await UpdateActivityPercentage(memberId, activityPercentage);
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