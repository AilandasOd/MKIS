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
        public async Task<ActionResult<IEnumerable<DrivenHuntDto>>> GetAllHunts()
        {
            var hunts = await _context.DrivenHunts
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
        public async Task<ActionResult<DrivenHuntDto>> GetHunt(int id)
        {
            var hunt = await _context.DrivenHunts
                .Include(h => h.Leader)
                .Include(h => h.Participants)
                    .ThenInclude(p => p.Member)
                        .ThenInclude(m => m.User)
                .Include(h => h.Participants)
                    .ThenInclude(p => p.HuntedAnimals)
                .FirstOrDefaultAsync(h => h.Id == id);

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
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<DrivenHuntDto>> CreateHunt(CreateDrivenHuntDto dto)
        {
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
                LeaderId = dto.LeaderId
            };

            _context.DrivenHunts.Add(hunt);
            await _context.SaveChangesAsync();

            // Add participants
            if (dto.MemberIds != null && dto.MemberIds.Any())
            {
                foreach (var memberId in dto.MemberIds)
                {
                    var member = await _context.Members.FindAsync(memberId);
                    if (member != null)
                    {
                        _context.DrivenHuntParticipants.Add(new DrivenHuntParticipant
                        {
                            DrivenHuntId = hunt.Id,
                            MemberId = memberId,
                            ShotsTaken = 0,
                            ShotsHit = 0
                        });
                    }
                }
                await _context.SaveChangesAsync();
            }

            return CreatedAtAction(nameof(GetHunt), new { id = hunt.Id }, new DrivenHuntDto
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
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AddParticipant(int huntId, [FromBody] Guid memberId)
        {
            var hunt = await _context.DrivenHunts.FindAsync(huntId);
            if (hunt == null)
            {
                return NotFound("Hunt not found");
            }

            var member = await _context.Members.FindAsync(memberId);
            if (member == null)
            {
                return BadRequest("Invalid member ID");
            }

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
        public async Task<IActionResult> AddAnimal(int huntId, int participantId, [FromBody] AddAnimalDto dto)
        {
            var participant = await _context.DrivenHuntParticipants
                .Include(p => p.HuntedAnimals)
                .FirstOrDefaultAsync(p => p.Id == participantId && p.DrivenHuntId == huntId);

            if (participant == null)
            {
                return NotFound("Participant not found");
            }

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
        public async Task<IActionResult> UpdateShots(int huntId, int participantId, [FromBody] UpdateShotsDto dto)
        {
            var participant = await _context.DrivenHuntParticipants
                .FirstOrDefaultAsync(p => p.Id == participantId && p.DrivenHuntId == huntId);

            if (participant == null)
            {
                return NotFound("Participant not found");
            }

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
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CompleteDrivenHunt(int id)
        {
            var hunt = await _context.DrivenHunts.FindAsync(id);
            if (hunt == null)
            {
                return NotFound();
            }

            hunt.IsCompleted = true;
            hunt.CompletedDate = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Update all members' activity percentages
            await _memberActivityService.UpdateAllMembersActivityAsync();

            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteHunt(int id)
        {
            var hunt = await _context.DrivenHunts.FindAsync(id);
            if (hunt == null)
            {
                return NotFound();
            }

            _context.DrivenHunts.Remove(hunt);
            await _context.SaveChangesAsync();

            // Update member activity after removing a hunt
            await _memberActivityService.UpdateAllMembersActivityAsync();

            return NoContent();
        }
    }
}