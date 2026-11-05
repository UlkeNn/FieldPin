using FieldPin.Api.Models;

namespace FieldPin.Api.Contracts.WorkOrders;

public record CreateWorkOrderRequest(
    SystemType SystemType,
    JobType JobType,
    Guid? CustomerId,
    string? Notes,
    string? TechnicianId, // optional dursun adminden eklemek gerekirse

    // Bu iş emri bir talepten üretiliyorsa doldurulur (bkz. ServiceRequestService.CreateWorkOrderFromRequestAsync)
    Guid? ServiceRequestId,

    // Arıza için
    string? FaultCause,
    string? FaultResolution,

    // ── Konum (opsiyonel) ─────────────────────────
    // Latitude ve Longitude birlikte verilmeli; biri verilip diğeri verilmezse 400.
    double? Latitude,
    double? Longitude,
    double? LocationAccuracy,
    DateTime? LocationCapturedAt,
    LocationSource? LocationSource
);
