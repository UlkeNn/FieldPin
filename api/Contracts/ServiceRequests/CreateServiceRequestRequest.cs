using FieldPin.Api.Models;

namespace FieldPin.Api.Contracts.ServiceRequests;

public record CreateServiceRequestRequest(
    string Title,
    string? Description,

    SystemType SystemType,
    JobType JobType,
    RequestPriority Priority,
    RequestSource Source,

    Guid? CustomerId,

    ObjectType? DeviceType,
    string? DeviceIdentifier,

    string? RequesterName,
    string? RequesterPhone,

    string? AssignedUserId,

    // ── Konum (opsiyonel) ─────────────────────────
    string? AddressText,
    double? Latitude,
    double? Longitude,
    double? LocationAccuracy,
    DateTime? LocationCapturedAt,
    LocationSource? LocationSource,

    DateTime? SlaDueAtUtc,

    // WhatsApp/AI ham veri. Source == WhatsAppAi ise zorunludur.
    string? RawPayload
);
