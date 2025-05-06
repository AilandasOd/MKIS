using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MKInformacineSistemaBack.Auth.Models;
using MKInformacineSistemaBack.Data;
using MKInformacineSistemaBack.Helpers.Dtos;
using MKInformacineSistemaBack.Models;
using System.Security.Claims;

namespace MKInformacineSistemaBack.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class MembersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<User> _userManager;

        public MembersController(ApplicationDbContext context, UserManager<User> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<MemberDto>>> GetMembers([FromQuery] int? clubId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            IQueryable<MemberDto> membersQuery;

            if (clubId.HasValue)
            {
                // Check if the user is a member of this club
                var membership = await _context.ClubMemberships
                    .FirstOrDefaultAsync(cm => cm.ClubId == clubId && cm.UserId == userId && cm.IsActive);

                if (membership == null)
                    return Forbid("You are not a member of this club");

                // Get members of this club
                membersQuery = _context.ClubMemberships
                    .Where(cm => cm.ClubId == clubId && cm.IsActive)
                    .Join(_context.Users,
                        cm => cm.UserId,
                        u => u.Id,
                        (cm, u) => new MemberDto
                        {
                            Id = cm.Id,  // This is an int, not a Guid
                            UserId = u.Id,
                            Name = $"{u.FirstName} {u.LastName}",
                            BirthDate = u.DateOfBirth,
                            Photo = u.AvatarPhoto,
                            Activity = 0,  // Will be calculated below
                            HuntingSince = u.HuntingTicketIssueDate,
                            Status = cm.Role,
                            Email = u.Email,
                            PhoneNumber = u.PhoneNumber,
                            Age = CalculateAge(u.DateOfBirth)
                        });
            }
            else
            {
                // Get all club members by user role
                var userIsAdmin = User.IsInRole(Roles.Admin);
                if (!userIsAdmin)
                    return Forbid("Only administrators can view all members");

                // First, get all users
                var allUsers = await _context.Users.ToListAsync();
                // Then filter in memory
                var huntingUsers = new List<User>();
                foreach (var user in allUsers)
                {
                    if (await _userManager.IsInRoleAsync(user, Roles.Hunter))
                    {
                        huntingUsers.Add(user);
                    }
                }

                // Now map the filtered users to DTOs
                membersQuery = huntingUsers.Select(u => new MemberDto
                {
                    Id = 0,  // Placeholder ID
                    UserId = u.Id,
                    Name = $"{u.FirstName} {u.LastName}",
                    BirthDate = u.DateOfBirth,
                    Photo = u.AvatarPhoto,
                    Activity = 0,  // Will be calculated below
                    HuntingSince = u.HuntingTicketIssueDate,
                    Status = "Member", // Default status
                    Email = u.Email,
                    PhoneNumber = u.PhoneNumber,
                    Age = CalculateAge(u.DateOfBirth)
                }).AsQueryable();

            }

            var members = membersQuery.ToList();


            // Calculate activity for each member
            if (clubId.HasValue)
            {
                foreach (var member in members)
                {
                    // Get statistics for this user in this club
                    var stats = await _context.UserStatistics
                        .FirstOrDefaultAsync(s =>
                            s.UserId == member.UserId &&
                            s.ClubId == clubId &&
                            s.Year == DateTime.UtcNow.Year);

                    if (stats != null)
                    {
                        member.Activity = stats.ActivityPercentage;
                    }
                }
            }

            return Ok(members);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<MemberDto>> GetMember(int id, [FromQuery] int? clubId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            if (!clubId.HasValue)
                return BadRequest("Club ID is required");

            // Check if the user is a member of this club
            var userMembership = await _context.ClubMemberships
                .FirstOrDefaultAsync(cm => cm.ClubId == clubId && cm.UserId == userId && cm.IsActive);

            if (userMembership == null)
                return Forbid("You are not a member of this club");

            // Find the membership by ID within this club
            var membership = await _context.ClubMemberships
                .Include(cm => cm.User)
                .FirstOrDefaultAsync(cm => cm.Id == id && cm.ClubId == clubId && cm.IsActive);

            if (membership == null)
                return NotFound();

            // Calculate activity
            var stats = await _context.UserStatistics
                .FirstOrDefaultAsync(s =>
                    s.UserId == membership.UserId &&
                    s.ClubId == clubId &&
                    s.Year == DateTime.UtcNow.Year);

            int activityPercentage = stats?.ActivityPercentage ?? 0;

            var memberDto = new MemberDto
            {
                Id = membership.Id,
                UserId = membership.UserId,
                Name = $"{membership.User.FirstName} {membership.User.LastName}",
                BirthDate = membership.User.DateOfBirth,
                Photo = membership.User.AvatarPhoto,
                Activity = activityPercentage,
                HuntingSince = membership.User.HuntingTicketIssueDate,
                Status = membership.Role,
                Email = membership.User.Email,
                PhoneNumber = membership.User.PhoneNumber,
                Age = CalculateAge(membership.User.DateOfBirth)
            };

            return Ok(memberDto);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<MemberDto>> CreateMember([FromBody] CreateMemberDto dto, [FromQuery] int clubId)
        {
            // Check if user exists
            var user = await _userManager.FindByIdAsync(dto.UserId);
            if (user == null)
                return NotFound("User not found");

            // Check if user is already a member of this club
            var existingMembership = await _context.ClubMemberships
                .FirstOrDefaultAsync(cm => cm.ClubId == clubId && cm.UserId == dto.UserId);

            if (existingMembership != null)
            {
                if (existingMembership.IsActive)
                    return BadRequest("User is already a member of this club");

                // If membership exists but is inactive, reactivate it
                existingMembership.IsActive = true;
                existingMembership.Role = dto.Status;
                await _context.SaveChangesAsync();

                // Add role based on status
                if (dto.Status == "Administratorius")
                {
                    await _userManager.AddToRoleAsync(user, Roles.Admin);
                }
                else
                {
                    await _userManager.AddToRoleAsync(user, Roles.Hunter);
                }

                // Return reactivated membership
                return CreatedAtAction(nameof(GetMember),
                    new { id = existingMembership.Id, clubId },
                    new MemberDto
                    {
                        Id = existingMembership.Id,
                        UserId = user.Id,
                        Name = $"{user.FirstName} {user.LastName}",
                        BirthDate = user.DateOfBirth,
                        Photo = user.AvatarPhoto,
                        Activity = 0,
                        HuntingSince = user.HuntingTicketIssueDate,
                        Status = existingMembership.Role,
                        Email = user.Email,
                        PhoneNumber = user.PhoneNumber,
                        Age = CalculateAge(user.DateOfBirth)
                    });
            }

            // Create new membership
            var membership = new ClubMembership
            {
                ClubId = clubId,
                UserId = dto.UserId,
                Role = dto.Status,
                JoinDate = DateTime.UtcNow,
                IsActive = true
            };

            _context.ClubMemberships.Add(membership);
            await _context.SaveChangesAsync();

            // Add role based on status
            if (dto.Status == "Administratorius")
            {
                await _userManager.AddToRoleAsync(user, Roles.Admin);
            }
            else
            {
                await _userManager.AddToRoleAsync(user, Roles.Hunter);
            }

            return CreatedAtAction(nameof(GetMember),
                new { id = membership.Id, clubId },
                new MemberDto
                {
                    Id = membership.Id,
                    UserId = user.Id,
                    Name = $"{user.FirstName} {user.LastName}",
                    BirthDate = user.DateOfBirth,
                    Photo = user.AvatarPhoto,
                    Activity = 0,
                    HuntingSince = user.HuntingTicketIssueDate,
                    Status = membership.Role,
                    Email = user.Email,
                    PhoneNumber = user.PhoneNumber,
                    Age = CalculateAge(user.DateOfBirth)
                });
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteMember(int id, [FromQuery] int clubId)
        {
            var membership = await _context.ClubMemberships
                .Include(cm => cm.User)
                .FirstOrDefaultAsync(cm => cm.Id == id && cm.ClubId == clubId);

            if (membership == null)
                return NotFound();

            // Don't actually delete - just mark as inactive
            membership.IsActive = false;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private static int CalculateAge(DateTime birthDate)
        {
            var today = DateTime.Today;
            var age = today.Year - birthDate.Year;
            if (birthDate.Date > today.AddYears(-age)) age--;
            return age;
        }
    }

    // Update MemberDto to use int for Id
    public class MemberDto
    {
        public int Id { get; set; }
        public string UserId { get; set; }
        public string Name { get; set; }
        public DateTime BirthDate { get; set; }
        public string Photo { get; set; }
        public int Activity { get; set; }
        public DateTime HuntingSince { get; set; }
        public string Status { get; set; }
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
        public int Age { get; set; }
    }
}