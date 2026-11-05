using FieldPin.Api.Models;

namespace FieldPin.Api.Contracts.ServiceRequests;

// Partial update: null = dokunma, ""/whitespace (string alanlarda) = null'a çek.
// RowVersion doluysa concurrency kontrolü uygulanır; uyuşmazsa 409.
public record UpdateServiceRequestRequest(
    string? Title,
    string? Description,

    SystemType? SystemType,
    JobType? JobType,
    RequestPriority? Priority,

    Guid? CustomerId,

    ObjectType? DeviceType,
    string? DeviceIdentifier,

    string? RequesterName,
    string? RequesterPhone,

    string? AddressText,
    double? Latitude,
    double? Longitude,
    double? LocationAccuracy,
    DateTime? LocationCapturedAt,
    LocationSource? LocationSource,

    DateTime? SlaDueAtUtc,
    string? RawPayload,

    Guid? RowVersion
);
