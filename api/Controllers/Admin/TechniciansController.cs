using FieldPin.Api.Contracts.Admin.Technicians;
using FieldPin.Api.Infrastructure.Services.Technicians;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FieldPin.Api.Controllers.Admin;

[ApiController]
[Route("api/admin/technicians")]
[Authorize(Roles = "Admin")]
public class TechniciansController : ControllerBase
{
    private readonly ITechnicianService _svc;
    public TechniciansController(ITechnicianService svc) => _svc = svc;

    [HttpGet]
    public async Task<ActionResult<List<TechnicianDto>>> GetAll(
        [FromQuery] string? search,
        [FromQuery] bool? isActive)
    {
        var dtos = await _svc.GetAllAsync(search, isActive);
        foreach (var d in dtos) EnrichAvatarUrl(d);
        return Ok(dtos);
    }

    [HttpPost]
    public async Task<ActionResult<TechnicianDto>> Create([FromBody] CreateTechnicianRequest req)
    {
        try
        {
            var dto = await _svc.CreateAsync(req);
            EnrichAvatarUrl(dto);
            return CreatedAtAction(nameof(GetById), new { id = dto.Id }, dto);
        }
        catch (ArgumentException ex) { return BadRequest(ex.Message); }
        catch (InvalidOperationException ex) { return Conflict(ex.Message); }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<TechnicianDto>> GetById([FromRoute] string id)
    {
        var dto = await _svc.GetByIdAsync(id);
        if (dto is null) return NotFound();
        EnrichAvatarUrl(dto);
        return Ok(dto);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update([FromRoute] string id, [FromBody] UpdateTechnicianRequest req)
    {
        try
        {
            var found = await _svc.UpdateAsync(id, req);
            return found ? NoContent() : NotFound();
        }
        catch (ArgumentException ex) { return BadRequest(ex.Message); }
        catch (InvalidOperationException ex) { return Conflict(ex.Message); }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete([FromRoute] string id)
    {
        var ok = await _svc.SoftDeleteAsync(id);
        return ok ? NoContent() : NotFound();
    }

    // ── HELPERS ─────────────────────────────────────────────

    /// <summary>
    /// Service relative avatar path döndürür ("avatars/{userId}/{guid}.jpg").
    /// İstemciye dönerken absolute URL'e çevrilir (Request.Scheme/Host'a bağlı).
    /// </summary>
    private void EnrichAvatarUrl(TechnicianDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.AvatarUrl)) return;
        dto.AvatarUrl = $"{Request.Scheme}://{Request.Host}/uploads/{dto.AvatarUrl}";
    }
}
