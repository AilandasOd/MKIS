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

        public ClubsController(ApplicationDbContext context)
        {
            _context = context;
            _geometryFactory = NtsGeometryServices.Instance.CreateGeometryFactory(srid: 4326);
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ClubDto>>> GetClubs()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            // Find the member record for this user
            var member = await _context.Members
                .FirstOrDefaultAsync(m => m.UserId == userId);

            if (member == null)
            {
                // Return empty list as the user is not a member yet
                return Ok(new List<ClubDto>());
            }

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
                    IsUserMember = c.Memberships.Any(cm => cm.MemberId == member.Id && cm.IsActive)
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

            // Find the member record for this user
            var member = await _context.Members
                .FirstOrDefaultAsync(m => m.UserId == userId);

            if (member == null)
            {
                return Ok(new List<ClubDto>());
            }

            // Get only clubs the user is a member of
            var clubs = await _context.ClubMemberships
                .Where(cm => cm.MemberId == member.Id && cm.IsActive)
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

            // Find the member record for this user
            var member = await _context.Members
                .FirstOrDefaultAsync(m => m.UserId == userId);

            if (member == null)
            {
                return Unauthorized("User is not a member of any club");
            }

            // Check if user is a member of this club
            var isMember = await _context.ClubMemberships
                .AnyAsync(cm => cm.ClubId == id && cm.MemberId == member.Id && cm.IsActive);

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
                            Id = cm.Member.Id,
                            Name = cm.Member.Name,
                            Role = cm.Role,
                            AvatarPhoto = cm.Member.User.AvatarPhoto
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
            var member = await _context.Members
                .FirstOrDefaultAsync(m => m.UserId == userId);

            if (member != null)
            {
                var membership = new ClubMembership
                {
                    ClubId = club.Id,
                    MemberId = member.Id,
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
            var member = await _context.Members
                .FirstOrDefaultAsync(m => m.UserId == userId);

            if (member == null)
                return Unauthorized();

            // Check if user is admin or owner of the club
            var membership = await _context.ClubMemberships
                .FirstOrDefaultAsync(cm => cm.ClubId == id && cm.MemberId == member.Id && cm.IsActive);

            if (membership == null || (membership.Role != "Admin" && membership.Role != "Owner"))
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

        [HttpPost("members")]
        public async Task<IActionResult> AddMember([FromBody] AddClubMemberDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var currentMember = await _context.Members
                .FirstOrDefaultAsync(m => m.UserId == userId);

            if (currentMember == null)
                return Unauthorized();

            // Check if user is admin or owner of the club
            var membership = await _context.ClubMemberships
                .FirstOrDefaultAsync(cm => cm.ClubId == dto.ClubId && cm.MemberId == currentMember.Id && cm.IsActive);

            if (membership == null || (membership.Role != "Admin" && membership.Role != "Owner"))
                return Forbid();

            // Check if the member to add exists
            var memberToAdd = await _context.Members.FindAsync(dto.MemberId);
            if (memberToAdd == null)
                return NotFound("Member not found");

            // Check if member is already in the club
            var existingMembership = await _context.ClubMemberships
                .FirstOrDefaultAsync(cm => cm.ClubId == dto.ClubId && cm.MemberId == dto.MemberId);

            if (existingMembership != null)
            {
                if (existingMembership.IsActive)
                    return BadRequest("Member is already in the club");

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
                MemberId = dto.MemberId,
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
            var currentMember = await _context.Members
                .FirstOrDefaultAsync(m => m.UserId == userId);

            if (currentMember == null)
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
                    cm.MemberId == currentMember.Id &&
                    cm.IsActive);

            if (membership == null || (membership.Role != "Admin" && membership.Role != "Owner"))
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
            var currentMember = await _context.Members
                .FirstOrDefaultAsync(m => m.UserId == userId);

            if (currentMember == null)
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
                    cm.MemberId == currentMember.Id &&
                    cm.IsActive);

            bool isSelfRemoval = membershipToRemove.MemberId == currentMember.Id;
            bool isAuthorized = membership != null && (membership.Role == "Admin" || membership.Role == "Owner");

            if (!isSelfRemoval && !isAuthorized)
                return Forbid();

            // Don't delete - just mark as inactive
            membershipToRemove.IsActive = false;
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}