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
        public async Task<ActionResult<IEnumerable<UserDto>>> GetNonMemberUsers()
        {
            // Get IDs of users who are already members
            var memberUserIds = await _context.Members
                .Select(m => m.UserId)
                .ToListAsync();

            // Get users who are not members
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
    }
}