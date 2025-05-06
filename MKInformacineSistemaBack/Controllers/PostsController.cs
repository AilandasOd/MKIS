using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MKInformacineSistemaBack.Auth.Models;
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
    public class PostsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _hostEnvironment;
        private readonly StatisticsService _statisticsService;

        public PostsController(
            ApplicationDbContext context,
            IWebHostEnvironment hostEnvironment,
            StatisticsService statisticsService)
        {
            _context = context;
            _hostEnvironment = hostEnvironment;
            _statisticsService = statisticsService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<PostDto>>> GetPosts([FromQuery] int clubId)
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

            // Get posts for this club
            var posts = await _context.Posts
                .Where(p => p.ClubId == clubId)
                .Include(p => p.Author)
                .OrderByDescending(p => p.CreatedAt)
                .Select(p => new PostDto
                {
                    Id = p.Id,
                    Type = p.Type,
                    Title = p.Title,
                    Description = p.Description,
                    CreatedAt = p.CreatedAt,
                    ImageUrl = p.ImageUrl,
                    AnimalType = p.AnimalType,
                    HuntedDate = p.HuntedDate,
                    AuthorId = p.AuthorId,
                    AuthorName = $"{p.Author.FirstName} {p.Author.LastName}",
                    AuthorAvatarUrl = p.Author.AvatarPhoto,
                    ClubId = p.ClubId,
                    ClubName = p.Club.Name
                })
                .ToListAsync();

            return Ok(posts);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<PostDto>> GetPost(int id, [FromQuery] int clubId)
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

            // Get the post
            var post = await _context.Posts
                .Include(p => p.Author)
                .Include(p => p.Club)
                .FirstOrDefaultAsync(p => p.Id == id && p.ClubId == clubId);

            if (post == null)
                return NotFound();

            var postDto = new PostDto
            {
                Id = post.Id,
                Type = post.Type,
                Title = post.Title,
                Description = post.Description,
                CreatedAt = post.CreatedAt,
                ImageUrl = post.ImageUrl,
                AnimalType = post.AnimalType,
                HuntedDate = post.HuntedDate,
                AuthorId = post.AuthorId,
                AuthorName = $"{post.Author.FirstName} {post.Author.LastName}",
                AuthorAvatarUrl = post.Author.AvatarPhoto,
                ClubId = post.ClubId,
                ClubName = post.Club.Name
            };

            return Ok(postDto);
        }

        [HttpPost]
        public async Task<ActionResult<PostDto>> CreatePost([FromQuery] int clubId, [FromForm] CreatePostDto dto, IFormFile image)
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

            // Create post
            var post = new Post
            {
                Type = dto.Type,
                Title = dto.Title,
                Description = dto.Description,
                AnimalType = dto.AnimalType,
                HuntedDate = dto.HuntedDate,
                AuthorId = userId,
                ClubId = clubId,
                CreatedAt = DateTime.UtcNow
            };

            // Handle image upload if provided
            if (image != null && image.Length > 0)
            {
                // Create directory if it doesn't exist
                var uploadsFolder = Path.Combine(_hostEnvironment.WebRootPath, "uploads", "posts");
                Directory.CreateDirectory(uploadsFolder);

                // Generate unique filename
                var fileName = $"{Guid.NewGuid()}{Path.GetExtension(image.FileName)}";
                var filePath = Path.Combine(uploadsFolder, fileName);

                // Save file
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await image.CopyToAsync(stream);
                }

                // Save image path
                post.ImageUrl = $"/uploads/posts/{fileName}";
            }

            _context.Posts.Add(post);
            await _context.SaveChangesAsync();

            // Update statistics if this is an animal post
            if (post.Type == "Sumedžiotas žvėris" && !string.IsNullOrEmpty(post.AnimalType))
            {
                await _statisticsService.UpdateStatisticsFromPostAsync(post);
            }

            // Return created post
            var user = await _context.Users.FindAsync(userId);
            var postDto = new PostDto
            {
                Id = post.Id,
                Type = post.Type,
                Title = post.Title,
                Description = post.Description,
                CreatedAt = post.CreatedAt,
                ImageUrl = post.ImageUrl,
                AnimalType = post.AnimalType,
                HuntedDate = post.HuntedDate,
                AuthorId = post.AuthorId,
                AuthorName = $"{user.FirstName} {user.LastName}",
                AuthorAvatarUrl = user.AvatarPhoto,
                ClubId = post.ClubId,
                ClubName = club.Name
            };

            return CreatedAtAction(nameof(GetPost), new { id = post.Id, clubId }, postDto);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePost(int id, [FromQuery] int clubId)
        {
            // Check if user is member of this club
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            // Get the post
            var post = await _context.Posts
                .FirstOrDefaultAsync(p => p.Id == id && p.ClubId == clubId);

            if (post == null)
                return NotFound();

            // Check if the user is the author or has admin rights
            if (post.AuthorId != userId)
            {
                // Check if user has admin or owner role
                var membership = await _context.ClubMemberships
                    .FirstOrDefaultAsync(cm =>
                        cm.ClubId == clubId &&
                        cm.UserId == userId &&
                        cm.IsActive &&
                        (cm.Role == "Admin" || cm.Role == "Owner"));

                if (membership == null)
                    return Forbid("You don't have permission to delete this post");
            }

            // Delete the image file if it exists
            if (!string.IsNullOrEmpty(post.ImageUrl))
            {
                var imagePath = Path.Combine(_hostEnvironment.WebRootPath, post.ImageUrl.TrimStart('/'));
                if (System.IO.File.Exists(imagePath))
                {
                    System.IO.File.Delete(imagePath);
                }
            }

            _context.Posts.Remove(post);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}