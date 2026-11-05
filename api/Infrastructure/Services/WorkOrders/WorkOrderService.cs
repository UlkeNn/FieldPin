using FieldPin.Api.Contracts.WorkOrders;
using FieldPin.Api.Infrastructure.Persistence;
using FieldPin.Api.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace FieldPin.Api.Infrastructure.Services.WorkOrders;

public class WorkOrderService : IWorkOrderService
{
    private readonly AppDbContext _db;
    private readonly IWebHostEnvironment _env;

    private const int MapHardCap = 2000;

    public WorkOrderService(AppDbContext db, IWebHostEnvironment env)
    {
        _db = db;
        _env = env;
    }

    // ── CREATE ──────────────────────────────────────────────

    public async Task<Guid> CreateAsync(CreateWorkOrderRequest req, string userId, bool isAdmin)
    {
        string technicianId;

        if (isAdmin)
        {
            if (string.IsNullOrWhiteSpace(req.TechnicianId))
                throw new ArgumentException("Admin must provide TechnicianId.");

            technicianId = req.TechnicianId.Trim();
        }
        else
        {
            technicianId = userId;
        }

        // Customer kontrolü
        if (req.CustomerId is not null)
        {
            var customer = await _db.Customers
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == req.CustomerId.Value);

            if (customer is null)
                throw new ArgumentException("CustomerId not found.");

            if (!customer.IsActive)
                throw new ArgumentException("Customer is passive. WorkOrder cannot be created.");
        }

        // ServiceRequest kontrolü (talepten iş emri üretimi)
        if (req.ServiceRequestId is not null)
        {
            var requestExists = await _db.ServiceRequests
                .AsNoTracking()
                .AnyAsync(r => r.Id == req.ServiceRequestId.Value && !r.IsDeleted);

            if (!requestExists)
                throw new ArgumentException("ServiceRequestId not found.");
        }

        // ── Konum doğrulaması ────────────────────────────
        // Lat/Lng birlikte ya da hiç. Tek başına kabul etmiyoruz.
        if ((req.Latitude is null) != (req.Longitude is null))
            throw new ArgumentException("Latitude and Longitude must be provided together.");

        if (req.Latitude is not null && (req.Latitude < -90 || req.Latitude > 90))
            throw new ArgumentException("Latitude must be between -90 and 90.");

        if (req.Longitude is not null && (req.Longitude < -180 || req.Longitude > 180))
            throw new ArgumentException("Longitude must be between -180 and 180.");

        var wo = new WorkOrder
        {
            SystemType = req.SystemType,
            JobType = req.JobType,
            TechnicianId = technicianId,
            CustomerId = req.CustomerId,
            ServiceRequestId = req.ServiceRequestId,
            Notes = req.Notes,
            FaultCause = req.FaultCause,
            FaultResolution = req.FaultResolution,

            // Konum
            Latitude = req.Latitude,
            Longitude = req.Longitude,
            LocationAccuracy = req.LocationAccuracy,
            LocationCapturedAt = req.LocationCapturedAt,
            LocationSource = req.LocationSource
        };

        _db.WorkOrders.Add(wo);
        await _db.SaveChangesAsync();

        return wo.Id;
    }

    // ── GET BY ID ───────────────────────────────────────────

    public async Task<WorkOrder?> GetByIdAsync(Guid id)
    {
        return await _db.WorkOrders
            .AsNoTracking()
            .Include(x => x.Customer)
            .Include(x => x.Objects)
                .ThenInclude(o => o.Media)
            .FirstOrDefaultAsync(x => x.Id == id);
    }

    // ── PAGED LISTS ─────────────────────────────────────────

    public Task<(List<WorkOrder> Items, int TotalCount, int TotalPages)> GetMyPagedAsync(
        string userId, int page, int pageSize)
    {
        var query = _db.WorkOrders
            .AsNoTracking()
            .Include(x => x.Customer)
            .Include(x => x.Objects)
                .ThenInclude(o => o.Media)
            .Where(x => x.TechnicianId == userId)
            .OrderByDescending(x => x.CreatedAt);

        return PaginateAsync(query, page, pageSize);
    }

    public Task<(List<WorkOrder> Items, int TotalCount, int TotalPages)> GetByTechnicianPagedAsync(
        string technicianId, int page, int pageSize)
    {
        var query = _db.WorkOrders
            .AsNoTracking()
            .Include(x => x.Customer)
            .Include(x => x.Objects)
                .ThenInclude(o => o.Media)
            .Where(x => x.TechnicianId == technicianId)
            .OrderByDescending(x => x.CreatedAt);

        return PaginateAsync(query, page, pageSize);
    }

    // ── OBJECTS BATCH ───────────────────────────────────────

    public async Task<List<BatchObjectResult>> CreateObjectsBatchAsync(
        Guid workOrderId, List<BatchObjectDto> items)
    {
        if (items is null || items.Count == 0)
            throw new ArgumentException("Must contain at least 1 item.");

        var wo = await _db.WorkOrders.FindAsync(workOrderId);
        if (wo is null)
            throw new KeyNotFoundException("WorkOrder not found.");

        if (wo.JobType == JobType.Replacement)
        {
            var hasOld = items.Any(x => x.Role == WorkOrderObjectRole.Old);
            var hasNew = items.Any(x => x.Role == WorkOrderObjectRole.New);
            if (!hasOld || !hasNew)
                throw new ArgumentException("Replacement job requires at least one Old and one New object.");
        }
        else
        {
            items = items.Select(x => x with { Role = WorkOrderObjectRole.Single }).ToList();
        }

        var results = new List<BatchObjectResult>();

        foreach (var it in items)
        {
            var obj = new WorkOrderObject
            {
                WorkOrderId = workOrderId,
                ObjectType = it.ObjectType,
                ObjectIdentifier = it.ObjectIdentifier,
                Notes = it.Notes,
                Role = it.Role
            };

            _db.WorkOrderObjects.Add(obj);

            results.Add(new BatchObjectResult(
                Id: obj.Id,
                ObjectType: obj.ObjectType,
                Role: obj.Role,
                ObjectIdentifier: obj.ObjectIdentifier
            ));
        }

        await _db.SaveChangesAsync();
        return results;
    }

    // ── MEDIA UPLOAD ────────────────────────────────────────

    public async Task<WorkOrderObject?> GetObjectWithWorkOrderAsync(Guid objectId)
    {
        return await _db.WorkOrderObjects
            .Include(x => x.WorkOrder)
            .FirstOrDefaultAsync(x => x.Id == objectId);
    }

    public async Task<List<WorkOrderObjectMedia>> UploadMediaAsync(
        WorkOrderObject obj, IFormFileCollection files)
    {
        if (files is null || files.Count == 0)
            throw new ArgumentException("No files provided.");

        var uploadsRoot = Path.Combine(_env.ContentRootPath, "storage", "uploads");
        var objectDir = Path.Combine(
            uploadsRoot, "workorders",
            obj.WorkOrderId.ToString(), "objects", obj.Id.ToString()
        );
        Directory.CreateDirectory(objectDir);

        var created = new List<WorkOrderObjectMedia>();

        foreach (var file in files)
        {
            if (file.Length <= 0) continue;

            if (!ImageProcessing.IsAllowedImage(file))
                throw new ArgumentException("Only jpg, jpeg, png, webp, heic, heif image files are allowed.");

            var isHeic = ImageProcessing.IsHeicLike(file);
            string storedName;
            string fullPath;
            string finalContentType;

            if (isHeic)
            {
                storedName = $"{Guid.NewGuid():N}.jpg";
                fullPath = Path.Combine(objectDir, storedName);
                await ImageProcessing.ConvertHeicToJpegAsync(file, fullPath);
                finalContentType = "image/jpeg";
            }
            else
            {
                var originalExt = Path.GetExtension(file.FileName);
                var ext = string.IsNullOrWhiteSpace(originalExt)
                    ? ".jpg"
                    : originalExt.ToLowerInvariant();

                storedName = $"{Guid.NewGuid():N}{ext}";
                fullPath = Path.Combine(objectDir, storedName);

                await using var stream = File.Create(fullPath);
                await file.CopyToAsync(stream);

                finalContentType = ImageProcessing.NormalizeContentType(file.ContentType, ext);
            }

            var relativePath = Path.Combine(
                "workorders", obj.WorkOrderId.ToString(),
                "objects", obj.Id.ToString(), storedName
            ).Replace("\\", "/");

            var media = new WorkOrderObjectMedia
            {
                WorkOrderObjectId = obj.Id,
                FileName = storedName,
                OriginalFileName = file.FileName,
                RelativePath = relativePath,
                ContentType = finalContentType,
                SizeBytes = new FileInfo(fullPath).Length
            };

            _db.WorkOrderObjectMedia.Add(media);
            created.Add(media);
        }

        await _db.SaveChangesAsync();
        return created;
    }

    // ── KONUM::: MAP POINTS ───────────────────────────────────

    public async Task<List<WorkOrderMapPointDto>> GetMapPointsAsync(
        MapQueryRequest q, string? restrictTechnicianId)
    {
        var query = _db.WorkOrders
            .AsNoTracking()
            .Include(x => x.Customer)
            .Where(x => x.Latitude != null && x.Longitude != null);

        // Yetki: admin değilse her zaman kendi kayıtlarına kilitlenir
        if (restrictTechnicianId is not null)
        {
            query = query.Where(x => x.TechnicianId == restrictTechnicianId);
        }
        else if (!string.IsNullOrWhiteSpace(q.TechnicianId))
        {
            query = query.Where(x => x.TechnicianId == q.TechnicianId);
        }

        if (q.From is not null)
        {
            var fromInclusive = q.From.Value.Date;
            query = query.Where(x => x.CreatedAt >= fromInclusive);
        }

        if (q.To is not null)
        {
            // Gün sonuna kadar dahil et 00.00 dan diğer 00.00a kadarkileri almamız lazım
            var toExclusive = q.To.Value.Date.AddDays(1);
            query = query.Where(x => x.CreatedAt < toExclusive);
        }
        if (q.CustomerId is not null)
            query = query.Where(x => x.CustomerId == q.CustomerId);

        if (q.SystemType is not null)
            query = query.Where(x => x.SystemType == q.SystemType);

        if (q.JobType is not null)
            query = query.Where(x => x.JobType == q.JobType);

        // Bbox: tümü birlikte verildiyse uygula. Eksik gelirse görmezden gel.
        if (q.MinLat is not null && q.MaxLat is not null
            && q.MinLng is not null && q.MaxLng is not null)
        {
            var minLat = q.MinLat.Value;
            var maxLat = q.MaxLat.Value;
            var minLng = q.MinLng.Value;
            var maxLng = q.MaxLng.Value;

            query = query.Where(x =>
                x.Latitude >= minLat && x.Latitude <= maxLat &&
                x.Longitude >= minLng && x.Longitude <= maxLng);
        }

        var items = await query
            .OrderByDescending(x => x.CreatedAt)
            .Take(MapHardCap)
            .Select(x => new WorkOrderMapPointDto(
                x.Id,
                x.Latitude!.Value,
                x.Longitude!.Value,
                x.LocationAccuracy,
                x.LocationSource,
                x.SystemType,
                x.JobType,
                x.TechnicianId,
                x.Customer != null ? x.Customer.Name : null,
                x.CreatedAt
            ))
            .ToListAsync();

        return items;
    }

    // ── KONUM: UPDATE ───────────────────────────────────────

    public async Task<bool> UpdateLocationAsync(Guid id, UpdateLocationRequest req)
    {
        if (req.Latitude < -90 || req.Latitude > 90)
            throw new ArgumentException("Latitude must be between -90 and 90.");
        if (req.Longitude < -180 || req.Longitude > 180)
            throw new ArgumentException("Longitude must be between -180 and 180.");

        var wo = await _db.WorkOrders.FirstOrDefaultAsync(x => x.Id == id);
        if (wo is null) return false;

        wo.Latitude = req.Latitude;
        wo.Longitude = req.Longitude;
        wo.LocationAccuracy = req.LocationAccuracy;
        wo.LocationCapturedAt = req.LocationCapturedAt ?? DateTime.UtcNow;
        wo.LocationSource = req.LocationSource ?? Models.LocationSource.Manual;

        await _db.SaveChangesAsync();
        return true;
    }

    // ── PRIVATE HELPERS ─────────────────────────────────────

    private static async Task<(List<WorkOrder>, int, int)> PaginateAsync(
        IOrderedQueryable<WorkOrder> query, int page, int pageSize)
    {
        var (items, _, _, totalCount, totalPages) = await query.ToPagedAsync(page, pageSize);
        return (items, totalCount, totalPages);
    }
}
