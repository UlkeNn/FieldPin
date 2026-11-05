using FieldPin.Api.Contracts.Customers;
using FieldPin.Api.Contracts.ServiceRequests;
using FieldPin.Api.Models;

namespace FieldPin.Api.Mappers;

public static class ServiceRequestMapper
{
    // NOT: AssignedUserName burada doldurulamaz (AssignedUserId'nin FK'sı yok, AppUser ayrı sorgu ister).
    // Servis katmanı detay dönerken assignedUserName'i kendisi çözüp bu dto'yu elle kurar ya da
    // bu mapper'a parametre olarak geçer. Basitlik için parametre alan overload kullanılır.
    public static ServiceRequestDetailDto ToDetailDto(
        this ServiceRequest r,
        Func<string, string> toAbsoluteUrl,
        string? assignedUserName)
    {
        var now = DateTime.UtcNow;
        var isOverdue = r.SlaDueAtUtc is not null
            && r.SlaDueAtUtc < now
            && r.Status != RequestStatus.Completed
            && r.Status != RequestStatus.Cancelled;

        return new ServiceRequestDetailDto(
            Id: r.Id,
            RequestNo: r.RequestNo,
            Title: r.Title,
            Description: r.Description,
            SystemType: r.SystemType,
            JobType: r.JobType,
            Priority: r.Priority,
            Status: r.Status,
            Source: r.Source,
            Customer: r.Customer?.ToSummaryDto(),
            DeviceType: r.DeviceType,
            DeviceIdentifier: r.DeviceIdentifier,
            CreatedByUserId: r.CreatedByUserId,
            RequesterName: r.RequesterName,
            RequesterPhone: r.RequesterPhone,
            AssignedUserId: r.AssignedUserId,
            AssignedUserName: assignedUserName,
            AssignedAtUtc: r.AssignedAtUtc,
            AddressText: r.AddressText,
            Latitude: r.Latitude,
            Longitude: r.Longitude,
            LocationAccuracy: r.LocationAccuracy,
            LocationCapturedAt: r.LocationCapturedAt,
            LocationSource: r.LocationSource,
            CreatedAtUtc: r.CreatedAtUtc,
            UpdatedAtUtc: r.UpdatedAtUtc,
            SlaDueAtUtc: r.SlaDueAtUtc,
            CompletedAtUtc: r.CompletedAtUtc,
            ResolutionNote: r.ResolutionNote,
            IsOverdue: isOverdue,
            RawPayload: r.RawPayload,
            RowVersion: r.RowVersion,
            Media: r.Media
                .OrderByDescending(x => x.CreatedAt)
                .Select(m => new ServiceRequestMediaDto(
                    Id: m.Id,
                    Url: toAbsoluteUrl($"/uploads/{m.RelativePath}"),
                    FileName: m.FileName,
                    OriginalFileName: m.OriginalFileName,
                    ContentType: m.ContentType,
                    SizeBytes: m.SizeBytes,
                    CreatedAt: m.CreatedAt
                ))
                .ToList(),
            WorkOrders: r.WorkOrders
                .OrderByDescending(x => x.CreatedAt)
                .Select(w => new LinkedWorkOrderDto(
                    Id: w.Id,
                    SystemType: w.SystemType,
                    JobType: w.JobType,
                    TechnicianId: w.TechnicianId,
                    CreatedAt: w.CreatedAt
                ))
                .ToList()
        );
    }

    // Partial update: null = dokunma, ""/whitespace (string alanlarda) = null'a çek.
    public static void ApplyUpdate(this ServiceRequest r, UpdateServiceRequestRequest req)
    {
        if (req.Title is not null)
        {
            var v = req.Title.Trim();
            if (!string.IsNullOrWhiteSpace(v))
                r.Title = v;
        }

        if (req.Description is not null)
            r.Description = string.IsNullOrWhiteSpace(req.Description) ? null : req.Description.Trim();

        if (req.SystemType.HasValue) r.SystemType = req.SystemType.Value;
        if (req.JobType.HasValue) r.JobType = req.JobType.Value;
        if (req.Priority.HasValue) r.Priority = req.Priority.Value;

        if (req.CustomerId.HasValue) r.CustomerId = req.CustomerId.Value;

        if (req.DeviceType.HasValue) r.DeviceType = req.DeviceType.Value;
        if (req.DeviceIdentifier is not null)
            r.DeviceIdentifier = string.IsNullOrWhiteSpace(req.DeviceIdentifier) ? null : req.DeviceIdentifier.Trim();

        if (req.RequesterName is not null)
            r.RequesterName = string.IsNullOrWhiteSpace(req.RequesterName) ? null : req.RequesterName.Trim();

        if (req.RequesterPhone is not null)
            r.RequesterPhone = string.IsNullOrWhiteSpace(req.RequesterPhone) ? null : req.RequesterPhone.Trim();

        if (req.AddressText is not null)
            r.AddressText = string.IsNullOrWhiteSpace(req.AddressText) ? null : req.AddressText.Trim();

        if (req.Latitude.HasValue) r.Latitude = req.Latitude.Value;
        if (req.Longitude.HasValue) r.Longitude = req.Longitude.Value;
        if (req.LocationAccuracy.HasValue) r.LocationAccuracy = req.LocationAccuracy.Value;
        if (req.LocationCapturedAt.HasValue) r.LocationCapturedAt = req.LocationCapturedAt.Value;
        if (req.LocationSource.HasValue) r.LocationSource = req.LocationSource.Value;

        if (req.SlaDueAtUtc.HasValue) r.SlaDueAtUtc = req.SlaDueAtUtc.Value;

        if (req.RawPayload is not null)
            r.RawPayload = string.IsNullOrWhiteSpace(req.RawPayload) ? null : req.RawPayload;
    }
}
