using FieldPin.Api.Contracts.Customers;
using FieldPin.Api.Models;

namespace FieldPin.Api.Contracts.WorkOrders;

public record WorkOrderDetailResponse(
    Guid Id,
    SystemType SystemType,
    JobType JobType,
    string TechnicianId,
    CustomerSummaryDto? Customer,
    Guid? ServiceRequestId,
    string? Notes,
    string? FaultCause,
    string? FaultResolution,
    DateTime CreatedAt,
    List<WorkOrderObjectDto> Objects,

    // ── Konum ─────────────────────────────────────
    double? Latitude,
    double? Longitude,
    double? LocationAccuracy,
    DateTime? LocationCapturedAt,
    LocationSource? LocationSource
);
