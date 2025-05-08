using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MKInformacineSistemaBack.Data;
using MKInformacineSistemaBack.Helpers.Dtos;
using MKInformacineSistemaBack.Models;
using MKInformacineSistemaBack.Services;
using System.Linq;
using System.Security.Claims;

namespace MKInformacineSistemaBack.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class DrivenHuntsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly MemberActivityService _memberActivityService;
        private readonly StatisticsService _statisticsService;

        public DrivenHuntsController(
            ApplicationDbContext context,
            MemberActivityService memberActivityService,
            StatisticsService statisticsService)
        {
            _context = context;
            _memberActivityService = memberActivityService;
            _statisticsService = statisticsService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<DrivenHuntDto>>> GetAllHunts([FromQuery] int clubId)
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

            var hunts = await _context.DrivenHunts
                .Where(h => h.ClubId == clubId)
                .Include(h => h.Leader)
                .OrderByDescending(h => h.Date)
                .Select(h => new DrivenHuntDto
                {
                    Id = h.Id,
                    Name = h.Name,
                    Location = h.Location,
                    Date = h.Date,
                    Game = h.Game,
                    LeaderId = h.LeaderId,
                    LeaderName = $"{h.Leader.FirstName} {h.Leader.LastName}",
                    IsCompleted = h.IsCompleted,
                    CompletedDate = h.CompletedDate
                })
                .ToListAsync();

            return Ok(hunts);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<DrivenHuntDto>> GetHunt(int id, [FromQuery] int clubId)
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

            var hunt = await _context.DrivenHunts
                .Include(h => h.Leader)
                .Include(h => h.Participants)
                    .ThenInclude(p => p.User)
                .Include(h => h.Participants)
                    .ThenInclude(p => p.HuntedAnimals)
                .FirstOrDefaultAsync(h => h.Id == id && h.ClubId == clubId);

            if (hunt == null)
            {
                return NotFound();
            }

            var huntDto = new DrivenHuntDto
            {
                Id = hunt.Id,
                Name = hunt.Name,
                Location = hunt.Location,
                Date = hunt.Date,
                Game = hunt.Game,
                LeaderId = hunt.LeaderId,
                LeaderName = $"{hunt.Leader.FirstName} {hunt.Leader.LastName}",
                IsCompleted = hunt.IsCompleted,
                CompletedDate = hunt.CompletedDate,
                Participants = hunt.Participants.Select(p => new DrivenHuntParticipantDto
                {
                    Id = p.Id,
                    UserId = p.UserId, // Changed from MemberId to UserId
                    UserName = $"{p.User.FirstName} {p.User.LastName}", // Changed from MemberName to UserName
                    ShotsTaken = p.ShotsTaken,
                    ShotsHit = p.ShotsHit,
                    HuntedAnimals = p.HuntedAnimals.Select(a => new HuntedAnimalDto
                    {
                        Id = a.Id,
                        AnimalType = a.AnimalType,
                        Count = a.Count
                    }).ToList()
                }).ToList()
            };

            return Ok(huntDto);
        }

        [HttpPost]
        public async Task<ActionResult<DrivenHuntDto>> CreateHunt(CreateDrivenHuntDto dto, [FromQuery] int clubId)
        {
            // Check if user is member of this club and has appropriate permissions
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var membership = await _context.ClubMemberships
                .FirstOrDefaultAsync(cm =>
                    cm.ClubId == clubId &&
                    cm.UserId == userId &&
                    cm.IsActive &&
                    (cm.Role == "Admin" || cm.Role == "Owner"));

            if (membership == null)
                return Forbid("You don't have permission to create driven hunts");

            // Validate leader exists
            var leader = await _context.Users.FindAsync(dto.LeaderId);
            if (leader == null)
            {
                return BadRequest("Invalid leader ID");
            }

            // Validate leader is a member of this club
            var leaderIsMember = await _context.ClubMemberships
                .AnyAsync(cm => cm.ClubId == clubId && cm.UserId == dto.LeaderId && cm.IsActive);

            if (!leaderIsMember)
            {
                return BadRequest("Leader is not a member of this club");
            }

            var hunt = new DrivenHunt
            {
                Name = dto.Name,
                Location = dto.Location,
                Date = dto.Date,
                Game = dto.Game,
                LeaderId = dto.LeaderId,
                ClubId = clubId
            };

            _context.DrivenHunts.Add(hunt);
            await _context.SaveChangesAsync();

            // Add participants
            if (dto.ParticipantIds != null && dto.ParticipantIds.Any())
            {
                // Find users who are members of this club
                var validUsers = await _context.ClubMemberships
                    .Where(cm => cm.ClubId == clubId && cm.IsActive && dto.ParticipantIds.Contains(cm.UserId))
                    .Select(cm => cm.UserId)
                    .ToListAsync();

                foreach (var participantId in validUsers)
                {
                    _context.DrivenHuntParticipants.Add(new DrivenHuntParticipant
                    {
                        DrivenHuntId = hunt.Id,
                        UserId = participantId,
                        ShotsTaken = 0,
                        ShotsHit = 0
                    });
                }
                await _context.SaveChangesAsync();
            }

            return CreatedAtAction(nameof(GetHunt), new { id = hunt.Id, clubId = clubId }, new DrivenHuntDto
            {
                Id = hunt.Id,
                Name = hunt.Name,
                Location = hunt.Location,
                Date = hunt.Date,
                Game = hunt.Game,
                LeaderId = hunt.LeaderId,
                LeaderName = $"{leader.FirstName} {leader.LastName}",
                IsCompleted = hunt.IsCompleted,
                CompletedDate = hunt.CompletedDate
            });
        }

        [HttpPost("{huntId}/participants")]
        public async Task<IActionResult> AddParticipant(int huntId, [FromBody] string userId, [FromQuery] int clubId)
        {
            // Check if user is member of this club with admin/owner privileges
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(currentUserId))
                return Unauthorized();

            // Check if the current user is a member of this club
            var currentUserMembership = await _context.ClubMemberships
                .FirstOrDefaultAsync(cm =>
                    cm.ClubId == clubId &&
                    cm.UserId == currentUserId &&
                    cm.IsActive &&
                    (cm.Role == "Admin" || cm.Role == "Owner"));

            if (currentUserMembership == null)
                return Forbid("You don't have permission to add participants");

            // Check if hunt exists and belongs to this club
            var hunt = await _context.DrivenHunts
                .FirstOrDefaultAsync(h => h.Id == huntId && h.ClubId == clubId);

            if (hunt == null)
                return NotFound("Hunt not found or does not belong to this club");

            // Check if the user being added is part of this club
            var memberToAdd = await _context.ClubMemberships
                .FirstOrDefaultAsync(cm => cm.ClubId == clubId && cm.UserId == userId && cm.IsActive);

            if (memberToAdd == null)
                return BadRequest("User is not part of this club");

            // Check if the user is already a participant
            var exists = await _context.DrivenHuntParticipants
                .AnyAsync(p => p.DrivenHuntId == huntId && p.UserId == userId);

            if (exists)
            {
                return BadRequest("User is already a participant");
            }

            _context.DrivenHuntParticipants.Add(new DrivenHuntParticipant
            {
                DrivenHuntId = huntId,
                UserId = userId,
                ShotsTaken = 0,
                ShotsHit = 0
            });

            await _context.SaveChangesAsync();
            return Ok();
        }

        [HttpPost("{huntId}/participants/{participantId}/animals")]
        public async Task<IActionResult> AddAnimal(int huntId, int participantId, [FromBody] AddAnimalDto dto, [FromQuery] int clubId)
        {
            // Check if user is member of this club
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var membership = await _context.ClubMemberships
                .FirstOrDefaultAsync(cm => cm.ClubId == clubId && cm.UserId == userId && cm.IsActive);

            if (membership == null)
                return Forbid("You are not a member of this club");

            // Check if hunt exists and belongs to this club
            var hunt = await _context.DrivenHunts
                .FirstOrDefaultAsync(h => h.Id == huntId && h.ClubId == clubId);

            if (hunt == null)
                return NotFound("Hunt not found or does not belong to this club");

            // Check if the participant exists and is part of this hunt
            var participant = await _context.DrivenHuntParticipants
                .Include(p => p.HuntedAnimals)
                .FirstOrDefaultAsync(p => p.Id == participantId && p.DrivenHuntId == huntId);

            if (participant == null)
            {
                return NotFound("Participant not found");
            }

            // Check if the current user is either the participant or has admin privileges
            bool isParticipant = participant.UserId == userId;
            bool hasAdminPrivileges = membership.Role == "Admin" || membership.Role == "Owner";

            if (!isParticipant && !hasAdminPrivileges)
                return Forbid("You don't have permission to add animals for this participant");

            // Check if the animal type already exists for this participant
            var existingAnimal = participant.HuntedAnimals
                .FirstOrDefault(a => a.AnimalType == dto.AnimalType);

            if (existingAnimal != null)
            {
                // Increment count if the animal already exists
                existingAnimal.Count++;
            }
            else
            {
                // Add new animal record
                participant.HuntedAnimals.Add(new HuntedAnimal
                {
                    AnimalType = dto.AnimalType,
                    Count = 1
                });
            }

            await _context.SaveChangesAsync();
            hunt = await _context.DrivenHunts.FindAsync(huntId);
            if (hunt != null && hunt.IsCompleted)
            {
                // Update user statistics
                await _statisticsService.UpdateUserStatisticsForClubAsync(participant.UserId, clubId);

                // Update club statistics for animals
                await _statisticsService.UpdateClubAnimalStatisticsAsync(clubId);

                // Update top hunters list
                await _statisticsService.UpdateClubTopHuntersAsync(clubId);
            }

            return Ok();
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateDrivenHunt(int id, [FromBody] UpdateDrivenHuntDto dto, [FromQuery] int clubId)
        {
            // Check if user is member of this club with appropriate permissions
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var membership = await _context.ClubMemberships
                .FirstOrDefaultAsync(cm =>
                    cm.ClubId == clubId &&
                    cm.UserId == userId &&
                    cm.IsActive &&
                    (cm.Role == "Admin" || cm.Role == "Owner"));

            if (membership == null)
                return Forbid("You don't have permission to update driven hunts");

            // Check if hunt exists and belongs to this club
            var hunt = await _context.DrivenHunts
                .FirstOrDefaultAsync(h => h.Id == id && h.ClubId == clubId);

            if (hunt == null)
                return NotFound("Hunt not found or does not belong to this club");

            // Update hunt properties
            hunt.Name = dto.Name;
            hunt.Location = dto.Location;
            hunt.Date = dto.Date;
            hunt.Game = dto.Game;
            hunt.LeaderId = dto.LeaderId;

            // Only update completion status if changing from not completed to completed
            if (dto.IsCompleted && !hunt.IsCompleted)
            {
                hunt.IsCompleted = true;
                hunt.CompletedDate = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpPut("{huntId}/participants/{participantId}/shots")]
        public async Task<IActionResult> UpdateShots(int huntId, int participantId, [FromBody] UpdateShotsDto dto, [FromQuery] int clubId)
        {
            // Check if user is member of this club
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var membership = await _context.ClubMemberships
                .FirstOrDefaultAsync(cm => cm.ClubId == clubId && cm.UserId == userId && cm.IsActive);

            if (membership == null)
                return Forbid("You are not a member of this club");

            // Check if hunt exists and belongs to this club
            var hunt = await _context.DrivenHunts
                .FirstOrDefaultAsync(h => h.Id == huntId && h.ClubId == clubId);

            if (hunt == null)
                return NotFound("Hunt not found or does not belong to this club");

            // Check if the participant exists and is part of this hunt
            var participant = await _context.DrivenHuntParticipants
                .FirstOrDefaultAsync(p => p.Id == participantId && p.DrivenHuntId == huntId);

            if (participant == null)
            {
                return NotFound("Participant not found");
            }

            // Check if the current user is either the participant or has admin privileges
            bool isParticipant = participant.UserId == userId;
            bool hasAdminPrivileges = membership.Role == "Admin" || membership.Role == "Owner";

            if (!isParticipant && !hasAdminPrivileges)
                return Forbid("You don't have permission to update shots for this participant");

            // Validate shots hit cannot be more than shots taken
            if (dto.ShotsHit > dto.ShotsTaken)
            {
                return BadRequest("Shots hit cannot be more than shots taken");
            }

            participant.ShotsTaken = dto.ShotsTaken;
            participant.ShotsHit = dto.ShotsHit;

            await _context.SaveChangesAsync();

            // If the hunt is completed, update statistics to reflect new shots data
            hunt = await _context.DrivenHunts.FindAsync(huntId);
            if (hunt != null && hunt.IsCompleted)
            {
                // Update user statistics
                await _statisticsService.UpdateUserStatisticsForClubAsync(participant.UserId, clubId);

                // Update club statistics for shots
                await _statisticsService.UpdateClubShotsStatisticsAsync(clubId);
            }

            return Ok();
        }

        [HttpPut("{id}/complete")]
        public async Task<IActionResult> CompleteDrivenHunt(int id, [FromQuery] int clubId)
        {
            // Check if user is member of this club with admin/owner privileges
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var membership = await _context.ClubMemberships
                .FirstOrDefaultAsync(cm =>
                    cm.ClubId == clubId &&
                    cm.UserId == userId &&
                    cm.IsActive &&
                    (cm.Role == "Admin" || cm.Role == "Owner"));

            if (membership == null)
                return Forbid("You don't have permission to complete driven hunts");

            // Check if hunt exists and belongs to this club
            var hunt = await _context.DrivenHunts
                .FirstOrDefaultAsync(h => h.Id == id && h.ClubId == clubId);

            if (hunt == null)
                return NotFound("Hunt not found or does not belong to this club");

            hunt.IsCompleted = true;
            hunt.CompletedDate = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Update statistics
            await _statisticsService.UpdateStatisticsFromDrivenHuntAsync(id);
            await _memberActivityService.UpdateClubMembersActivityAsync(clubId);

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteHunt(int id, [FromQuery] int clubId)
        {
            // Check if user is member of this club with admin/owner privileges
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var membership = await _context.ClubMemberships
                .FirstOrDefaultAsync(cm =>
                    cm.ClubId == clubId &&
                    cm.UserId == userId &&
                    cm.IsActive &&
                    (cm.Role == "Admin" || cm.Role == "Owner"));

            if (membership == null)
                return Forbid("You don't have permission to delete driven hunts");

            // Check if hunt exists and belongs to this club
            var hunt = await _context.DrivenHunts
                .FirstOrDefaultAsync(h => h.Id == id && h.ClubId == clubId);

            if (hunt == null)
                return NotFound("Hunt not found or does not belong to this club");

            _context.DrivenHunts.Remove(hunt);
            await _context.SaveChangesAsync();

            // Update member activity after removing a hunt
            await _memberActivityService.UpdateClubMembersActivityAsync(clubId);

            return NoContent();
        }
    }
}