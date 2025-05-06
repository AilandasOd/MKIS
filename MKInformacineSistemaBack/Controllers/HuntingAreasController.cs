using Microsoft.AspNetCore.Mvc;
using MKInformacineSistemaBack.Data;
using Microsoft.EntityFrameworkCore;
using MKInformacineSistemaBack.Models;
using MKInformacineSistemaBack.Helpers.Dtos;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace MKInformacineSistemaBack.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class HuntingAreasController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public HuntingAreasController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<List<HuntingAreaDto>>> Get([FromQuery] int clubId)
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

            var areas = await _context.HuntingAreas
                .Where(a => a.ClubId == clubId)
                .ToListAsync();

            return areas.Select(area => new HuntingAreaDto
            {
                Id = area.Id,
                Name = area.Name,
                Coordinates = JsonSerializer.Deserialize<List<CoordinateDto>>(area.CoordinatesJson) ?? new()
            }).ToList();
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] HuntingAreaDto dto, [FromQuery] int clubId)
        {
            // Check if user is member of this club
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            // Find the membership record for this user in this club
            var membership = await _context.ClubMemberships
                .FirstOrDefaultAsync(cm =>
                    cm.ClubId == clubId &&
                    cm.UserId == userId &&
                    cm.IsActive &&
                    (cm.Role == "Admin" || cm.Role == "Owner"));

            if (membership == null)
                return Forbid("You don't have permission to create hunting areas");

            var area = new HuntingArea
            {
                Name = dto.Name,
                CoordinatesJson = JsonSerializer.Serialize(dto.Coordinates),
                ClubId = clubId
            };

            _context.HuntingAreas.Add(area);
            await _context.SaveChangesAsync();

            return Ok(new { area.Id });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] HuntingAreaDto dto, [FromQuery] int clubId)
        {
            // Check if user is member of this club
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            // Find the membership record for this user in this club
            var membership = await _context.ClubMemberships
                .FirstOrDefaultAsync(cm =>
                    cm.ClubId == clubId &&
                    cm.UserId == userId &&
                    cm.IsActive &&
                    (cm.Role == "Admin" || cm.Role == "Owner"));

            if (membership == null)
                return Forbid("You don't have permission to update hunting areas");

            var area = await _context.HuntingAreas
                .FirstOrDefaultAsync(a => a.Id == id && a.ClubId == clubId);

            if (area == null) return NotFound();

            area.Name = dto.Name;
            area.CoordinatesJson = JsonSerializer.Serialize(dto.Coordinates);

            await _context.SaveChangesAsync();
            return Ok(area.Id);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id, [FromQuery] int clubId)
        {
            // Check if user is member of this club
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            // Find the membership record for this user in this club
            var membership = await _context.ClubMemberships
                .FirstOrDefaultAsync(cm =>
                    cm.ClubId == clubId &&
                    cm.UserId == userId &&
                    cm.IsActive &&
                    (cm.Role == "Admin" || cm.Role == "Owner"));

            if (membership == null)
                return Forbid("You don't have permission to delete hunting areas");

            var area = await _context.HuntingAreas
                .FirstOrDefaultAsync(a => a.Id == id && a.ClubId == clubId);

            if (area == null) return NotFound();

            _context.HuntingAreas.Remove(area);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}