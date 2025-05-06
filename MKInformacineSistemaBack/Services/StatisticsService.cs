using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using MKInformacineSistemaBack.Data;
using MKInformacineSistemaBack.Models;

namespace MKInformacineSistemaBack.Services
{
    public class StatisticsService
    {
        private readonly ApplicationDbContext _context;

        public StatisticsService(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Updates statistics when a new animal post is added
        /// </summary>
        public async Task UpdateStatisticsFromPostAsync(Post post)
        {
            // Only process posts about hunted animals
            if (post.Type != "Sumedžiotas žvėris" || string.IsNullOrEmpty(post.AnimalType))
                return;

            // Update user statistics
            await UpdateUserStatisticsForAnimalAsync(post.AuthorId, post.ClubId, post.AnimalType);

            // Update club statistics
            await UpdateClubStatisticsForAnimalAsync(post.ClubId, post.AnimalType);
        }

        /// <summary>
        /// Updates statistics when a driven hunt is completed
        /// </summary>
        public async Task UpdateStatisticsFromDrivenHuntAsync(int drivenHuntId)
        {
            var hunt = await _context.DrivenHunts
                .Include(h => h.Participants)
                    .ThenInclude(p => p.HuntedAnimals)
                .Include(h => h.Club)
                .FirstOrDefaultAsync(h => h.Id == drivenHuntId);

            if (hunt == null || !hunt.IsCompleted)
                return;

            int clubId = hunt.ClubId;

            // Process each participant's statistics
            foreach (var participant in hunt.Participants)
            {
                // Update participation count
                await UpdateUserHuntParticipationAsync(participant.UserId, clubId);

                // Update shots data
                await UpdateUserShotsStatisticsAsync(
                    participant.UserId,
                    clubId,
                    participant.ShotsTaken,
                    participant.ShotsHit);

                // Update each animal hunted
                foreach (var animal in participant.HuntedAnimals)
                {
                    await UpdateUserStatisticsForAnimalAsync(
                        participant.UserId,
                        clubId,
                        animal.AnimalType,
                        animal.Count);
                }
            }

            // Update club statistics
            await UpdateClubStatisticsAsync(clubId);
        }

        /// <summary>
        /// Updates user statistics for a hunted animal
        /// </summary>
        private async Task UpdateUserStatisticsForAnimalAsync(string userId, int clubId, string animalType, int count = 1)
        {
            // Get or create user statistics record
            var userStats = await GetOrCreateUserStatisticsAsync(userId, clubId);

            // Parse existing animals JSON
            var animalsDict = JsonSerializer.Deserialize<Dictionary<string, int>>(
                userStats.AnimalsHuntedJson) ?? new Dictionary<string, int>();

            // Update the count for this animal type
            if (animalsDict.ContainsKey(animalType))
                animalsDict[animalType] += count;
            else
                animalsDict[animalType] = count;

            // Save updated JSON
            userStats.AnimalsHuntedJson = JsonSerializer.Serialize(animalsDict);
            userStats.LastUpdated = DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }

        /// <summary>
        /// Updates club statistics for a hunted animal
        /// </summary>
        private async Task UpdateClubStatisticsForAnimalAsync(int clubId, string animalType, int count = 1)
        {
            // Get or create club statistics record
            var clubStats = await GetOrCreateClubStatisticsAsync(clubId);

            // Parse existing animals JSON
            var animalsDict = JsonSerializer.Deserialize<Dictionary<string, int>>(
                clubStats.AnimalsHuntedJson) ?? new Dictionary<string, int>();

            // Update the count for this animal type
            if (animalsDict.ContainsKey(animalType))
                animalsDict[animalType] += count;
            else
                animalsDict[animalType] = count;

            // Save updated JSON
            clubStats.AnimalsHuntedJson = JsonSerializer.Serialize(animalsDict);
            clubStats.LastUpdated = DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }

        /// <summary>
        /// Updates user hunt participation statistics
        /// </summary>
        private async Task UpdateUserHuntParticipationAsync(string userId, int clubId)
        {
            // Get or create user statistics record
            var userStats = await GetOrCreateUserStatisticsAsync(userId, clubId);

            // Count user's participations
            userStats.DrivenHuntsParticipated = await _context.DrivenHuntParticipants
                .Include(p => p.DrivenHunt)
                .CountAsync(p =>
                    p.UserId == userId &&
                    p.DrivenHunt.ClubId == clubId &&
                    p.DrivenHunt.IsCompleted);

            // Count hunts they've led
            userStats.DrivenHuntsLed = await _context.DrivenHunts
                .CountAsync(h =>
                    h.LeaderId == userId &&
                    h.ClubId == clubId &&
                    h.IsCompleted);

            userStats.LastUpdated = DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }

        /// <summary>
        /// Updates user shots statistics
        /// </summary>
        private async Task UpdateUserShotsStatisticsAsync(string userId, int clubId, int shotsTaken, int shotsHit)
        {
            // Get or create user statistics record
            var userStats = await GetOrCreateUserStatisticsAsync(userId, clubId);

            // Add new shots to existing totals
            userStats.ShotsTaken += shotsTaken;
            userStats.ShotsHit += shotsHit;
            userStats.LastUpdated = DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }

        /// <summary>
        /// Updates all club statistics
        /// </summary>
        private async Task UpdateClubStatisticsAsync(int clubId)
        {
            await UpdateClubHuntStatisticsAsync(clubId);
            await UpdateClubShotsStatisticsAsync(clubId);
            await UpdateClubAnimalStatisticsAsync(clubId);
            await UpdateClubTopHuntersAsync(clubId);
            await UpdateMembersActivityAsync(clubId);
        }

        /// <summary>
        /// Updates club hunt statistics
        /// </summary>
        private async Task UpdateClubHuntStatisticsAsync(int clubId)
        {
            // Get or create club statistics record
            var clubStats = await GetOrCreateClubStatisticsAsync(clubId);

            // Count driven hunts
            clubStats.TotalDrivenHunts = await _context.DrivenHunts
                .CountAsync(h => h.ClubId == clubId);

            clubStats.CompletedDrivenHunts = await _context.DrivenHunts
                .CountAsync(h => h.ClubId == clubId && h.IsCompleted);

            clubStats.LastUpdated = DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }

        /// <summary>
        /// Updates club shots statistics
        /// </summary>
        private async Task UpdateClubShotsStatisticsAsync(int clubId)
        {
            // Get or create club statistics record
            var clubStats = await GetOrCreateClubStatisticsAsync(clubId);

            // Get shots data from all hunts in this club
            var shotsData = await _context.DrivenHuntParticipants
                .Include(p => p.DrivenHunt)
                .Where(p => p.DrivenHunt.ClubId == clubId && p.DrivenHunt.IsCompleted)
                .GroupBy(p => 1) // Group all together
                .Select(g => new
                {
                    TotalTaken = g.Sum(p => p.ShotsTaken),
                    TotalHit = g.Sum(p => p.ShotsHit)
                })
                .FirstOrDefaultAsync();

            if (shotsData != null)
            {
                clubStats.TotalShotsTaken = shotsData.TotalTaken;
                clubStats.TotalShotsHit = shotsData.TotalHit;
                clubStats.LastUpdated = DateTime.UtcNow;

                await _context.SaveChangesAsync();
            }
        }

        /// <summary>
        /// Updates club animal statistics by aggregating from all hunts
        /// </summary>
        private async Task UpdateClubAnimalStatisticsAsync(int clubId)
        {
            // Get or create club statistics record
            var clubStats = await GetOrCreateClubStatisticsAsync(clubId);

            // Get all hunted animals from this club's hunts
            var huntedAnimals = await _context.HuntedAnimals
                .Include(a => a.Participant)
                    .ThenInclude(p => p.DrivenHunt)
                .Where(a => a.Participant.DrivenHunt.ClubId == clubId && a.Participant.DrivenHunt.IsCompleted)
                .GroupBy(a => a.AnimalType)
                .Select(g => new
                {
                    AnimalType = g.Key,
                    Count = g.Sum(a => a.Count)
                })
                .ToListAsync();

            // Also get animals from posts
            var postedAnimals = await _context.Posts
                .Where(p => p.ClubId == clubId && p.Type == "Sumedžiotas žvėris" && p.AnimalType != null)
                .GroupBy(p => p.AnimalType)
                .Select(g => new
                {
                    AnimalType = g.Key,
                    Count = g.Count()
                })
                .ToListAsync();

            // Combine both sources
            var allAnimals = new Dictionary<string, int>();

            foreach (var animal in huntedAnimals)
            {
                if (allAnimals.ContainsKey(animal.AnimalType))
                    allAnimals[animal.AnimalType] += animal.Count;
                else
                    allAnimals[animal.AnimalType] = animal.Count;
            }

            foreach (var animal in postedAnimals)
            {
                if (animal.AnimalType != null)
                {
                    if (allAnimals.ContainsKey(animal.AnimalType))
                        allAnimals[animal.AnimalType] += animal.Count;
                    else
                        allAnimals[animal.AnimalType] = animal.Count;
                }
            }

            // Save updated JSON
            clubStats.AnimalsHuntedJson = JsonSerializer.Serialize(allAnimals);
            clubStats.LastUpdated = DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }

        /// <summary>
        /// Updates the club's top hunters list
        /// </summary>
        private async Task UpdateClubTopHuntersAsync(int clubId)
        {
            // Get or create club statistics record
            var clubStats = await GetOrCreateClubStatisticsAsync(clubId);

            // Get top 5 hunters based on animals hunted
            var topHunters = await _context.HuntedAnimals
                .Include(a => a.Participant)
                    .ThenInclude(p => p.DrivenHunt)
                .Include(a => a.Participant)
                    .ThenInclude(p => p.User)
                .Where(a => a.Participant.DrivenHunt.ClubId == clubId && a.Participant.DrivenHunt.IsCompleted)
                .GroupBy(a => new { a.Participant.UserId, a.Participant.User.FirstName, a.Participant.User.LastName })
                .Select(g => new
                {
                    UserId = g.Key.UserId,
                    Name = $"{g.Key.FirstName} {g.Key.LastName}",
                    Count = g.Sum(a => a.Count)
                })
                .OrderByDescending(x => x.Count)
                .Take(5)
                .ToListAsync();

            // Save as JSON
            clubStats.TopHuntersJson = JsonSerializer.Serialize(topHunters);
            clubStats.LastUpdated = DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }

        /// <summary>
        /// Updates activity percentages for all members in a club
        /// </summary>
        private async Task UpdateMembersActivityAsync(int clubId)
        {
            // Get the total number of completed hunts in this club
            var totalCompletedHunts = await _context.DrivenHunts
                .CountAsync(h => h.ClubId == clubId && h.IsCompleted);

            if (totalCompletedHunts == 0)
                return; // No hunts to base activity on

            // Get all club members (users)
            var members = await _context.ClubMemberships
                .Where(cm => cm.ClubId == clubId && cm.IsActive)
                .Select(cm => cm.UserId)
                .ToListAsync();

            // Update activity for each member
            foreach (var userId in members)
            {
                // Get or create user statistics
                var userStats = await GetOrCreateUserStatisticsAsync(userId, clubId);

                // Count participations
                var participatedHunts = await _context.DrivenHuntParticipants
                    .Include(p => p.DrivenHunt)
                    .CountAsync(p =>
                        p.UserId == userId &&
                        p.DrivenHunt.ClubId == clubId &&
                        p.DrivenHunt.IsCompleted);

                // Calculate percentage
                userStats.ActivityPercentage = totalCompletedHunts > 0
                    ? (int)Math.Round((double)participatedHunts / totalCompletedHunts * 100)
                    : 0;

                userStats.LastUpdated = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            // Update club active members count
            var clubStats = await GetOrCreateClubStatisticsAsync(clubId);
            clubStats.ActiveMembersCount = members.Count;
            clubStats.LastUpdated = DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }

        /// <summary>
        /// Gets or creates user statistics for a user in a club
        /// </summary>
        private async Task<UserStatistics> GetOrCreateUserStatisticsAsync(string userId, int clubId)
        {
            var userStats = await _context.UserStatistics
                .FirstOrDefaultAsync(s => s.UserId == userId && s.ClubId == clubId && s.Year == DateTime.UtcNow.Year);

            if (userStats == null)
            {
                userStats = new UserStatistics
                {
                    UserId = userId,
                    ClubId = clubId,
                    Year = DateTime.UtcNow.Year,
                    LastUpdated = DateTime.UtcNow
                };

                _context.UserStatistics.Add(userStats);
                await _context.SaveChangesAsync();
            }

            return userStats;
        }

        /// <summary>
        /// Gets or creates club statistics
        /// </summary>
        private async Task<ClubStatistics> GetOrCreateClubStatisticsAsync(int clubId)
        {
            var clubStats = await _context.ClubStatistics
                .FirstOrDefaultAsync(s => s.ClubId == clubId && s.Year == DateTime.UtcNow.Year);

            if (clubStats == null)
            {
                clubStats = new ClubStatistics
                {
                    ClubId = clubId,
                    Year = DateTime.UtcNow.Year,
                    LastUpdated = DateTime.UtcNow
                };

                _context.ClubStatistics.Add(clubStats);
                await _context.SaveChangesAsync();
            }

            return clubStats;
        }
    }
}