using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MKInformacineSistemaBack.Services;
using System.Security.Claims;

namespace MKInformacineSistemaBack.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class StatisticsRecalculationController : ControllerBase
    {
        private readonly StatisticsRecalculationService _recalculationService;

        public StatisticsRecalculationController(StatisticsRecalculationService recalculationService)
        {
            _recalculationService = recalculationService;
        }

        [HttpPost("club/{clubId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> RecalculateClubStatistics(int clubId)
        {
            // Verify user access to this club
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            try
            {
                await _recalculationService.RecalculateClubStatisticsAsync(clubId);
                return Ok(new { success = true, message = "Club statistics recalculated successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Error recalculating statistics: {ex.Message}" });
            }
        }

        [HttpPost("member")]
        [Authorize]
        public async Task<IActionResult> RecalculateUserStatistics([FromQuery] int clubId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            try
            {
                await _recalculationService.RecalculateUserStatisticsAsync(userId, clubId);
                return Ok(new { success = true, message = "User statistics recalculated successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Error recalculating statistics: {ex.Message}" });
            }
        }

        [HttpPost("all")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> RecalculateAllStatistics()
        {
            try
            {
                await _recalculationService.RecalculateAllStatisticsAsync();
                return Ok(new { success = true, message = "All statistics recalculated successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Error recalculating statistics: {ex.Message}" });
            }
        }
    }
}