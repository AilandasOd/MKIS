using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MKInformacineSistemaBack.Auth.Models;
using MKInformacineSistemaBack.Data;
using MKInformacineSistemaBack.Helpers.Dtos;

namespace MKInformacineSistemaBack.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class UsersController : ControllerBase
    {
        private readonly UserManager<User> _userManager;
        private readonly ApplicationDbContext _context;

        public UsersController(UserManager<User> userManager, ApplicationDbContext context)
        {
            _userManager = userManager;
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<UserDto>>> GetAllUsers()
        {
            var users = await _userManager.Users
                .Select(u => new UserDto
                {
                    Id = u.Id,
                    UserName = u.UserName,
                    FirstName = u.FirstName,
                    LastName = u.LastName,
                    Email = u.Email,
                    PhoneNumber = u.PhoneNumber,
                    DateOfBirth = u.DateOfBirth,
                    AvatarPhoto = u.AvatarPhoto,
                    HuntingTicketIssueDate = u.HuntingTicketIssueDate
                })
                .ToListAsync();

            return Ok(users);
        }

        [HttpGet("NonMembers")]
        public async Task<ActionResult<IEnumerable<UserDto>>> GetNonMemberUsers([FromQuery] int clubId)
        {
            // Get IDs of users who are already members of this club
            var memberUserIds = await _context.ClubMemberships
                .Where(cm => cm.ClubId == clubId && cm.IsActive)
                .Select(cm => cm.UserId)
                .ToListAsync();

            // Get users who are not members of this club
            var nonMemberUsers = await _userManager.Users
                .Where(u => !memberUserIds.Contains(u.Id))
                .Select(u => new UserDto
                {
                    Id = u.Id,
                    UserName = u.UserName,
                    FirstName = u.FirstName,
                    LastName = u.LastName,
                    Email = u.Email,
                    PhoneNumber = u.PhoneNumber,
                    DateOfBirth = u.DateOfBirth,
                    AvatarPhoto = u.AvatarPhoto,
                    HuntingTicketIssueDate = u.HuntingTicketIssueDate
                })
                .ToListAsync();

            return Ok(nonMemberUsers);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<UserDto>> GetUser(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
            {
                return NotFound();
            }

            return new UserDto
            {
                Id = user.Id,
                UserName = user.UserName,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                PhoneNumber = user.PhoneNumber,
                DateOfBirth = user.DateOfBirth,
                AvatarPhoto = user.AvatarPhoto,
                HuntingTicketIssueDate = user.HuntingTicketIssueDate
            };
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(string id, [FromBody] UpdateUserDto dto)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
            {
                return NotFound();
            }

            // Update user properties
            user.FirstName = dto.FirstName;
            user.LastName = dto.LastName;
            user.PhoneNumber = dto.PhoneNumber;
            user.DateOfBirth = dto.DateOfBirth;
            user.HuntingTicketIssueDate = dto.HuntingTicketIssueDate;

            // Only update email if it's changed
            if (user.Email != dto.Email)
            {
                var setEmailResult = await _userManager.SetEmailAsync(user, dto.Email);
                if (!setEmailResult.Succeeded)
                    return BadRequest(setEmailResult.Errors);
            }

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
                return BadRequest(result.Errors);

            return NoContent();
        }

        [HttpPost("{id}/roles")]
        public async Task<IActionResult> AddToRole(string id, [FromBody] string role)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
            {
                return NotFound();
            }

            // Validate role
            if (!Roles.All.Contains(role))
            {
                return BadRequest($"Invalid role. Valid roles are: {string.Join(", ", Roles.All)}");
            }

            // Check if user already has this role
            if (await _userManager.IsInRoleAsync(user, role))
            {
                return BadRequest($"User already has the role: {role}");
            }

            var result = await _userManager.AddToRoleAsync(user, role);
            if (!result.Succeeded)
                return BadRequest(result.Errors);

            return NoContent();
        }

        [HttpDelete("{id}/roles/{role}")]
        public async Task<IActionResult> RemoveFromRole(string id, string role)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
            {
                return NotFound();
            }

            // Validate role
            if (!Roles.All.Contains(role))
            {
                return BadRequest($"Invalid role. Valid roles are: {string.Join(", ", Roles.All)}");
            }

            // Check if user has this role
            if (!await _userManager.IsInRoleAsync(user, role))
            {
                return BadRequest($"User does not have the role: {role}");
            }

            var result = await _userManager.RemoveFromRoleAsync(user, role);
            if (!result.Succeeded)
                return BadRequest(result.Errors);

            return NoContent();
        }
    }

    public class UpdateUserDto
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public DateTime DateOfBirth { get; set; }
        public DateTime HuntingTicketIssueDate { get; set; }
    }
}