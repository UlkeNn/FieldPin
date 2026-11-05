using FieldPin.Api.Contracts.Customers;
using FieldPin.Api.Models;

namespace FieldPin.Api.Contracts.ServiceRequests;

public record ServiceRequestDetailDto(
    Guid Id,
    string RequestNo,

    string Title,
    string? Description,

    SystemType SystemType,
    JobType JobType,
    RequestPriority Priority,
    RequestStatus Status,
    RequestSource Source,

    CustomerSummaryDto? Customer,

    ObjectType? DeviceType,
    string? DeviceIdentifier,

    string? CreatedByUserId,
    string? RequesterName,
    string? RequesterPhone,

    string? AssignedUserId,
    string? AssignedUserName,
    DateTime? AssignedAtUtc,

    string? AddressText,
    double? Latitude,
    double? Longitude,
    double? LocationAccuracy,
    DateTime? LocationCapturedAt,
    LocationSource? LocationSource,

    DateTime CreatedAtUtc,
    DateTime? UpdatedAtUtc,
    DateTime? SlaDueAtUtc,
    DateTime? CompletedAtUtc,
    string? ResolutionNote,
    bool IsOverdue,

    string? RawPayload,

    Guid RowVersion,

    List<ServiceRequestMediaDto> Media,
    List<LinkedWorkOrderDto> WorkOrders
);
