using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MKInformacineSistemaBack.Data;
using MKInformacineSistemaBack.Helpers.Dtos;
using MKInformacineSistemaBack.Models;
using NetTopologySuite;
using NetTopologySuite.Geometries;
using System.Security.Claims;

namespace MKInformacineSistemaBack.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ClubsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly GeometryFactory _geometryFactory;
        private readonly IWebHostEnvironment _hostEnvironment;

        public ClubsController(ApplicationDbContext context, IWebHostEnvironment hostEnvironment)
        {
            _context = context;
            _hostEnvironment = hostEnvironment;
            _geometryFactory = NtsGeometryServices.Instance.CreateGeometryFactory(srid: 4326);
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ClubDto>>> GetClubs()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            // Get all clubs and mark which ones the user is a member of
            var clubs = await _context.Clubs
                .Select(c => new ClubDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    ResidenceAddress = c.ResidenceAddress,
                    UseResidenceAsCenter = c.UseResidenceAsCenter,
                    HuntingAreaLocation = new double[] {
                        c.HuntingAreaLocation.X,
                        c.HuntingAreaLocation.Y
                    },
                    Description = c.Description,
                    LogoUrl = c.LogoUrl,
                    FoundedDate = c.FoundedDate,
                    ContactEmail = c.ContactEmail,
                    ContactPhone = c.ContactPhone,
                    MembersCount = c.Memberships.Count(cm => cm.IsActive),
                    IsUserMember = c.Memberships.Any(cm => cm.UserId == userId && cm.IsActive)
                })
                .ToListAsync();

            return Ok(clubs);
        }

        [HttpGet("MyClubs")]
        public async Task<ActionResult<IEnumerable<ClubDto>>> GetMyClubs()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            // Get only clubs the user is a member of
            var clubs = await _context.ClubMemberships
                .Where(cm => cm.UserId == userId && cm.IsActive)
                .Select(cm => new ClubDto
                {
                    Id = cm.Club.Id,
                    Name = cm.Club.Name,
                    ResidenceAddress = cm.Club.ResidenceAddress,
                    UseResidenceAsCenter = cm.Club.UseResidenceAsCenter,
                    HuntingAreaLocation = new double[] {
                        cm.Club.HuntingAreaLocation.X,
                        cm.Club.HuntingAreaLocation.Y
                    },
                    Description = cm.Club.Description,
                    LogoUrl = cm.Club.LogoUrl,
                    FoundedDate = cm.Club.FoundedDate,
                    ContactEmail = cm.Club.ContactEmail,
                    ContactPhone = cm.Club.ContactPhone,
                    MembersCount = cm.Club.Memberships.Count(m => m.IsActive),
                    IsUserMember = true // Always true for MyClubs
                })
                .ToListAsync();

            return Ok(clubs);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ClubDetailsDto>> GetClub(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            // Check if user is a member of this club
            var isMember = await _context.ClubMemberships
                .AnyAsync(cm => cm.ClubId == id && cm.UserId == userId && cm.IsActive);

            if (!isMember)
            {
                return Forbid("User is not a member of this club");
            }

            var club = await _context.Clubs
                .Where(c => c.Id == id)
                .Select(c => new ClubDetailsDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    ResidenceAddress = c.ResidenceAddress,
                    UseResidenceAsCenter = c.UseResidenceAsCenter,
                    HuntingAreaLocation = new double[] {
                        c.HuntingAreaLocation.X,
                        c.HuntingAreaLocation.Y
                    },
                    Description = c.Description,
                    LogoUrl = c.LogoUrl,
                    FoundedDate = c.FoundedDate,
                    ContactEmail = c.ContactEmail,
                    ContactPhone = c.ContactPhone,
                    MembersCount = c.Memberships.Count(cm => cm.IsActive),
                    IsUserMember = true,
                    Members = c.Memberships
                        .Where(cm => cm.IsActive)
                        .Select(cm => new MemberBasicDto
                        {
                            Id = cm.Id,
                            UserId = cm.UserId,
                            Name = $"{cm.User.FirstName} {cm.User.LastName}",
                            Role = cm.Role,
                            AvatarPhoto = cm.User.AvatarPhoto
                        })
                        .ToList()
                })
                .FirstOrDefaultAsync();

            if (club == null)
                return NotFound();

            return Ok(club);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<ClubDto>> CreateClub([FromBody] CreateClubDto dto)
        {
            if (dto.HuntingAreaLocation == null || dto.HuntingAreaLocation.Length < 2)
            {
                return BadRequest("HuntingAreaLocation must contain [longitude, latitude].");
            }

            double lng = dto.HuntingAreaLocation[0];
            double lat = dto.HuntingAreaLocation[1];

            if (double.IsNaN(lat) || double.IsNaN(lng) ||
                double.IsInfinity(lat) || double.IsInfinity(lng))
            {
                return BadRequest("Coordinates must be valid numbers.");
            }

            var point = _geometryFactory.CreatePoint(new Coordinate(lng, lat));

            var club = new Club
            {
                Name = dto.Name,
                ResidenceAddress = dto.ResidenceAddress,
                UseResidenceAsCenter = dto.UseResidenceAsCenter,
                HuntingAreaLocation = point,
                Description = dto.Description,
                ContactEmail = dto.ContactEmail,
                ContactPhone = dto.ContactPhone,
                FoundedDate = dto.FoundedDate
            };

            _context.Clubs.Add(club);
            await _context.SaveChangesAsync();

            // Add the current user as club owner
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!string.IsNullOrEmpty(userId))
            {
                var membership = new ClubMembership
                {
                    ClubId = club.Id,
                    UserId = userId,
                    Role = "Owner",
                    JoinDate = DateTime.UtcNow,
                    IsActive = true
                };

                _context.ClubMemberships.Add(membership);
                await _context.SaveChangesAsync();
            }

            return CreatedAtAction(nameof(GetClub), new { id = club.Id }, new ClubDto
            {
                Id = club.Id,
                Name = club.Name,
                ResidenceAddress = club.ResidenceAddress,
                UseResidenceAsCenter = club.UseResidenceAsCenter,
                HuntingAreaLocation = new double[] { lng, lat },
                Description = club.Description,
                LogoUrl = club.LogoUrl,
                FoundedDate = club.FoundedDate,
                ContactEmail = club.ContactEmail,
                ContactPhone = club.ContactPhone,
                MembersCount = 1,
                IsUserMember = true
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateClub(int id, [FromBody] UpdateClubDto dto)
        {
            if (id != dto.Id)
                return BadRequest();

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            // Check if user is admin or owner of the club
            var membership = await _context.ClubMemberships
                .FirstOrDefaultAsync(cm => cm.ClubId == id && cm.UserId == userId && cm.IsActive &&
                                           (cm.Role == "Admin" || cm.Role == "Owner"));

            if (membership == null)
                return Forbid();

            var club = await _context.Clubs.FindAsync(id);
            if (club == null)
                return NotFound();

            double lng = dto.HuntingAreaLocation[0];
            double lat = dto.HuntingAreaLocation[1];
            var point = _geometryFactory.CreatePoint(new Coordinate(lng, lat));

            club.Name = dto.Name;
            club.ResidenceAddress = dto.ResidenceAddress;
            club.UseResidenceAsCenter = dto.UseResidenceAsCenter;
            club.HuntingAreaLocation = point;
            club.Description = dto.Description;
            club.ContactEmail = dto.ContactEmail;
            club.ContactPhone = dto.ContactPhone;
            club.FoundedDate = dto.FoundedDate;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpPost("{id}/logo")]
        public async Task<IActionResult> UploadLogo(int id, IFormFile file)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            // Check if user is admin or owner of the club
            var membership = await _context.ClubMemberships
                .FirstOrDefaultAsync(cm => cm.ClubId == id && cm.UserId == userId && cm.IsActive &&
                                           (cm.Role == "Admin" || cm.Role == "Owner"));

            if (membership == null)
                return Forbid();

            var club = await _context.Clubs.FindAsync(id);
            if (club == null)
                return NotFound();

            if (file == null || file.Length == 0)
                return BadRequest("No file was uploaded");

            // Create uploads directory if it doesn't exist
            var uploadsFolder = Path.Combine(_hostEnvironment.WebRootPath, "uploads", "clubs");
            Directory.CreateDirectory(uploadsFolder);

            // Generate unique filename
            var fileName = $"{id}_{DateTime.Now.Ticks}{Path.GetExtension(file.FileName)}";
            var filePath = Path.Combine(uploadsFolder, fileName);

            // Save file
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Delete old logo if exists
            if (!string.IsNullOrEmpty(club.LogoUrl))
            {
                var oldLogoPath = Path.Combine(_hostEnvironment.WebRootPath, club.LogoUrl.TrimStart('/'));
                if (System.IO.File.Exists(oldLogoPath))
                {
                    System.IO.File.Delete(oldLogoPath);
                }
            }

            // Update logo path
            club.LogoUrl = $"/uploads/clubs/{fileName}";
            await _context.SaveChangesAsync();

            return Ok(new { logoUrl = club.LogoUrl });
        }

        [HttpPost("members")]
        public async Task<IActionResult> AddMember([FromBody] AddClubMemberDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            // Check if user is admin or owner of the club
            var membership = await _context.ClubMemberships
                .FirstOrDefaultAsync(cm => cm.ClubId == dto.ClubId && cm.UserId == userId && cm.IsActive &&
                                           (cm.Role == "Admin" || cm.Role == "Owner"));

            if (membership == null)
                return Forbid();

            // Check if the user to add exists
            var userToAdd = await _context.Users.FindAsync(dto.UserId);
            if (userToAdd == null)
                return NotFound("User not found");

            // Check if user is already in the club
            var existingMembership = await _context.ClubMemberships
                .FirstOrDefaultAsync(cm => cm.ClubId == dto.ClubId && cm.UserId == dto.UserId);

            if (existingMembership != null)
            {
                if (existingMembership.IsActive)
                    return BadRequest("User is already in the club");

                // Reactivate membership
                existingMembership.IsActive = true;
                existingMembership.Role = dto.Role;
                await _context.SaveChangesAsync();
                return Ok();
            }

            // Add new membership
            var newMembership = new ClubMembership
            {
                ClubId = dto.ClubId,
                UserId = dto.UserId,
                Role = dto.Role,
                JoinDate = DateTime.UtcNow,
                IsActive = true
            };

            _context.ClubMemberships.Add(newMembership);
            await _context.SaveChangesAsync();
            return Ok();
        }

        [HttpPut("members/{membershipId}")]
        public async Task<IActionResult> UpdateMembership(int membershipId, [FromBody] string role)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var membershipToUpdate = await _context.ClubMemberships
                .Include(cm => cm.Club)
                .FirstOrDefaultAsync(cm => cm.Id == membershipId);

            if (membershipToUpdate == null)
                return NotFound();

            // Check if user is admin or owner of the club
            var membership = await _context.ClubMemberships
                .FirstOrDefaultAsync(cm =>
                    cm.ClubId == membershipToUpdate.ClubId &&
                    cm.UserId == userId &&
                    cm.IsActive &&
                    (cm.Role == "Admin" || cm.Role == "Owner"));

            if (membership == null)
                return Forbid();

            // Update role
            membershipToUpdate.Role = role;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("members/{membershipId}")]
        public async Task<IActionResult> RemoveMember(int membershipId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var membershipToRemove = await _context.ClubMemberships
                .Include(cm => cm.Club)
                .FirstOrDefaultAsync(cm => cm.Id == membershipId);

            if (membershipToRemove == null)
                return NotFound();

            // Check if user is admin or owner of the club, or the member removing themselves
            var membership = await _context.ClubMemberships
                .FirstOrDefaultAsync(cm =>
                    cm.ClubId == membershipToRemove.ClubId &&
                    cm.UserId == userId &&
                    cm.IsActive &&
                    (cm.Role == "Admin" || cm.Role == "Owner"));

            bool isSelfRemoval = membershipToRemove.UserId == userId;
            bool isAuthorized = membership != null;

            if (!isSelfRemoval && !isAuthorized)
                return Forbid();

            // Don't delete - just mark as inactive
            membershipToRemove.IsActive = false;
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}