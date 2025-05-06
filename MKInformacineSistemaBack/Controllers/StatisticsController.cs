using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MKInformacineSistemaBack.Data;
using MKInformacineSistemaBack.Helpers.Dtos;
using MKInformacineSistemaBack.Models;
using System.Security.Claims;

namespace MKInformacineSistemaBack.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class BloodTestsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public BloodTestsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<BloodTestDto>>> GetTests([FromQuery] int clubId)
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

            // Get tests for this club
            var tests = await _context.BloodTests
                .Where(t => t.ClubId == clubId)
                .Include(t => t.Participants)
                    .ThenInclude(p => p.User)
                .OrderByDescending(t => t.TestStartDate)
                .Select(t => new BloodTestDto
                {
                    Id = t.Id,
                    TestName = t.TestName,
                    AnimalType = t.AnimalType,
                    DateHunted = t.DateHunted,
                    TestStartDate = t.TestStartDate,
                    Status = t.Status,
                    CompletedDate = t.CompletedDate,
                    Description = t.Description,
                    Participants = t.Participants.Select(p => new BloodTestParticipantDto
                    {
                        Id = p.Id,
                        UserId = p.UserId,
                        UserName = $"{p.User.FirstName} {p.User.LastName}"
                    }).ToList()
                })
                .ToListAsync();

            return Ok(tests);
        }

        [HttpPost]
        public async Task<ActionResult<BloodTestDto>> CreateTest([FromQuery] int clubId, [FromBody] CreateBloodTestDto dto)
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

            // Validate club exists
            var club = await _context.Clubs.FindAsync(clubId);
            if (club == null)
                return NotFound("Club not found");

            // Create test
            var test = new BloodTest
            {
                TestName = dto.TestName,
                AnimalType = dto.AnimalType,
                DateHunted = dto.DateHunted,
                TestStartDate = dto.TestStartDate,
                Status = dto.Status,
                Description = dto.Description,
                ClubId = clubId
            };

            _context.BloodTests.Add(test);
            await _context.SaveChangesAsync();

            // Add participants if provided
            if (dto.ParticipantIds != null && dto.ParticipantIds.Any())
            {
                foreach (var participantId in dto.ParticipantIds)
                {
                    // Verify the user exists and is a member of this club
                    var user = await _context.Users.FindAsync(participantId);
                    var userMembership = await _context.ClubMemberships
                        .AnyAsync(cm => cm.ClubId == clubId && cm.UserId == participantId && cm.IsActive);

                    if (user != null && userMembership)
                    {
                        _context.BloodTestParticipants.Add(new BloodTestParticipant
                        {
                            BloodTestId = test.Id,
                            UserId = participantId
                        });
                    }
                }
                await _context.SaveChangesAsync();
            }

            // Always add the current user as a participant if not already included
            if (dto.ParticipantIds == null || !dto.ParticipantIds.Contains(userId))
            {
                _context.BloodTestParticipants.Add(new BloodTestParticipant
                {
                    BloodTestId = test.Id,
                    UserId = userId
                });
                await _context.SaveChangesAsync();
            }

            // Return created test
            return CreatedAtAction(nameof(GetTest), new { id = test.Id, clubId },
                await GetTestDtoById(test.Id));
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<BloodTestDto>> GetTest(int id, [FromQuery] int clubId)
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

            var testDto = await GetTestDtoById(id);
            if (testDto == null)
                return NotFound();

            return Ok(testDto);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTest(int id, [FromQuery] int clubId, [FromBody] UpdateBloodTestDto dto)
        {
            // Check if user is member of this club
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            // Find the membership record for this user in this club with appropriate permissions
            var membership = await _context.ClubMemberships
                .FirstOrDefaultAsync(cm =>
                    cm.ClubId == clubId &&
                    cm.UserId == userId &&
                    cm.IsActive &&
                    (cm.Role == "Admin" || cm.Role == "Owner"));

            if (membership == null)
            {
                // Check if the user is a participant in this test
                var isParticipant = await _context.BloodTestParticipants
                    .AnyAsync(p => p.BloodTestId == id && p.UserId == userId);

                if (!isParticipant)
                    return Forbid("You don't have permission to update this test");
            }

            // Get the test
            var test = await _context.BloodTests
                .FirstOrDefaultAsync(t => t.Id == id && t.ClubId == clubId);

            if (test == null)
                return NotFound();

            // Update test
            test.TestName = dto.TestName;
            test.AnimalType = dto.AnimalType;
            test.DateHunted = dto.DateHunted;
            test.TestStartDate = dto.TestStartDate;
            test.Status = dto.Status;
            test.Description = dto.Description;

            // Only admin can update completion date
            if (membership != null && dto.CompletedDate.HasValue)
                test.CompletedDate = dto.CompletedDate;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTest(int id, [FromQuery] int clubId)
        {
            // Check if user has admin permissions
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            // Find the membership record for this user in this club with appropriate permissions
            var membership = await _context.ClubMemberships
                .FirstOrDefaultAsync(cm =>
                    cm.ClubId == clubId &&
                    cm.UserId == userId &&
                    cm.IsActive &&
                    (cm.Role == "Admin" || cm.Role == "Owner"));

            if (membership == null)
                return Forbid("You don't have permission to delete this test");

            // Get the test
            var test = await _context.BloodTests
                .FirstOrDefaultAsync(t => t.Id == id && t.ClubId == clubId);

            if (test == null)
                return NotFound();

            _context.BloodTests.Remove(test);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpPost("{testId}/participants")]
        public async Task<IActionResult> AddParticipant(int testId, [FromQuery] int clubId, [FromBody] string userId)
        {
            // Check if the current user has appropriate permissions
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(currentUserId))
                return Unauthorized();

            // Find the membership record for this user in this club
            var membership = await _context.ClubMemberships
                .FirstOrDefaultAsync(cm =>
                    cm.ClubId == clubId &&
                    cm.UserId == currentUserId &&
                    cm.IsActive &&
                    (cm.Role == "Admin" || cm.Role == "Owner"));

            // Check if the test exists and belongs to this club
            var test = await _context.BloodTests
                .FirstOrDefaultAsync(t => t.Id == testId && t.ClubId == clubId);

            if (test == null)
                return NotFound("Test not found");

            // Check if the user to add exists and is a member of this club
            var userMembership = await _context.ClubMemberships
                .FirstOrDefaultAsync(cm => cm.ClubId == clubId && cm.UserId == userId && cm.IsActive);

            if (userMembership == null)
                return BadRequest("User is not a member of this club");

            // Check if the user is already a participant
            var existingParticipant = await _context.BloodTestParticipants
                .FirstOrDefaultAsync(p => p.BloodTestId == testId && p.UserId == userId);

            if (existingParticipant != null)
                return BadRequest("User is already a participant");

            // Add the participant
            _context.BloodTestParticipants.Add(new BloodTestParticipant
            {
                BloodTestId = testId,
                UserId = userId
            });

            await _context.SaveChangesAsync();
            return Ok();
        }

        [HttpDelete("{testId}/participants/{participantId}")]
        public async Task<IActionResult> RemoveParticipant(int testId, int participantId, [FromQuery] int clubId)
        {
            // Check if the current user has appropriate permissions
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(currentUserId))
                return Unauthorized();

            // Find the membership record for this user in this club
            var membership = await _context.ClubMemberships
                .FirstOrDefaultAsync(cm =>
                    cm.ClubId == clubId &&
                    cm.UserId == currentUserId &&
                    cm.IsActive &&
                    (cm.Role == "Admin" || cm.Role == "Owner"));

            // Get the participant
            var participant = await _context.BloodTestParticipants
                .Include(p => p.BloodTest)
                .FirstOrDefaultAsync(p => p.Id == participantId && p.BloodTestId == testId);

            if (participant == null)
                return NotFound();

            // Check if the test belongs to this club
            if (participant.BloodTest.ClubId != clubId)
                return NotFound("Test not found in this club");

            // Check if the current user is removing themselves or has admin permissions
            if (participant.UserId != currentUserId && membership == null)
                return Forbid("You don't have permission to remove other participants");

            _context.BloodTestParticipants.Remove(participant);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // Helper method to get a test DTO by ID
        private async Task<BloodTestDto?> GetTestDtoById(int id)
        {
            return await _context.BloodTests
                .Where(t => t.Id == id)
                .Include(t => t.Participants)
                    .ThenInclude(p => p.User)
                .Select(t => new BloodTestDto
                {
                    Id = t.Id,
                    TestName = t.TestName,
                    AnimalType = t.AnimalType,
                    DateHunted = t.DateHunted,
                    TestStartDate = t.TestStartDate,
                    Status = t.Status,
                    CompletedDate = t.CompletedDate,
                    Description = t.Description,
                    Participants = t.Participants.Select(p => new BloodTestParticipantDto
                    {
                        Id = p.Id,
                        UserId = p.UserId,
                        UserName = $"{p.User.FirstName} {p.User.LastName}"
                    }).ToList()
                })
                .FirstOrDefaultAsync();
        }
    }

    // Additional DTOs needed for the controller

    public class BloodTestDto
    {
        public int Id { get; set; }
        public string TestName { get; set; } = string.Empty;
        public string AnimalType { get; set; } = string.Empty;
        public DateTime DateHunted { get; set; }
        public DateTime TestStartDate { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime? CompletedDate { get; set; }
        public string Description { get; set; } = string.Empty;
        public List<BloodTestParticipantDto> Participants { get; set; } = new();
    }

    public class BloodTestParticipantDto
    {
        public int Id { get; set; }
        public string UserId { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
    }

    public class CreateBloodTestDto
    {
        public string TestName { get; set; } = string.Empty;
        public string AnimalType { get; set; } = string.Empty;
        public DateTime DateHunted { get; set; }
        public DateTime TestStartDate { get; set; }
        public string Status { get; set; } = "Laukiama";
        public string Description { get; set; } = string.Empty;
        public List<string>? ParticipantIds { get; set; }
    }

    public class UpdateBloodTestDto
    {
        public string TestName { get; set; } = string.Empty;
        public string AnimalType { get; set; } = string.Empty;
        public DateTime DateHunted { get; set; }
        public DateTime TestStartDate { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime? CompletedDate { get; set; }
        public string Description { get; set; } = string.Empty;
    }
}