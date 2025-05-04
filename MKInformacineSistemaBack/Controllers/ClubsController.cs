using Microsoft.AspNetCore.Mvc;
using MKInformacineSistemaBack.Data;
using Microsoft.EntityFrameworkCore;
using MKInformacineSistemaBack.Models;
using System;
using MKInformacineSistemaBack.Helpers.Dtos;
using NetTopologySuite.Geometries;
using NetTopologySuite;

[ApiController]
[Route("api/[controller]")]
public class ClubsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly GeometryFactory _geometryFactory;

    public ClubsController(ApplicationDbContext context)
    {
        _context = context;
        _geometryFactory = NtsGeometryServices.Instance.CreateGeometryFactory(srid: 4326);
    }

    [HttpPost]
    public async Task<IActionResult> CreateClub([FromBody] ClubDto dto)
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
            HuntingAreaLocation = point
        };

        _context.Clubs.Add(club);
        await _context.SaveChangesAsync();

        // Avoid returning the geometry in response if it's not needed
        return Ok(new { club.Id, club.Name, club.ResidenceAddress });
    }



    [HttpGet]
    public async Task<ActionResult<List<Club>>> GetClubs()
    {
        return await _context.Clubs.ToListAsync();
    }
}
