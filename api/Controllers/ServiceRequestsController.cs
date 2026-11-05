using System.Security.Claims;
using FieldPin.Api.Contracts.Common;
using FieldPin.Api.Contracts.ServiceRequests;
using FieldPin.Api.Infrastructure.Services.ServiceRequests;
using FieldPin.Api.Mappers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FieldPin.Api.Controllers;

// Teknisyen tarafı — sadece kendisine atanan talepleri görür ve durumunu değiştirir.
// Talep açma/atama/silme yetkisi burada yok, bkz. Controllers/Admin/ServiceRequestsController.
[ApiController]
[Route("api/service-requests")]
[Authorize]
public class ServiceRequestsController : ControllerBase
{
    private readonly IServiceRequestService _svc;
    public ServiceRequestsController(IServiceRequestService svc) => _svc = svc;

    [HttpGet("my")]
    public async Task<IActionResult> GetMy([FromQuery] ServiceRequestListQuery query)
    {
        var (userId, _) = GetIdentity();
        if (userId is null) return Unauthorized();

        var (items, page, pageSize, totalCount, totalPages) = await _svc.ListPagedAsync(query, restrictAssignedUserId: userId);

        return Ok(new PagedResponse<ServiceRequestListItemDto>(
            Items: items,
            Page: page,
            PageSize: pageSize,
            TotalCount: totalCount,
            TotalPages: totalPages
        ));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var (userId, isAdmin) = GetIdentity();
        if (userId is null) return Unauthorized();

        var r = await _svc.GetByIdAsync(id);
        if (r is null) return NotFound();
        if (!isAdmin && r.AssignedUserId != userId) return Forbid();

        var userName = await _svc.GetUserNameAsync(r.AssignedUserId);
        return Ok(r.ToDetailDto(ToAbsoluteUrl, userName));
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> ChangeStatus(Guid id, [FromBody] ChangeStatusRequest req)
    {
        var (userId, isAdmin) = GetIdentity();
        if (userId is null) return Unauthorized();

        var r = await _svc.GetByIdAsync(id);
        if (r is null) return NotFound();
        if (!isAdmin && r.AssignedUserId != userId) return Forbid();

        try
        {
            var ok = await _svc.ChangeStatusAsync(id, req, userId, isAdmin);
            return ok ? NoContent() : NotFound();
        }
        catch (ArgumentException ex) { return BadRequest(ex.Message); }
    }

    [HttpPost("{id:guid}/media")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(50_000_000)]
    [RequestFormLimits(MultipartBodyLengthLimit = 50_000_000)]
    public async Task<IActionResult> UploadMedia(Guid id, IFormFileCollection files)
    {
        var (userId, isAdmin) = GetIdentity();
        if (userId is null) return Unauthorized();

        var r = await _svc.GetByIdAsync(id);
        if (r is null) return NotFound("ServiceRequest not found.");
        if (!isAdmin && r.AssignedUserId != userId) return Forbid();

        try
        {
            var mediaList = await _svc.UploadMediaAsync(r, files);

            var dtos = mediaList.Select(m => new ServiceRequestMediaDto(
                Id: m.Id,
                Url: ToAbsoluteUrl($"/uploads/{m.RelativePath}"),
                FileName: m.FileName,
                OriginalFileName: m.OriginalFileName,
                ContentType: m.ContentType,
                SizeBytes: m.SizeBytes,
                CreatedAt: m.CreatedAt
            )).ToList();

            return Ok(dtos);
        }
        catch (ArgumentException ex) { return BadRequest(ex.Message); }
        catch (ImageMagick.MagickException ex) { return BadRequest($"HEIC conversion failed: {ex.Message}"); }
    }

    // ── HELPERS ─────────────────────────────────────────────

    private (string? userId, bool isAdmin) GetIdentity()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId)) return (null, false);

        var role = User.FindFirstValue(ClaimTypes.Role);
        var isAdmin = string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase);
        return (userId, isAdmin);
    }

    private string ToAbsoluteUrl(string path)
        => $"{Request.Scheme}://{Request.Host}{path}";
}
