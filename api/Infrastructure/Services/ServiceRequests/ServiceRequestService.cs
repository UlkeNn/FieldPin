using FieldPin.Api.Contracts.Customers;
using FieldPin.Api.Contracts.ServiceRequests;
using FieldPin.Api.Contracts.WorkOrders;
using FieldPin.Api.Infrastructure.Persistence;
using FieldPin.Api.Infrastructure.Services.WorkOrders;
using FieldPin.Api.Mappers;
using FieldPin.Api.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace FieldPin.Api.Infrastructure.Services.ServiceRequests;

public class ServiceRequestService : IServiceRequestService
{
    private readonly AppDbContext _db;
    private readonly IWebHostEnvironment _env;
    private readonly IWorkOrderService _workOrderService;

    // Admin için izin verilen durum geçişleri (serbeste yakın; kapanmış durumlardan çıkış zaten ayrıca engellenir).
    private static readonly Dictionary<RequestStatus, RequestStatus[]> AdminTransitions = new()
    {
        [RequestStatus.New] = new[] { RequestStatus.Assigned, RequestStatus.InProgress, RequestStatus.OnHold, RequestStatus.Cancelled },
        [RequestStatus.Assigned] = new[] { RequestStatus.New, RequestStatus.InProgress, RequestStatus.OnHold, RequestStatus.Cancelled },
        [RequestStatus.InProgress] = new[] { RequestStatus.Assigned, RequestStatus.OnHold, RequestStatus.Completed, RequestStatus.Cancelled },
        [RequestStatus.OnHold] = new[] { RequestStatus.InProgress, RequestStatus.Cancelled },
    };

    // Teknisyen için izin verilen durum geçişleri.
    private static readonly Dictionary<RequestStatus, RequestStatus[]> TechnicianTransitions = new()
    {
        [RequestStatus.Assigned] = new[] { RequestStatus.InProgress },
        [RequestStatus.InProgress] = new[] { RequestStatus.OnHold, RequestStatus.Completed },
        [RequestStatus.OnHold] = new[] { RequestStatus.InProgress },
    };

    public ServiceRequestService(AppDbContext db, IWebHostEnvironment env, IWorkOrderService workOrderService)
    {
        _db = db;
        _env = env;
        _workOrderService = workOrderService;
    }

    // ── LIST ─────────────────────────────────────────────────

    public async Task<(List<ServiceRequestListItemDto> Items, int Page, int PageSize, int TotalCount, int TotalPages)>
        ListPagedAsync(ServiceRequestListQuery q, string? restrictAssignedUserId)
    {
        var query = BuildFilteredQuery(q, restrictAssignedUserId);

        var page = q.Page < 1 ? 1 : q.Page;
        var pageSize = q.PageSize < 1 ? QueryablePagingExtensions.DefaultPageSize : q.PageSize;
        if (pageSize > QueryablePagingExtensions.MaxPageSize) pageSize = QueryablePagingExtensions.MaxPageSize;

        var totalCount = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        var ordered = ApplySort(query, q.Sort);
        var now = DateTime.UtcNow;

        var items = await ordered
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new ServiceRequestListItemDto(
                x.Id,
                x.RequestNo,
                x.Title,
                x.Status,
                x.Priority,
                x.Source,
                x.SystemType,
                x.JobType,
                x.Customer != null ? new CustomerSummaryDto(x.Customer.Id, x.Customer.Name, x.Customer.Info, x.Customer.Phone) : null,
                x.AssignedUserId,
                x.AssignedUserId != null
                    ? _db.Users.Where(u => u.Id == x.AssignedUserId).Select(u => u.Username).FirstOrDefault()
                    : null,
                x.CreatedAtUtc,
                x.SlaDueAtUtc,
                x.SlaDueAtUtc != null && x.SlaDueAtUtc < now
                    && x.Status != RequestStatus.Completed && x.Status != RequestStatus.Cancelled,
                x.WorkOrders.Count,
                x.Media.Count
            ))
            .ToListAsync();

        return (items, page, pageSize, totalCount, totalPages);
    }

    private IQueryable<ServiceRequest> BuildFilteredQuery(ServiceRequestListQuery q, string? restrictAssignedUserId)
    {
        var query = _db.ServiceRequests.AsNoTracking().Where(x => !x.IsDeleted);

        // Yetki: teknisyen ise her zaman kendi atamalarına kilitlenir, query'deki
        // AssignedUserId/Unassigned filtreleri yok sayılır (map endpoint'indekiyle aynı desen).
        if (restrictAssignedUserId is not null)
        {
            query = query.Where(x => x.AssignedUserId == restrictAssignedUserId);
        }
        else
        {
            if (!string.IsNullOrWhiteSpace(q.AssignedUserId))
                query = query.Where(x => x.AssignedUserId == q.AssignedUserId);

            if (q.Unassigned == true)
                query = query.Where(x => x.AssignedUserId == null);
        }

        if (!string.IsNullOrWhiteSpace(q.Q))
        {
            var s = q.Q.Trim();
            query = query.Where(x =>
                x.RequestNo.Contains(s) ||
                x.Title.Contains(s) ||
                (x.Description != null && x.Description.Contains(s)) ||
                (x.RequesterName != null && x.RequesterName.Contains(s)) ||
                (x.RequesterPhone != null && x.RequesterPhone.Contains(s)));
        }

        if (q.Status is not null) query = query.Where(x => x.Status == q.Status);
        if (q.Priority is not null) query = query.Where(x => x.Priority == q.Priority);
        if (q.Source is not null) query = query.Where(x => x.Source == q.Source);
        if (q.SystemType is not null) query = query.Where(x => x.SystemType == q.SystemType);
        if (q.JobType is not null) query = query.Where(x => x.JobType == q.JobType);
        if (q.CustomerId is not null) query = query.Where(x => x.CustomerId == q.CustomerId);

        if (q.OverdueOnly == true)
        {
            var now = DateTime.UtcNow;
            query = query.Where(x =>
                x.SlaDueAtUtc != null && x.SlaDueAtUtc < now &&
                x.Status != RequestStatus.Completed && x.Status != RequestStatus.Cancelled);
        }

        if (q.From is not null)
        {
            var fromInclusive = q.From.Value.Date;
            query = query.Where(x => x.CreatedAtUtc >= fromInclusive);
        }

        if (q.To is not null)
        {
            // Gün sonuna kadar dahil et: 00:00'dan diğer 00:00'a kadarkileri almamız lazım.
            var toExclusive = q.To.Value.Date.AddDays(1);
            query = query.Where(x => x.CreatedAtUtc < toExclusive);
        }

        return query;
    }

    private static IOrderedQueryable<ServiceRequest> ApplySort(IQueryable<ServiceRequest> query, string? sort)
    {
        var desc = true;
        var field = "createdat";

        if (!string.IsNullOrWhiteSpace(sort))
        {
            var s = sort.Trim();
            desc = s.StartsWith("-");
            field = s.TrimStart('-', '+').ToLowerInvariant();
        }

        return field switch
        {
            "priority" => desc ? query.OrderByDescending(x => x.Priority) : query.OrderBy(x => x.Priority),
            "sladueat" => desc ? query.OrderByDescending(x => x.SlaDueAtUtc) : query.OrderBy(x => x.SlaDueAtUtc),
            _ => desc ? query.OrderByDescending(x => x.CreatedAtUtc) : query.OrderBy(x => x.CreatedAtUtc)
        };
    }

    // ── GET BY ID ────────────────────────────────────────────

    public async Task<ServiceRequest?> GetByIdAsync(Guid id)
    {
        return await _db.ServiceRequests
            .AsNoTracking()
            .Include(x => x.Customer)
            .Include(x => x.Media)
            .Include(x => x.WorkOrders)
            .FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted);
    }

    public async Task<string?> GetUserNameAsync(string? userId)
    {
        if (string.IsNullOrWhiteSpace(userId)) return null;
        return await _db.Users.AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(u => u.Username)
            .FirstOrDefaultAsync();
    }

    // ── CREATE ───────────────────────────────────────────────

    public async Task<ServiceRequest> CreateAsync(CreateServiceRequestRequest req, string? createdByUserId)
    {
        if (string.IsNullOrWhiteSpace(req.Title))
            throw new ArgumentException("Başlık zorunludur.");

        if (req.Source == RequestSource.WhatsAppAi && string.IsNullOrWhiteSpace(req.RawPayload))
            throw new ArgumentException("AI ile doldurulan talepte RawPayload zorunludur.");

        if (req.CustomerId is not null)
            await ValidateCustomerAsync(req.CustomerId.Value);

        if (req.AssignedUserId is not null)
            await ValidateAssigneeAsync(req.AssignedUserId);

        ValidateLocation(req.Latitude, req.Longitude);

        var entity = new ServiceRequest
        {
            Title = req.Title.Trim(),
            Description = string.IsNullOrWhiteSpace(req.Description) ? null : req.Description.Trim(),
            SystemType = req.SystemType,
            JobType = req.JobType,
            Priority = req.Priority,
            Source = req.Source,
            Status = RequestStatus.New,
            CustomerId = req.CustomerId,
            DeviceType = req.DeviceType,
            DeviceIdentifier = string.IsNullOrWhiteSpace(req.DeviceIdentifier) ? null : req.DeviceIdentifier.Trim(),
            CreatedByUserId = createdByUserId,
            RequesterName = string.IsNullOrWhiteSpace(req.RequesterName) ? null : req.RequesterName.Trim(),
            RequesterPhone = string.IsNullOrWhiteSpace(req.RequesterPhone) ? null : req.RequesterPhone.Trim(),
            AddressText = string.IsNullOrWhiteSpace(req.AddressText) ? null : req.AddressText.Trim(),
            Latitude = req.Latitude,
            Longitude = req.Longitude,
            LocationAccuracy = req.LocationAccuracy,
            LocationCapturedAt = req.LocationCapturedAt,
            LocationSource = req.LocationSource,
            SlaDueAtUtc = req.SlaDueAtUtc,
            RawPayload = req.RawPayload
        };

        if (req.AssignedUserId is not null)
        {
            entity.AssignedUserId = req.AssignedUserId;
            entity.AssignedAtUtc = DateTime.UtcNow;
            entity.Status = RequestStatus.Assigned;
        }

        // RequestNo global sıralı üretilir; unique index çakışırsa birkaç kez yeniden denenir.
        const int maxAttempts = 3;
        for (var attempt = 1; ; attempt++)
        {
            var last = await _db.ServiceRequests.MaxAsync(x => (int?)x.RequestSeq) ?? 1000;
            entity.RequestSeq = last + 1;
            entity.RequestNo = $"TLP-{entity.RequestSeq}";

            _db.ServiceRequests.Add(entity);
            try
            {
                await _db.SaveChangesAsync();
                break;
            }
            catch (DbUpdateException) when (attempt < maxAttempts)
            {
                _db.Entry(entity).State = EntityState.Detached;
            }
        }

        return entity;
    }

    // ── UPDATE ───────────────────────────────────────────────

    public async Task<bool> UpdateAsync(Guid id, UpdateServiceRequestRequest req)
    {
        var r = await _db.ServiceRequests.FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted);
        if (r is null) return false;

        if (req.Title is not null && string.IsNullOrWhiteSpace(req.Title))
            throw new ArgumentException("Başlık boş olamaz.");

        if (req.CustomerId is not null)
            await ValidateCustomerAsync(req.CustomerId.Value);

        ValidateLocation(req.Latitude, req.Longitude);

        r.ApplyUpdate(req);
        r.UpdatedAtUtc = DateTime.UtcNow;

        // İstemci eski bir RowVersion gönderdiyse ve DB'deki güncelse SaveChanges 409'a denk gelen
        // DbUpdateConcurrencyException fırlatır (controller yakalar).
        if (req.RowVersion.HasValue)
            _db.Entry(r).Property(x => x.RowVersion).OriginalValue = req.RowVersion.Value;

        r.RowVersion = Guid.NewGuid();

        await _db.SaveChangesAsync();
        return true;
    }

    // ── ASSIGN ───────────────────────────────────────────────

    public async Task<bool> AssignAsync(Guid id, AssignServiceRequestRequest req)
    {
        var r = await _db.ServiceRequests.FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted);
        if (r is null) return false;

        if (r.Status is RequestStatus.Completed or RequestStatus.Cancelled)
            throw new ArgumentException("Kapanmış talep yeniden atanamaz.");

        await ValidateAssigneeAsync(req.AssignedUserId);

        r.AssignedUserId = req.AssignedUserId;
        r.AssignedAtUtc = DateTime.UtcNow;

        if (req.SlaDueAtUtc.HasValue)
            r.SlaDueAtUtc = req.SlaDueAtUtc;

        if (r.Status == RequestStatus.New)
            r.Status = RequestStatus.Assigned;

        r.UpdatedAtUtc = DateTime.UtcNow;
        r.RowVersion = Guid.NewGuid();

        await _db.SaveChangesAsync();
        return true;
    }

    // ── DURUM DEĞİŞİKLİĞİ ────────────────────────────────────

    public async Task<bool> ChangeStatusAsync(Guid id, ChangeStatusRequest req, string userId, bool isAdmin)
    {
        var r = await _db.ServiceRequests.FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted);
        if (r is null) return false;

        if (r.Status is RequestStatus.Completed or RequestStatus.Cancelled)
            throw new ArgumentException("Kapanmış talebin durumu değiştirilemez.");

        var allowed = isAdmin ? AdminTransitions : TechnicianTransitions;
        if (!allowed.TryGetValue(r.Status, out var targets) || !targets.Contains(req.Status))
            throw new ArgumentException($"{r.Status} durumundan {req.Status} durumuna geçilemez.");

        if (req.Status == RequestStatus.Completed && string.IsNullOrWhiteSpace(req.ResolutionNote))
            throw new ArgumentException("Talebi tamamlarken ResolutionNote zorunludur.");

        if (req.Status == RequestStatus.Cancelled && string.IsNullOrWhiteSpace(req.ResolutionNote))
            throw new ArgumentException("Talebi iptal ederken ResolutionNote (iptal sebebi) zorunludur.");

        r.Status = req.Status;

        if (req.ResolutionNote is not null)
            r.ResolutionNote = req.ResolutionNote.Trim();

        if (req.Status == RequestStatus.Completed)
            r.CompletedAtUtc = DateTime.UtcNow;

        r.UpdatedAtUtc = DateTime.UtcNow;
        r.RowVersion = Guid.NewGuid();

        await _db.SaveChangesAsync();
        return true;
    }

    // ── TALEPTEN İŞ EMRİ ─────────────────────────────────────

    public async Task<Guid> CreateWorkOrderFromRequestAsync(
        Guid id, CreateWorkOrderFromRequestRequest req, string userId, bool isAdmin)
    {
        var r = await _db.ServiceRequests.FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted);
        if (r is null) throw new KeyNotFoundException("ServiceRequest not found.");

        if (r.Status is RequestStatus.Completed or RequestStatus.Cancelled)
            throw new ArgumentException("Kapanmış bir talepten iş emri açılamaz.");

        string technicianId;
        string? technicianIdForRequest;

        if (isAdmin)
        {
            technicianId = req.TechnicianId ?? r.AssignedUserId
                ?? throw new ArgumentException("Teknisyen belirtilmedi ve talebe atanmış kimse yok.");
            technicianIdForRequest = technicianId;
        }
        else
        {
            technicianId = userId;
            technicianIdForRequest = null; // admin değilse WorkOrderService zaten userId'yi kullanır
        }

        var notes = string.IsNullOrWhiteSpace(req.Notes) ? $"[{r.RequestNo}] {r.Title}" : req.Notes;

        var createReq = new CreateWorkOrderRequest(
            SystemType: r.SystemType,
            JobType: r.JobType,
            CustomerId: r.CustomerId,
            Notes: notes,
            TechnicianId: technicianIdForRequest,
            ServiceRequestId: r.Id,
            FaultCause: null,
            FaultResolution: null,
            Latitude: r.Latitude,
            Longitude: r.Longitude,
            LocationAccuracy: r.LocationAccuracy,
            LocationCapturedAt: r.LocationCapturedAt,
            LocationSource: r.LocationSource
        );

        var workOrderId = await _workOrderService.CreateAsync(createReq, technicianId, isAdmin);

        if (r.Status is RequestStatus.New or RequestStatus.Assigned)
            r.Status = RequestStatus.InProgress;

        r.UpdatedAtUtc = DateTime.UtcNow;
        r.RowVersion = Guid.NewGuid();

        await _db.SaveChangesAsync();
        return workOrderId;
    }

    public async Task<bool> LinkWorkOrderAsync(Guid id, Guid workOrderId)
    {
        var exists = await _db.ServiceRequests.AnyAsync(x => x.Id == id && !x.IsDeleted);
        if (!exists) return false;

        var wo = await _db.WorkOrders.FirstOrDefaultAsync(x => x.Id == workOrderId);
        if (wo is null)
            throw new ArgumentException("WorkOrder not found.");

        wo.ServiceRequestId = id;
        await _db.SaveChangesAsync();
        return true;
    }

    // ── MEDYA ────────────────────────────────────────────────

    public async Task<List<ServiceRequestMedia>> UploadMediaAsync(ServiceRequest r, IFormFileCollection files)
    {
        if (files is null || files.Count == 0)
            throw new ArgumentException("No files provided.");

        var uploadsRoot = Path.Combine(_env.ContentRootPath, "storage", "uploads");
        var requestDir = Path.Combine(uploadsRoot, "servicerequests", r.Id.ToString());
        Directory.CreateDirectory(requestDir);

        var created = new List<ServiceRequestMedia>();

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
                fullPath = Path.Combine(requestDir, storedName);
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
                fullPath = Path.Combine(requestDir, storedName);

                await using var stream = File.Create(fullPath);
                await file.CopyToAsync(stream);

                finalContentType = ImageProcessing.NormalizeContentType(file.ContentType, ext);
            }

            var relativePath = Path.Combine("servicerequests", r.Id.ToString(), storedName)
                .Replace("\\", "/");

            var media = new ServiceRequestMedia
            {
                ServiceRequestId = r.Id,
                FileName = storedName,
                OriginalFileName = file.FileName,
                RelativePath = relativePath,
                ContentType = finalContentType,
                SizeBytes = new FileInfo(fullPath).Length
            };

            _db.ServiceRequestMedia.Add(media);
            created.Add(media);
        }

        await _db.SaveChangesAsync();
        return created;
    }

    public async Task<bool> DeleteMediaAsync(Guid requestId, Guid mediaId)
    {
        var media = await _db.ServiceRequestMedia
            .FirstOrDefaultAsync(x => x.Id == mediaId && x.ServiceRequestId == requestId);
        if (media is null) return false;

        var fullPath = Path.Combine(_env.ContentRootPath, "storage", "uploads", media.RelativePath);
        if (File.Exists(fullPath))
        {
            try { File.Delete(fullPath); }
            catch { /* dosya silinemezse DB kaydı yine de kaldırılır */ }
        }

        _db.ServiceRequestMedia.Remove(media);
        await _db.SaveChangesAsync();
        return true;
    }

    // ── SİLME ────────────────────────────────────────────────

    public async Task<bool> SoftDeleteAsync(Guid id)
    {
        var r = await _db.ServiceRequests.FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted);
        if (r is null) return false;

        r.IsDeleted = true;
        r.UpdatedAtUtc = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return true;
    }

    // ── PRIVATE HELPERS ──────────────────────────────────────

    private async Task ValidateCustomerAsync(Guid customerId)
    {
        var customer = await _db.Customers.AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == customerId);

        if (customer is null || customer.IsDeleted)
            throw new ArgumentException("CustomerId not found.");

        if (!customer.IsActive)
            throw new ArgumentException("Customer is passive.");
    }

    private async Task ValidateAssigneeAsync(string userId)
    {
        var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);

        if (user is null || user.IsDeleted)
            throw new ArgumentException("AssignedUserId not found.");

        if (!user.IsActive)
            throw new ArgumentException("Atanan kullanıcı pasif.");

        if (!string.Equals(user.Role, "Technician", StringComparison.OrdinalIgnoreCase))
            throw new ArgumentException("Sadece teknisyene atama yapılabilir.");
    }

    private static void ValidateLocation(double? lat, double? lng)
    {
        if ((lat is null) != (lng is null))
            throw new ArgumentException("Latitude and Longitude must be provided together.");

        if (lat is not null && (lat < -90 || lat > 90))
            throw new ArgumentException("Latitude must be between -90 and 90.");

        if (lng is not null && (lng < -180 || lng > 180))
            throw new ArgumentException("Longitude must be between -180 and 180.");
    }
}
