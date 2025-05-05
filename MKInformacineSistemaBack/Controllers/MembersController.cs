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
        public async Task<ActionResult<IEnumerable<MemberDto>>> GetMembers()
        {
            var members = await _context.Members
                .Include(m => m.User)
                .Select(m => new MemberDto
                {
                    Id = m.Id,
                    Name = $"{m.User.FirstName} {m.User.LastName}",
                    BirthDate = m.User.DateOfBirth,
                    Photo = m.User.AvatarPhoto,
                    Activity = m.Activity,
                    HuntingSince = m.User.HuntingTicketIssueDate,
                    Status = m.Status,
                    Email = m.User.Email,
                    PhoneNumber = m.User.PhoneNumber,
                    Age = CalculateAge(m.User.DateOfBirth)
                })
                .ToListAsync();

            return Ok(members);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<MemberDto>> GetMember(Guid id)
        {
            var member = await _context.Members
                .Include(m => m.User)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (member == null)
            {
                return NotFound();
            }

            return new MemberDto
            {
                Id = member.Id,
                Name = $"{member.User.FirstName} {member.User.LastName}",
                BirthDate = member.User.DateOfBirth,
                Photo = member.User.AvatarPhoto,
                Activity = member.Activity,
                HuntingSince = member.User.HuntingTicketIssueDate,
                Status = member.Status,
                Email = member.User.Email,
                PhoneNumber = member.User.PhoneNumber,
                Age = CalculateAge(member.User.DateOfBirth)
            };
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<MemberDto>> CreateMember([FromBody] CreateMemberDto dto)
        {
            // Check if user exists
            var user = await _userManager.FindByIdAsync(dto.UserId);
            if (user == null)
            {
                return NotFound("User not found");
            }

            // Check if user is already a member
            var existingMember = await _context.Members.FirstOrDefaultAsync(m => m.UserId == dto.UserId);
            if (existingMember != null)
            {
                return BadRequest("User is already a member");
            }

            var member = new Member
            {
                Id = Guid.NewGuid(),
                UserId = dto.UserId,
                Status = dto.Status,
                Activity = 0 // Initial activity
            };

            _context.Members.Add(member);
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

            return CreatedAtAction(nameof(GetMember), new { id = member.Id }, new MemberDto
            {
                Id = member.Id,
                Name = $"{user.FirstName} {user.LastName}",
                BirthDate = user.DateOfBirth,
                Photo = user.AvatarPhoto,
                Activity = member.Activity,
                HuntingSince = user.HuntingTicketIssueDate,
                Status = member.Status,
                Email = user.Email,
                PhoneNumber = user.PhoneNumber,
                Age = CalculateAge(user.DateOfBirth)
            });
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteMember(Guid id)
        {
            var member = await _context.Members.FindAsync(id);
            if (member == null)
            {
                return NotFound();
            }

            // Remove role from user
            var user = await _userManager.FindByIdAsync(member.UserId);
            if (user != null)
            {
                if (member.Status == "Administratorius")
                {
                    await _userManager.RemoveFromRoleAsync(user, Roles.Admin);
                }
                else
                {
                    await _userManager.RemoveFromRoleAsync(user, Roles.Hunter);
                }
            }

            _context.Members.Remove(member);
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
}