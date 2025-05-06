using Microsoft.EntityFrameworkCore;
using MKInformacineSistemaBack.Data;

namespace MKInformacineSistemaBack.Services
{
    public class MemberActivityService
    {
        private readonly ApplicationDbContext _context;

        public MemberActivityService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task UpdateClubMembersActivityAsync(int clubId)
        {
            // Get the total number of completed hunts in this club
            var totalCompletedHunts = await _context.DrivenHunts
                .CountAsync(h => h.ClubId == clubId && h.IsCompleted);

            if (totalCompletedHunts == 0)
                return; // No hunts to calculate activity from

            // Get all club members
            var members = await _context.ClubMemberships
                .Where(cm => cm.ClubId == clubId && cm.IsActive)
                .ToListAsync();

            foreach (var member in members)
            {
                // Count how many hunts this member participated in
                var participationCount = await _context.DrivenHuntParticipants
                    .Include(p => p.DrivenHunt)
                    .CountAsync(p =>
                        p.UserId == member.UserId &&
                        p.DrivenHunt.ClubId == clubId &&
                        p.DrivenHunt.IsCompleted);

                // Calculate and update activity percentage
                int activityPercentage = (int)Math.Round((double)participationCount / totalCompletedHunts * 100);

                // Update user statistics if it exists
                var userStats = await _context.UserStatistics
                    .FirstOrDefaultAsync(s =>
                        s.UserId == member.UserId &&
                        s.ClubId == clubId &&
                        s.Year == DateTime.UtcNow.Year);

                if (userStats != null)
                {
                    userStats.ActivityPercentage = activityPercentage;
                    userStats.LastUpdated = DateTime.UtcNow;
                }
            }

            await _context.SaveChangesAsync();
        }
    }
}