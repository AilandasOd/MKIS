using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MKInformacineSistemaBack.Data;
using MKInformacineSistemaBack.Helpers.Dtos;
using MKInformacineSistemaBack.Models;
using MKInformacineSistemaBack.Services;
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

        public DrivenHuntsController(ApplicationDbContext context, MemberActivityService memberActivityService)
        {
            _context = context;
            _memberActivityService = memberActivityService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<DrivenHuntDto>>> GetAllHunts([FromQuery] int clubId)
        {
            // Check if user is member of this club
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var member = await _context.Members.FirstOrDefaultAsync(m => m.UserId == userId);

            if (member == null)
                return Unauthorized("User is not a member");

            var isMember = await _context.ClubMemberships
                .AnyAsync(cm => cm.ClubId == clubId && cm.MemberId == member.Id && cm.IsActive);

            if (!isMember)
                return Forbid("User is not a member of this club");

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
            var member = await _context.Members.FirstOrDefaultAsync(m => m.UserId == userId);

            if (member == null)
                return Unauthorized("User is not a member");

            var isMember = await _context.ClubMemberships
                .AnyAsync(cm => cm.ClubId == clubId && cm.MemberId == member.Id && cm.IsActive);

            if (!isMember)
                return Forbid("User is not a member of this club");

            var hunt = await _context.DrivenHunts
                .Include(h => h.Leader)
                .Include(h => h.Participants)
                    .ThenInclude(p => p.Member)
                        .ThenInclude(m => m.User)
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
                    MemberId = p.MemberId,
                    MemberName = $"{p.Member.User.FirstName} {p.Member.User.LastName}",
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
            var member = await _context.Members.FirstOrDefaultAsync(m => m.UserId == userId);

            if (member == null)
                return Unauthorized("User is not a member");

            var membership = await _context.ClubMemberships
                .FirstOrDefaultAsync(cm => cm.ClubId == clubId && cm.MemberId == member.Id && cm.IsActive);

            if (membership == null)
                return Forbid("User is not a member of this club");

            // Check if user has admin or owner role in the club
            if (membership.Role != "Admin" && membership.Role != "Owner")
                return Forbid("User does not have permission to create driven hunts");

            // Validate leader exists
            var leader = await _context.Users.FindAsync(dto.LeaderId);
            if (leader == null)
            {
                return BadRequest("Invalid leader ID");
            }

            var hunt = new DrivenHunt
            {
                Name = dto.Name,
                Location = dto.Location,
                Date = dto.Date,
                Game = dto.Game,
                LeaderId = dto.LeaderId,
                ClubId = clubId  // Set the club ID
            };

            _context.DrivenHunts.Add(hunt);
            await _context.SaveChangesAsync();

            // Add participants - but first verify they are members of this club
            if (dto.MemberIds != null && dto.MemberIds.Any())
            {
                // Get valid member IDs (must be members of this club)
                var validMemberIds = await _context.ClubMemberships
                    .Where(cm => cm.ClubId == clubId && cm.IsActive && dto.MemberIds.Contains(cm.MemberId))
                    .Select(cm => cm.MemberId)
                    .ToListAsync();

                foreach (var memberId in validMemberIds)
                {
                    _context.DrivenHuntParticipants.Add(new DrivenHuntParticipant
                    {
                        DrivenHuntId = hunt.Id,
                        MemberId = memberId,
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
        public async Task<IActionResult> AddParticipant(int huntId, [FromBody] Guid memberId, [FromQuery] int clubId)
        {
            // Check if user is member of this club with admin/owner privileges
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var currentMember = await _context.Members.FirstOrDefaultAsync(m => m.UserId == userId);

            if (currentMember == null)
                return Unauthorized("User is not a member");

            var membership = await _context.ClubMemberships
                .FirstOrDefaultAsync(cm => cm.ClubId == clubId && cm.MemberId == currentMember.Id && cm.IsActive);

            if (membership == null || (membership.Role != "Admin" && membership.Role != "Owner"))
                return Forbid("User does not have permission to add participants");

            // Check if hunt exists and belongs to this club
            var hunt = await _context.DrivenHunts
                .FirstOrDefaultAsync(h => h.Id == huntId && h.ClubId == clubId);

            if (hunt == null)
                return NotFound("Hunt not found or does not belong to this club");

            // Check if the member being added is part of this club
            var memberToAdd = await _context.ClubMemberships
                .FirstOrDefaultAsync(cm => cm.ClubId == clubId && cm.MemberId == memberId && cm.IsActive);

            if (memberToAdd == null)
                return BadRequest("Member is not part of this club");

            // Check if the member is already a participant
            var exists = await _context.DrivenHuntParticipants
                .AnyAsync(p => p.DrivenHuntId == huntId && p.MemberId == memberId);

            if (exists)
            {
                return BadRequest("Member is already a participant");
            }

            _context.DrivenHuntParticipants.Add(new DrivenHuntParticipant
            {
                DrivenHuntId = huntId,
                MemberId = memberId,
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
            var currentMember = await _context.Members.FirstOrDefaultAsync(m => m.UserId == userId);

            if (currentMember == null)
                return Unauthorized("User is not a member");

            var membership = await _context.ClubMemberships
                .FirstOrDefaultAsync(cm => cm.ClubId == clubId && cm.MemberId == currentMember.Id && cm.IsActive);

            if (membership == null)
                return Forbid("User is not a member of this club");

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
            bool isParticipant = participant.MemberId == currentMember.Id;
            bool hasAdminPrivileges = membership.Role == "Admin" || membership.Role == "Owner";

            if (!isParticipant && !hasAdminPrivileges)
                return Forbid("User does not have permission to add animals for this participant");

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
            return Ok();
        }

        [HttpPut("{huntId}/participants/{participantId}/shots")]
        public async Task<IActionResult> UpdateShots(int huntId, int participantId, [FromBody] UpdateShotsDto dto, [FromQuery] int clubId)
        {
            // Check if user is member of this club
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var currentMember = await _context.Members.FirstOrDefaultAsync(m => m.UserId == userId);

            if (currentMember == null)
                return Unauthorized("User is not a member");

            var membership = await _context.ClubMemberships
                .FirstOrDefaultAsync(cm => cm.ClubId == clubId && cm.MemberId == currentMember.Id && cm.IsActive);

            if (membership == null)
                return Forbid("User is not a member of this club");

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
            bool isParticipant = participant.MemberId == currentMember.Id;
            bool hasAdminPrivileges = membership.Role == "Admin" || membership.Role == "Owner";

            if (!isParticipant && !hasAdminPrivileges)
                return Forbid("User does not have permission to update shots for this participant");

            // Validate shots hit cannot be more than shots taken
            if (dto.ShotsHit > dto.ShotsTaken)
            {
                return BadRequest("Shots hit cannot be more than shots taken");
            }

            participant.ShotsTaken = dto.ShotsTaken;
            participant.ShotsHit = dto.ShotsHit;

            await _context.SaveChangesAsync();
            return Ok();
        }

        [HttpPut("{id}/complete")]
        public async Task<IActionResult> CompleteDrivenHunt(int id, [FromQuery] int clubId)
        {
            // Check if user is member of this club with admin/owner privileges
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var currentMember = await _context.Members.FirstOrDefaultAsync(m => m.UserId == userId);

            if (currentMember == null)
                return Unauthorized("User is not a member");

            var membership = await _context.ClubMemberships
                .FirstOrDefaultAsync(cm => cm.ClubId == clubId && cm.MemberId == currentMember.Id && cm.IsActive);

            if (membership == null || (membership.Role != "Admin" && membership.Role != "Owner"))
                return Forbid("User does not have permission to complete driven hunts");

            // Check if hunt exists and belongs to this club
            var hunt = await _context.DrivenHunts
                .FirstOrDefaultAsync(h => h.Id == id && h.ClubId == clubId);

            if (hunt == null)
                return NotFound("Hunt not found or does not belong to this club");

            hunt.IsCompleted = true;
            hunt.CompletedDate = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Update all members' activity percentages for this club
            await _memberActivityService.UpdateClubMembersActivityAsync(clubId);

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteHunt(int id, [FromQuery] int clubId)
        {
            // Check if user is member of this club with admin/owner privileges
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var currentMember = await _context.Members.FirstOrDefaultAsync(m => m.UserId == userId);

            if (currentMember == null)
                return Unauthorized("User is not a member");

            var membership = await _context.ClubMemberships
                .FirstOrDefaultAsync(cm => cm.ClubId == clubId && cm.MemberId == currentMember.Id && cm.IsActive);

            if (membership == null || (membership.Role != "Admin" && membership.Role != "Owner"))
                return Forbid("User does not have permission to delete driven hunts");

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