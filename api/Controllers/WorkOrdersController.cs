using System.Security.Claims;
using FieldPin.Api.Contracts.Common;
using FieldPin.Api.Contracts.WorkOrders;
using FieldPin.Api.Infrastructure.Services.WorkOrders;
using FieldPin.Api.Mappers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FieldPin.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class WorkOrdersController : ControllerBase
{
    private readonly IWorkOrderService _svc;
    public WorkOrdersController(IWorkOrderService svc) => _svc = svc;

//İş emrinin kendisi oluşturulur. Burası İşin id'si döner.
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateWorkOrderRequest req)
    {
        var (userId, isAdmin) = GetIdentity();
        if (userId is null) return Unauthorized();

        try
        {
            var id = await _svc.CreateAsync(req, userId, isAdmin);
            return CreatedAtAction(nameof(GetById), new { id }, new CreateWorkOrderResponse(id));
        }
        catch (ArgumentException ex) { return BadRequest(ex.Message); }
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var (userId, isAdmin) = GetIdentity();
        if (userId is null) return Unauthorized();

        var wo = await _svc.GetByIdAsync(id);
        if (wo is null) return NotFound();
        if (!isAdmin && wo.TechnicianId != userId) return Forbid();

        return Ok(wo.ToDetailDto(ToAbsoluteUrl));
    }

    [HttpGet("my")]
    public async Task<IActionResult> GetMyWorkOrders(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 15)
    {
        var (userId, _) = GetIdentity();
        if (userId is null) return Unauthorized();

        var (items, totalCount, totalPages) = await _svc.GetMyPagedAsync(userId, page, pageSize);

        return Ok(new PagedResponse<WorkOrderDetailResponse>(
            Items: items.Select(x => x.ToDetailDto(ToAbsoluteUrl)).ToList(),
            Page: page,
            PageSize: pageSize,
            TotalCount: totalCount,
            TotalPages: totalPages
        ));
    }

    [HttpGet("by-tech/{technicianId}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetByTechnician(
        string technicianId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 15)
    {
        var (items, totalCount, totalPages) =
            await _svc.GetByTechnicianPagedAsync(technicianId, page, pageSize);

        return Ok(new PagedResponse<WorkOrderDetailResponse>(
            Items: items.Select(x => x.ToDetailDto(ToAbsoluteUrl)).ToList(),
            Page: page,
            PageSize: pageSize,
            TotalCount: totalCount,
            TotalPages: totalPages
        ));
    }

    [HttpPost("{id:guid}/objects/batch")]
    public async Task<IActionResult> CreateObjectsBatch(Guid id, [FromBody] List<BatchObjectDto> items)
    {
        var (userId, isAdmin) = GetIdentity();
        if (userId is null) return Unauthorized();

        // Ownership kontrolü: WO'yu hafif çek, yetkiyi doğrula
        var wo = await _svc.GetByIdAsync(id);
        if (wo is null) return NotFound("WorkOrder not found.");
        if (!isAdmin && wo.TechnicianId != userId) return Forbid();

        try
        {
            var results = await _svc.CreateObjectsBatchAsync(id, items);
            return Ok(results);
        }
        catch (KeyNotFoundException ex) { return NotFound(ex.Message); }
        catch (ArgumentException ex) { return BadRequest(ex.Message); }
    }

    [HttpPost("/api/workorder-objects/{objectId:guid}/media")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(50_000_000)]
    [RequestFormLimits(MultipartBodyLengthLimit = 50_000_000)]
    public async Task<IActionResult> UploadObjectMedia(Guid objectId, IFormFileCollection files)
    {
        var (userId, isAdmin) = GetIdentity();
        if (userId is null) return Unauthorized();

        var obj = await _svc.GetObjectWithWorkOrderAsync(objectId);
        if (obj is null) return NotFound("WorkOrderObject not found.");
        if (!isAdmin && obj.WorkOrder.TechnicianId != userId) return Forbid();

        try
        {
            var mediaList = await _svc.UploadMediaAsync(obj, files);

            var dtos = mediaList.Select(m => new WorkOrderObjectMediaDto(
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

    // ── KONUM: HARİTA ───────────────────────────────────────
    // Admin tüm kayıtları, teknisyen sadece kendisininkini görür.
    // Filtreler: from, to, technicianId (admin), customerId, systemType, jobType, bbox.
    // En fazla 2000 nokta döner; üstü için kullanıcıdan filtre daraltması beklenir.
    [HttpGet("map")]
    public async Task<IActionResult> GetMapPoints([FromQuery] MapQueryRequest q)
    {
        var (userId, isAdmin) = GetIdentity();
        if (userId is null) return Unauthorized();

        // Admin değilse her durumda kendi kayıtlarına kilitlenir
        var restrictTo = isAdmin ? null : userId;

        var points = await _svc.GetMapPointsAsync(q, restrictTo);
        return Ok(points);
    }

    // ── KONUM: GÜNCELLEME ───────────────────────────────────
    // Teknisyen kendi WO'sunun konumunu, admin her WO'nun konumunu güncelleyebilir.
    // Mobil tarafında "kayıt sırasında GPS yoktu, sonradan haritadan seçeceğim" akışı için.
    // BURASI DAHA EKLENMEDİ EKLENECEK!!!!!!!!!!!!!
    [HttpPatch("{id:guid}/location")]
    public async Task<IActionResult> UpdateLocation(Guid id, [FromBody] UpdateLocationRequest req)
    {
        var (userId, isAdmin) = GetIdentity();
        if (userId is null) return Unauthorized();

        var wo = await _svc.GetByIdAsync(id);
        if (wo is null) return NotFound();
        if (!isAdmin && wo.TechnicianId != userId) return Forbid();

        try
        {
            var ok = await _svc.UpdateLocationAsync(id, req);
            if (!ok) return NotFound();
            return NoContent();
        }
        catch (ArgumentException ex) { return BadRequest(ex.Message); }
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
