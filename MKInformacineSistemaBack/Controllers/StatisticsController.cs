using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MKInformacineSistemaBack.Data;
using MKInformacineSistemaBack.Helpers.Dtos;
using Swashbuckle.AspNetCore.SwaggerGen;
using System.Collections.Generic;
using System.Security.Claims;
using System.Text.Json;

namespace MKInformacineSistemaBack.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class StatisticsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public StatisticsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("club/{clubId}")]
        public async Task<ActionResult<ClubStatisticsDto>> GetClubStatistics(int clubId, [FromQuery] int? year)
        {
            // Check if user is member of this club
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            // Find the membership record for this user in this club
            var membership = await _context.ClubMemberships
                .FirstOrDefaultAsync(cm => cm.ClubId == clubId && cm.UserId == userId && cm.IsActive);

            if (membership == null)
                return Forbid("You are not a member of this club");

            // Use current year if not specified
            int targetYear = year ?? DateTime.UtcNow.Year;

            // Get club statistics for the specified year
            var clubStats = await _context.ClubStatistics
                .FirstOrDefaultAsync(s => s.ClubId == clubId && s.Year == targetYear);

            if (clubStats == null)
            {
                // Return empty statistics if no data found
                return Ok(new ClubStatisticsDto
                {
                    Year = targetYear,
                    TotalDrivenHunts = 0,
                    CompletedDrivenHunts = 0,
                    AnimalsHunted = new Dictionary<string, int>(),
                    TotalShotsTaken = 0,
                    TotalShotsHit = 0,
                    ActiveMembersCount = 0,
                    TopHunters = new List<TopHunterDto>(),
                    AccuracyPercentage = 0
                });
            }

            // Parse JSON data
            var animalsHunted = JsonSerializer.Deserialize<Dictionary<string, int>>(
                clubStats.AnimalsHuntedJson) ?? new Dictionary<string, int>();

            var topHunters = JsonSerializer.Deserialize<List<TopHunterDto>>(
                clubStats.TopHuntersJson) ?? new List<TopHunterDto>();

            // Create response
            var result = new ClubStatisticsDto
            {
                Year = clubStats.Year,
                TotalDrivenHunts = clubStats.TotalDrivenHunts,
                CompletedDrivenHunts = clubStats.CompletedDrivenHunts,
                AnimalsHunted = animalsHunted,
                TotalShotsTaken = clubStats.TotalShotsTaken,
                TotalShotsHit = clubStats.TotalShotsHit,
                ActiveMembersCount = clubStats.ActiveMembersCount,
                TopHunters = topHunters,
                AccuracyPercentage = clubStats.AccuracyPercentage
            };

            return Ok(result);
        }

        [HttpGet("club")]
        public async Task<ActionResult<ClubStatisticsDto>> GetClubStatisticsByQuery([FromQuery] int clubId, [FromQuery] int? year)
        {
            // Just call the existing method to avoid duplicating code
            return await GetClubStatistics(clubId, year);
        }

        [HttpGet("user/{clubId}")]
        public async Task<ActionResult<UserStatisticsDto>> GetUserStatistics(
            int clubId,
            [FromQuery] string? userId,
            [FromQuery] int? year)
        {
            // If userId is not provided, use the current user's ID
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(currentUserId))
                return Unauthorized();

            string targetUserId = userId ?? currentUserId;

            // Check if the current user is a member of this club
            var currentUserMembership = await _context.ClubMemberships
                .FirstOrDefaultAsync(cm => cm.ClubId == clubId && cm.UserId == currentUserId && cm.IsActive);

            if (currentUserMembership == null)
                return Forbid("You are not a member of this club");

            // If requesting another user's stats, check if the current user has appropriate permissions
            if (targetUserId != currentUserId)
            {
                bool hasPermission = currentUserMembership.Role == "Admin" || currentUserMembership.Role == "Owner";

                if (!hasPermission)
                    return Forbid("You don't have permission to view other users' statistics");
            }

            // Use current year if not specified
            int targetYear = year ?? DateTime.UtcNow.Year;

            // Get user statistics for the specified year
            var userStats = await _context.UserStatistics
                .FirstOrDefaultAsync(s =>
                    s.UserId == targetUserId &&
                    s.ClubId == clubId &&
                    s.Year == targetYear);

            // Get user info
            var user = await _context.Users.FindAsync(targetUserId);
            if (user == null)
                return NotFound("User not found");

            if (userStats == null)
            {
                // Return empty statistics if no data found
                return Ok(new UserStatisticsDto
                {
                    UserName = $"{user.FirstName} {user.LastName}",
                    Year = targetYear,
                    DrivenHuntsParticipated = 0,
                    DrivenHuntsLed = 0,
                    ActivityPercentage = 0,
                    AnimalsHunted = new Dictionary<string, int>(),
                    ShotsTaken = 0,
                    ShotsHit = 0,
                    AccuracyPercentage = 0
                });
            }

            // Parse JSON data
            var animalsHunted = JsonSerializer.Deserialize<Dictionary<string, int>>(
                userStats.AnimalsHuntedJson) ?? new Dictionary<string, int>();

            // Create response
            var result = new UserStatisticsDto
            {
                UserName = $"{user.FirstName} {user.LastName}",
                Year = userStats.Year,
                DrivenHuntsParticipated = userStats.DrivenHuntsParticipated,
                DrivenHuntsLed = userStats.DrivenHuntsLed,
                ActivityPercentage = userStats.ActivityPercentage,
                AnimalsHunted = animalsHunted,
                ShotsTaken = userStats.ShotsTaken,
                ShotsHit = userStats.ShotsHit,
                AccuracyPercentage = userStats.AccuracyPercentage
            };

            return Ok(result);
        }
    }

    // DTOs for statistics

    public class ClubStatisticsDto
    {
        public int Year { get; set; }
        public int TotalDrivenHunts { get; set; }
        public int CompletedDrivenHunts { get; set; }
        public Dictionary<string, int> AnimalsHunted { get; set; } = new();
        public int TotalShotsTaken { get; set; }
        public int TotalShotsHit { get; set; }
        public int ActiveMembersCount { get; set; }
        public List<TopHunterDto> TopHunters { get; set; } = new();
        public double AccuracyPercentage { get; set; }
    }

    public class TopHunterDto
    {
        public string UserId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public int Count { get; set; }
    }

    public class UserStatisticsDto
    {
        public string UserName { get; set; } = string.Empty;
        public int Year { get; set; }
        public int DrivenHuntsParticipated { get; set; }
        public int DrivenHuntsLed { get; set; }
        public int ActivityPercentage { get; set; }
        public Dictionary<string, int> AnimalsHunted { get; set; } = new();
        public int ShotsTaken { get; set; }
        public int ShotsHit { get; set; }
        public double AccuracyPercentage { get; set; }
    }
}