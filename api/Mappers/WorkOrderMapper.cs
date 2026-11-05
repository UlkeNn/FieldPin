using FieldPin.Api.Contracts.Customers;
using FieldPin.Api.Contracts.WorkOrders;
using FieldPin.Api.Models;

namespace FieldPin.Api.Mappers;

public static class WorkOrderMapper
{
    public static WorkOrderDetailResponse ToDetailDto(this WorkOrder wo, Func<string, string> toAbsoluteUrl)
    {
        return new WorkOrderDetailResponse(
            Id: wo.Id,
            SystemType: wo.SystemType,
            JobType: wo.JobType,
            TechnicianId: wo.TechnicianId,
            Customer: wo.Customer?.ToSummaryDto(),
            ServiceRequestId: wo.ServiceRequestId,
            Notes: wo.Notes,
            FaultCause: wo.FaultCause,
            FaultResolution: wo.FaultResolution,
            CreatedAt: wo.CreatedAt,
            Objects: wo.Objects
                .OrderByDescending(x => x.CreatedAt)
                .Select(o => o.ToDto(toAbsoluteUrl))
                .ToList(),
            Latitude: wo.Latitude,
            Longitude: wo.Longitude,
            LocationAccuracy: wo.LocationAccuracy,
            LocationCapturedAt: wo.LocationCapturedAt,
            LocationSource: wo.LocationSource
        );
    }

    private static WorkOrderObjectDto ToDto(this WorkOrderObject o, Func<string, string> toAbsoluteUrl)
    {
        var media = o.Media
            .OrderByDescending(x => x.CreatedAt)
            .Select(m =>
            {
                var url = toAbsoluteUrl($"/uploads/{m.RelativePath}");
                return new WorkOrderObjectMediaDto(
                    Id: m.Id,
                    Url: url,
                    FileName: m.FileName,
                    OriginalFileName: m.OriginalFileName,
                    ContentType: m.ContentType,
                    SizeBytes: m.SizeBytes,
                    CreatedAt: m.CreatedAt
                );
            })
            .ToList();

        return new WorkOrderObjectDto(
            Id: o.Id,
            ObjectType: o.ObjectType,
            Role: o.Role,
            ObjectIdentifier: o.ObjectIdentifier,
            Notes: o.Notes,
            CreatedAt: o.CreatedAt,
            Media: media
        );
    }
}
