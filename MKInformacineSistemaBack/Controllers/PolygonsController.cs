using Microsoft.AspNetCore.Mvc;
using MKInformacineSistemaBack.Models;
using System.Text.Json;
using MKInformacineSistemaBack.Data;
using MKInformacineSistemaBack.Helpers.Dtos;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace MKInformacineSistemaBack.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PolygonsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public PolygonsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> CreatePolygon([FromBody] PolygonDto dto, [FromQuery] int clubId)
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
                return Forbid("You don't have permission to create polygons");

            var polygon = new Polygon
            {
                Name = dto.Name,
                CoordinatesJson = JsonSerializer.Serialize(dto.Coordinates),
                ClubId = clubId
            };

            _context.Polygons.Add(polygon);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, polygon.Id });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePolygon(int id, [FromBody] PolygonDto dto, [FromQuery] int clubId)
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
                return Forbid("You don't have permission to update polygons");

            var polygon = await _context.Polygons
                .FirstOrDefaultAsync(p => p.Id == id && p.ClubId == clubId);

            if (polygon == null)
            {
                return NotFound(new { success = false, message = "Polygon not found" });
            }

            polygon.Name = dto.Name;
            polygon.CoordinatesJson = JsonSerializer.Serialize(dto.Coordinates);

            _context.Polygons.Update(polygon);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Polygon updated successfully" });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetPolygonById(int id, [FromQuery] int clubId)
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

            var polygon = await _context.Polygons
                .FirstOrDefaultAsync(p => p.Id == id && p.ClubId == clubId);

            if (polygon == null)
            {
                return NotFound(new { success = false, message = "Polygon not found" });
            }

            return Ok(polygon);
        }

        [HttpGet]
        public async Task<IActionResult> GetPolygons([FromQuery] int clubId)
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

            var polygons = await _context.Polygons
                .Where(p => p.ClubId == clubId)
                .ToListAsync();

            return Ok(polygons);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePolygon(int id, [FromQuery] int clubId)
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
                return Forbid("You don't have permission to delete polygons");

            var polygon = await _context.Polygons
                .FirstOrDefaultAsync(p => p.Id == id && p.ClubId == clubId);

            if (polygon == null)
            {
                return NotFound(new { success = false, message = "Polygon not found" });
            }

            _context.Polygons.Remove(polygon);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Polygon deleted successfully" });
        }
    }
}