using System.Security.Claims;
using FieldPin.Api.Contracts.Common;
using FieldPin.Api.Contracts.ServiceRequests;
using FieldPin.Api.Infrastructure.Services.ServiceRequests;
using FieldPin.Api.Mappers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FieldPin.Api.Controllers.Admin;

// Talep yönetimi — Admin'e özel. Müşteriden gelen montaj/değişim/arıza talepleri burada
// açılır, atanır, durumu değiştirilir ve gerekirse iş emrine çevrilir.
[ApiController]
[Route("api/admin/service-requests")]
[Authorize(Roles = "Admin")]
public class ServiceRequestsController : ControllerBase
{
    private readonly IServiceRequestService _svc;
    public ServiceRequestsController(IServiceRequestService svc) => _svc = svc;

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] ServiceRequestListQuery query)
    {
        var (items, page, pageSize, totalCount, totalPages) = await _svc.ListPagedAsync(query, restrictAssignedUserId: null);

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
        var r = await _svc.GetByIdAsync(id);
        if (r is null) return NotFound();

        var userName = await _svc.GetUserNameAsync(r.AssignedUserId);
        return Ok(r.ToDetailDto(ToAbsoluteUrl, userName));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateServiceRequestRequest req)
    {
        var (userId, _) = GetIdentity();
        if (userId is null) return Unauthorized();

        try
        {
            var created = await _svc.CreateAsync(req, userId);

            // CreateAsync entity'yi Customer navigation'ı yüklemeden döner;
            // detay DTO'sunun bu alanı dolu dönmesi için tam yüklü kaydı tekrar çekiyoruz.
            var r = await _svc.GetByIdAsync(created.Id) ?? created;
            var userName = await _svc.GetUserNameAsync(r.AssignedUserId);
            return CreatedAtAction(nameof(GetById), new { id = r.Id }, r.ToDetailDto(ToAbsoluteUrl, userName));
        }
        catch (ArgumentException ex) { return BadRequest(ex.Message); }
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateServiceRequestRequest req)
    {
        try
        {
            var ok = await _svc.UpdateAsync(id, req);
            return ok ? NoContent() : NotFound();
        }
        catch (ArgumentException ex) { return BadRequest(ex.Message); }
        catch (DbUpdateConcurrencyException)
        {
            return Conflict("Talep başka bir işlem tarafından güncellendi. Güncel veriyi tekrar çekip yeniden deneyin.");
        }
    }

    [HttpPatch("{id:guid}/assign")]
    public async Task<IActionResult> Assign(Guid id, [FromBody] AssignServiceRequestRequest req)
    {
        try
        {
            var ok = await _svc.AssignAsync(id, req);
            return ok ? NoContent() : NotFound();
        }
        catch (ArgumentException ex) { return BadRequest(ex.Message); }
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> ChangeStatus(Guid id, [FromBody] ChangeStatusRequest req)
    {
        var (userId, isAdmin) = GetIdentity();
        if (userId is null) return Unauthorized();

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
        var r = await _svc.GetByIdAsync(id);
        if (r is null) return NotFound("ServiceRequest not found.");

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

    [HttpDelete("{id:guid}/media/{mediaId:guid}")]
    public async Task<IActionResult> DeleteMedia(Guid id, Guid mediaId)
    {
        var ok = await _svc.DeleteMediaAsync(id, mediaId);
        return ok ? NoContent() : NotFound();
    }

    [HttpPost("{id:guid}/work-orders")]
    public async Task<IActionResult> CreateWorkOrder(Guid id, [FromBody] CreateWorkOrderFromRequestRequest req)
    {
        var (userId, isAdmin) = GetIdentity();
        if (userId is null) return Unauthorized();

        try
        {
            var workOrderId = await _svc.CreateWorkOrderFromRequestAsync(id, req, userId, isAdmin);
            return CreatedAtAction(nameof(GetById), new { id }, new { workOrderId });
        }
        catch (KeyNotFoundException ex) { return NotFound(ex.Message); }
        catch (ArgumentException ex) { return BadRequest(ex.Message); }
    }

    [HttpPost("{id:guid}/work-orders/link")]
    public async Task<IActionResult> LinkWorkOrder(Guid id, [FromBody] LinkWorkOrderRequest req)
    {
        try
        {
            var ok = await _svc.LinkWorkOrderAsync(id, req.WorkOrderId);
            return ok ? NoContent() : NotFound();
        }
        catch (ArgumentException ex) { return BadRequest(ex.Message); }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var ok = await _svc.SoftDeleteAsync(id);
        return ok ? NoContent() : NotFound();
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
