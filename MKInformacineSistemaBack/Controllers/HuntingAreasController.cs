using Microsoft.AspNetCore.Mvc;
using MKInformacineSistemaBack.Data;
using Microsoft.EntityFrameworkCore;
using MKInformacineSistemaBack.Models;
using MKInformacineSistemaBack.Helpers.Dtos;
using System.Text.Json;

[ApiController]
[Route("api/[controller]")]
public class HuntingAreasController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public HuntingAreasController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<List<HuntingAreaDto>>> Get()
    {
        var areas = await _context.HuntingAreas.ToListAsync();

        return areas.Select(area => new HuntingAreaDto
        {
            Id = area.Id,
            Name = area.Name,
            Coordinates = JsonSerializer.Deserialize<List<CoordinateDto>>(area.CoordinatesJson) ?? new()
        }).ToList();
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] HuntingAreaDto dto)
    {
        var area = new HuntingArea
        {
            Name = dto.Name,
            CoordinatesJson = JsonSerializer.Serialize(dto.Coordinates)
        };

        _context.HuntingAreas.Add(area);
        await _context.SaveChangesAsync();

        return Ok(new { area.Id });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] HuntingAreaDto dto)
    {
        var area = await _context.HuntingAreas.FindAsync(id);
        if (area == null) return NotFound();

        area.Name = dto.Name;
        area.CoordinatesJson = JsonSerializer.Serialize(dto.Coordinates);

        await _context.SaveChangesAsync();
        return Ok(area.Id);
    }
}
