// MKInformacineSistemaBack/Controllers/MapObjectsController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MKInformacineSistemaBack.Data;
using MKInformacineSistemaBack.Helpers.Dtos;
using MKInformacineSistemaBack.Models;
using System.Security.Claims;
using System.Text.Json;

namespace MKInformacineSistemaBack.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class MapObjectsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public MapObjectsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<MapObjectDto>>> GetMapObjects([FromQuery] int clubId)
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

            var objects = await _context.MapObjects
                .Where(o => o.ClubId == clubId)
                .ToListAsync();

            var dtos = objects.Select(o =>
            {
                var coordinate = JsonSerializer.Deserialize<CoordinateDto>(o.CoordinatesJson);
                return new MapObjectDto
                {
                    Id = o.Id,
                    Name = o.Name,
                    Type = o.Type,
                    Coordinate = coordinate ?? new CoordinateDto()
                };
            }).ToList();

            return Ok(dtos);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<MapObjectDto>> GetMapObject(int id, [FromQuery] int clubId)
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

            var mapObject = await _context.MapObjects
                .FirstOrDefaultAsync(o => o.Id == id && o.ClubId == clubId);

            if (mapObject == null)
                return NotFound();

            var coordinate = JsonSerializer.Deserialize<CoordinateDto>(mapObject.CoordinatesJson);

            var dto = new MapObjectDto
            {
                Id = mapObject.Id,
                Name = mapObject.Name,
                Type = mapObject.Type,
                Coordinate = coordinate ?? new CoordinateDto()
            };

            return Ok(dto);
        }

        [HttpPost]
        public async Task<ActionResult<MapObjectDto>> CreateMapObject([FromBody] CreateMapObjectDto dto, [FromQuery] int clubId)
        {
            // Check if user is member of this club with appropriate permissions
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var membership = await _context.ClubMemberships
                .FirstOrDefaultAsync(cm =>
                    cm.ClubId == clubId &&
                    cm.UserId == userId &&
                    cm.IsActive &&
                    (cm.Role == "Admin" || cm.Role == "Owner"));

            if (membership == null)
                return Forbid("You don't have permission to create map objects");

            var coordinate = new CoordinateDto
            {
                Lat = dto.Lat,
                Lng = dto.Lng
            };

            var mapObject = new MapObject
            {
                Name = dto.Name,
                Type = dto.Type,
                CoordinatesJson = JsonSerializer.Serialize(coordinate),
                ClubId = clubId,
                CreatedAt = DateTime.UtcNow
            };

            _context.MapObjects.Add(mapObject);
            await _context.SaveChangesAsync();

            var createdDto = new MapObjectDto
            {
                Id = mapObject.Id,
                Name = mapObject.Name,
                Type = mapObject.Type,
                Coordinate = coordinate
            };

            return CreatedAtAction(nameof(GetMapObject), new { id = mapObject.Id, clubId }, createdDto);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateMapObject(int id, [FromBody] UpdateMapObjectDto dto, [FromQuery] int clubId)
        {
            if (id != dto.Id)
                return BadRequest("ID mismatch");

            // Check if user is member of this club with appropriate permissions
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var membership = await _context.ClubMemberships
                .FirstOrDefaultAsync(cm =>
                    cm.ClubId == clubId &&
                    cm.UserId == userId &&
                    cm.IsActive &&
                    (cm.Role == "Admin" || cm.Role == "Owner"));

            if (membership == null)
                return Forbid("You don't have permission to update map objects");

            var mapObject = await _context.MapObjects
                .FirstOrDefaultAsync(o => o.Id == id && o.ClubId == clubId);

            if (mapObject == null)
                return NotFound();

            var coordinate = new CoordinateDto
            {
                Lat = dto.Lat,
                Lng = dto.Lng
            };

            mapObject.Name = dto.Name;
            mapObject.CoordinatesJson = JsonSerializer.Serialize(coordinate);

            _context.MapObjects.Update(mapObject);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMapObject(int id, [FromQuery] int clubId)
        {
            // Check if user is member of this club with appropriate permissions
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var membership = await _context.ClubMemberships
                .FirstOrDefaultAsync(cm =>
                    cm.ClubId == clubId &&
                    cm.UserId == userId &&
                    cm.IsActive &&
                    (cm.Role == "Admin" || cm.Role == "Owner"));

            if (membership == null)
                return Forbid("You don't have permission to delete map objects");

            var mapObject = await _context.MapObjects
                .FirstOrDefaultAsync(o => o.Id == id && o.ClubId == clubId);

            if (mapObject == null)
                return NotFound();

            _context.MapObjects.Remove(mapObject);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}