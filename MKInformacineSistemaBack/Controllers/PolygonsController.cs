using Microsoft.AspNetCore.Mvc;
using MKInformacineSistemaBack.Models;
using System.Text.Json;
using MKInformacineSistemaBack.Data;
using MKInformacineSistemaBack.Helpers.Dtos;
using Microsoft.EntityFrameworkCore;

namespace YourNamespace.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PolygonsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public PolygonsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> CreatePolygon([FromBody] PolygonDto dto)
        {
            var polygon = new Polygon
            {
                Name = dto.Name,
                CoordinatesJson = JsonSerializer.Serialize(dto.Coordinates)
            };

            _context.Polygons.Add(polygon);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, polygon.Id });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePolygon(int id, [FromBody] PolygonDto dto)
        {
            var polygon = await _context.Polygons.FindAsync(id);
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
        public async Task<IActionResult> GetPolygonById(int id)
        {
            var polygon = await _context.Polygons.FindAsync(id);

            if (polygon == null)
            {
                return NotFound(new { success = false, message = "Polygon not found" });
            }

            return Ok(polygon);
        }

        [HttpGet]
        public async Task<IActionResult> GetPolygons()
        {
            var polygons = await _context.Polygons.ToListAsync();
            return Ok(polygons);
        }
    }
}
