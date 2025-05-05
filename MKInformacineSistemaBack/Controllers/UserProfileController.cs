using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using MKInformacineSistemaBack.Auth.Models;
using MKInformacineSistemaBack.Helpers.Dtos;
using System.Security.Claims;

namespace MKInformacineSistemaBack.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UserProfileController : ControllerBase
    {
        private readonly UserManager<User> _userManager;
        private readonly IWebHostEnvironment _hostEnvironment;

        public UserProfileController(UserManager<User> userManager, IWebHostEnvironment hostEnvironment)
        {
            _userManager = userManager;
            _hostEnvironment = hostEnvironment;
        }

        [HttpGet]
        public async Task<ActionResult<UserProfileDto>> GetCurrentUser()
        {
            // Get current user ID from claims
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
                return Unauthorized();

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return NotFound();

            return Ok(new UserProfileDto
            {
                UserName = user.UserName,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email,
                PhoneNumber = user.PhoneNumber,
                DateOfBirth = user.DateOfBirth,
                Age = user.Age,
                AvatarPhoto = user.AvatarPhoto,
                HuntingTicketIssueDate = user.HuntingTicketIssueDate
            });
        }

        [HttpPut]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateUserProfileDto model)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
                return Unauthorized();

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return NotFound();

            // Update user properties
            user.FirstName = model.FirstName;
            user.LastName = model.LastName;
            user.PhoneNumber = model.PhoneNumber;
            user.DateOfBirth = model.DateOfBirth;
            user.HuntingTicketIssueDate = model.HuntingTicketIssueDate;

            // Only update email if it's changed
            if (user.Email != model.Email)
            {
                var setEmailResult = await _userManager.SetEmailAsync(user, model.Email);
                if (!setEmailResult.Succeeded)
                    return BadRequest(setEmailResult.Errors);
            }

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
                return BadRequest(result.Errors);

            return NoContent();
        }

        [HttpPost("avatar")]
        public async Task<IActionResult> UploadAvatar(IFormFile file)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
                return Unauthorized();

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return NotFound();

            if (file == null || file.Length == 0)
                return BadRequest("No file was uploaded");

            // Create uploads directory if it doesn't exist
            var uploadsFolder = Path.Combine(_hostEnvironment.WebRootPath, "uploads", "avatars");
            Directory.CreateDirectory(uploadsFolder);

            // Generate unique filename
            var fileName = $"{userId}_{DateTime.Now.Ticks}{Path.GetExtension(file.FileName)}";
            var filePath = Path.Combine(uploadsFolder, fileName);

            // Save file
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Update user avatar path
            user.AvatarPhoto = $"/uploads/avatars/{fileName}";
            await _userManager.UpdateAsync(user);

            return Ok(new { avatarUrl = user.AvatarPhoto });
        }
    }
}