using Microsoft.AspNetCore.Mvc;
using MKInformacineSistemaBack.Data;
using MKInformacineSistemaBack.Models;
using MKInformacineSistemaBack.Helpers.Dtos;

namespace MKInformacineSistemaBack.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MemberController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public MemberController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public ActionResult<IEnumerable<MemberDto>> GetAll()
        {
            var members = _context.Members
                .Select(m => new MemberDto
                {
                    Id = m.Id,
                    Name = m.Name,
                    BirthDate = m.BirthDate,
                    Photo = m.Photo,
                    Activity = m.Activity,
                    HuntingSince = m.HuntingSince,
                    Status = m.Status
                }).ToList();

            return Ok(members);
        }

        [HttpPost]
        public ActionResult<MemberDto> Create(MemberDto dto)
        {
            var member = new Member
            {
                Id = Guid.NewGuid(),
                Name = dto.Name,
                BirthDate = dto.BirthDate,
                Photo = dto.Photo,
                Activity = dto.Activity,
                HuntingSince = dto.HuntingSince,
                Status = dto.Status
            };

            _context.Members.Add(member);
            _context.SaveChanges();

            dto.Id = member.Id;
            return CreatedAtAction(nameof(GetAll), new { id = dto.Id }, dto);
        }

        [HttpDelete("{id}")]
        public IActionResult Delete(Guid id)
        {
            var member = _context.Members.Find(id);
            if (member == null)
            {
                return NotFound();
            }

            _context.Members.Remove(member);
            _context.SaveChanges();

            return NoContent();
        }
    }
}