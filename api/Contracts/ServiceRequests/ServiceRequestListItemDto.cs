using FieldPin.Api.Contracts.Customers;
using FieldPin.Api.Models;

namespace FieldPin.Api.Contracts.ServiceRequests;

// Liste satırı için hafif DTO — detay DTO'sunu (Media/WorkOrders içeren) döndürmez.
public record ServiceRequestListItemDto(
    Guid Id,
    string RequestNo,
    string Title,
    RequestStatus Status,
    RequestPriority Priority,
    RequestSource Source,
    SystemType SystemType,
    JobType JobType,
    CustomerSummaryDto? Customer,
    string? AssignedUserId,
    string? AssignedUserName,
    DateTime CreatedAtUtc,
    DateTime? SlaDueAtUtc,
    bool IsOverdue,
    int WorkOrderCount,
    int MediaCount
);
