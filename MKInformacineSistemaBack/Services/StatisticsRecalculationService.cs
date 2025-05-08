using Microsoft.EntityFrameworkCore;
using MKInformacineSistemaBack.Data;
using MKInformacineSistemaBack.Models;
using System.Text.Json;

namespace MKInformacineSistemaBack.Services
{
    public class StatisticsRecalculationService
    {
        private readonly ApplicationDbContext _context;
        private readonly StatisticsService _statisticsService;

        public StatisticsRecalculationService(ApplicationDbContext context, StatisticsService statisticsService)
        {
            _context = context;
            _statisticsService = statisticsService;
        }

        public async Task RecalculateAllStatisticsAsync()
        {
            // Get all clubs
            var clubs = await _context.Clubs.ToListAsync();

            foreach (var club in clubs)
            {
                await RecalculateClubStatisticsAsync(club.Id);
                await RecalculateMemberStatisticsAsync(club.Id);
            }
        }

        public async Task RecalculateClubStatisticsAsync(int clubId)
        {
            // Get or create a club statistics record
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

            // 1. Calculate Driven Hunt statistics
            var huntStats = await _context.DrivenHunts
                .Where(h => h.ClubId == clubId)
                .GroupBy(h => 1)
                .Select(g => new
                {
                    TotalHunts = g.Count(),
                    CompletedHunts = g.Count(h => h.IsCompleted)
                })
                .FirstOrDefaultAsync();

            if (huntStats != null)
            {
                clubStats.TotalDrivenHunts = huntStats.TotalHunts;
                clubStats.CompletedDrivenHunts = huntStats.CompletedHunts;
            }

            // 2. Calculate Shot statistics
            var shotStats = await _context.DrivenHuntParticipants
                .Include(p => p.DrivenHunt)
                .Where(p => p.DrivenHunt.ClubId == clubId && p.DrivenHunt.IsCompleted)
                .GroupBy(p => 1)
                .Select(g => new
                {
                    ShotsTaken = g.Sum(p => p.ShotsTaken),
                    ShotsHit = g.Sum(p => p.ShotsHit)
                })
                .FirstOrDefaultAsync();

            if (shotStats != null)
            {
                clubStats.TotalShotsTaken = shotStats.ShotsTaken;
                clubStats.TotalShotsHit = shotStats.ShotsHit;
            }

            // 3. Calculate Hunted Animals from Driven Hunts
            var huntedAnimalsFromDrivenHunts = await _context.HuntedAnimals
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

            // 4. Calculate Hunted Animals from Posts
            var huntedAnimalsFromPosts = await _context.Posts
                .Where(p => p.ClubId == clubId && p.Type == "Sumedžiotas žvėris" && p.AnimalType != null)
                .GroupBy(p => p.AnimalType)
                .Select(g => new
                {
                    AnimalType = g.Key,
                    Count = g.Count()
                })
                .ToListAsync();

            // 5. Combine both sources
            var combinedAnimals = new Dictionary<string, int>();

            foreach (var animal in huntedAnimalsFromDrivenHunts)
            {
                if (combinedAnimals.ContainsKey(animal.AnimalType))
                    combinedAnimals[animal.AnimalType] += animal.Count;
                else
                    combinedAnimals[animal.AnimalType] = animal.Count;
            }

            foreach (var animal in huntedAnimalsFromPosts)
            {
                if (animal.AnimalType != null)
                {
                    if (combinedAnimals.ContainsKey(animal.AnimalType))
                        combinedAnimals[animal.AnimalType] += animal.Count;
                    else
                        combinedAnimals[animal.AnimalType] = animal.Count;
                }
            }

            clubStats.AnimalsHuntedJson = JsonSerializer.Serialize(combinedAnimals);

            // 6. Calculate Top Hunters
            var topHunters = await CalculateTopHuntersAsync(clubId);
            clubStats.TopHuntersJson = JsonSerializer.Serialize(topHunters);

            // 7. Count active members
            clubStats.ActiveMembersCount = await _context.ClubMemberships
                .CountAsync(cm => cm.ClubId == clubId && cm.IsActive);

            // 8. Save Changes
            clubStats.LastUpdated = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        public async Task RecalculateMemberStatisticsAsync(int clubId)
        {
            var members = await _context.ClubMemberships
                .Where(cm => cm.ClubId == clubId && cm.IsActive)
                .Select(cm => cm.UserId)
                .ToListAsync();

            foreach (var userId in members)
            {
                await RecalculateUserStatisticsAsync(userId, clubId);
            }
        }

        public async Task RecalculateUserStatisticsAsync(string userId, int clubId)
        {
            // Get or create user statistics record
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

            // 1. Calculate Driven Hunt participation
            var participatedHunts = await _context.DrivenHuntParticipants
                .Include(p => p.DrivenHunt)
                .CountAsync(p =>
                    p.UserId == userId &&
                    p.DrivenHunt.ClubId == clubId &&
                    p.DrivenHunt.IsCompleted);

            userStats.DrivenHuntsParticipated = participatedHunts;

            // 2. Calculate Driven Hunts led
            var ledHunts = await _context.DrivenHunts
                .CountAsync(h =>
                    h.LeaderId == userId &&
                    h.ClubId == clubId &&
                    h.IsCompleted);

            userStats.DrivenHuntsLed = ledHunts;

            // 3. Calculate Activity Percentage
            var totalCompletedHunts = await _context.DrivenHunts
                .CountAsync(h => h.ClubId == clubId && h.IsCompleted);

            userStats.ActivityPercentage = totalCompletedHunts > 0
                ? (int)Math.Round((double)participatedHunts / totalCompletedHunts * 100)
                : 0;

            // 4. Calculate Shots statistics
            var shotStats = await _context.DrivenHuntParticipants
                .Include(p => p.DrivenHunt)
                .Where(p =>
                    p.UserId == userId &&
                    p.DrivenHunt.ClubId == clubId &&
                    p.DrivenHunt.IsCompleted)
                .GroupBy(p => 1)
                .Select(g => new
                {
                    ShotsTaken = g.Sum(p => p.ShotsTaken),
                    ShotsHit = g.Sum(p => p.ShotsHit)
                })
                .FirstOrDefaultAsync();

            if (shotStats != null)
            {
                userStats.ShotsTaken = shotStats.ShotsTaken;
                userStats.ShotsHit = shotStats.ShotsHit;
            }

            // 5. Calculate Hunted Animals from Driven Hunts
            var huntedAnimalsFromDrivenHunts = await _context.HuntedAnimals
                .Include(a => a.Participant)
                .Where(a =>
                    a.Participant.UserId == userId &&
                    a.Participant.DrivenHunt.ClubId == clubId)
                .GroupBy(a => a.AnimalType)
                .Select(g => new
                {
                    AnimalType = g.Key,
                    Count = g.Sum(a => a.Count)
                })
                .ToListAsync();

            // 6. Calculate Hunted Animals from Posts
            var huntedAnimalsFromPosts = await _context.Posts
                .Where(p =>
                    p.ClubId == clubId &&
                    p.AuthorId == userId &&
                    p.Type == "Sumedžiotas žvėris" &&
                    p.AnimalType != null)
                .GroupBy(p => p.AnimalType)
                .Select(g => new
                {
                    AnimalType = g.Key,
                    Count = g.Count()
                })
                .ToListAsync();

            // 7. Combine both sources
            var combinedAnimals = new Dictionary<string, int>();

            foreach (var animal in huntedAnimalsFromDrivenHunts)
            {
                if (combinedAnimals.ContainsKey(animal.AnimalType))
                    combinedAnimals[animal.AnimalType] += animal.Count;
                else
                    combinedAnimals[animal.AnimalType] = animal.Count;
            }

            foreach (var animal in huntedAnimalsFromPosts)
            {
                if (animal.AnimalType != null)
                {
                    if (combinedAnimals.ContainsKey(animal.AnimalType))
                        combinedAnimals[animal.AnimalType] += animal.Count;
                    else
                        combinedAnimals[animal.AnimalType] = animal.Count;
                }
            }

            userStats.AnimalsHuntedJson = JsonSerializer.Serialize(combinedAnimals);

            // 8. Save Changes
            userStats.LastUpdated = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        private async Task<List<object>> CalculateTopHuntersAsync(int clubId)
        {
            // Get top hunters from hunted animals in driven hunts
            var topHuntersFromDrivenHunts = await _context.HuntedAnimals
                .Include(a => a.Participant)
                .ThenInclude(p => p.User)
                .Where(a => a.Participant.DrivenHunt.ClubId == clubId)
                .GroupBy(a => new {
                    a.Participant.UserId,
                    FirstName = a.Participant.User.FirstName,
                    LastName = a.Participant.User.LastName
                })
                .Select(g => new
                {
                    UserId = g.Key.UserId,
                    Name = $"{g.Key.FirstName} {g.Key.LastName}",
                    Count = g.Sum(a => a.Count)
                })
                .ToListAsync();

            // Get top hunters from posts about hunted animals
            var topHuntersFromPosts = await _context.Posts
                .Include(p => p.Author)
                .Where(p => p.ClubId == clubId && p.Type == "Sumedžiotas žvėris")
                .GroupBy(p => new {
                    p.AuthorId,
                    FirstName = p.Author.FirstName,
                    LastName = p.Author.LastName
                })
                .Select(g => new
                {
                    UserId = g.Key.AuthorId,
                    Name = $"{g.Key.FirstName} {g.Key.LastName}",
                    Count = g.Count()
                })
                .ToListAsync();

            // Combine and aggregate the counts
            var combinedHunters = new Dictionary<string, (string UserId, string Name, int Count)>();

            foreach (var hunter in topHuntersFromDrivenHunts)
            {
                combinedHunters[hunter.UserId] = (hunter.UserId, hunter.Name, hunter.Count);
            }

            foreach (var hunter in topHuntersFromPosts)
            {
                if (combinedHunters.ContainsKey(hunter.UserId))
                {
                    var (userId, name, count) = combinedHunters[hunter.UserId];
                    combinedHunters[hunter.UserId] = (userId, name, count + hunter.Count);
                }
                else
                {
                    combinedHunters[hunter.UserId] = (hunter.UserId, hunter.Name, hunter.Count);
                }
            }

            // Sort and take top 5
            var topHunters = combinedHunters.Values
                .OrderByDescending(h => h.Count)
                .Take(5)
                .Select(h => new
                {
                    UserId = h.UserId,
                    Name = h.Name,
                    Count = h.Count
                })
                .ToList<object>();

            return topHunters;
        }
    }
}