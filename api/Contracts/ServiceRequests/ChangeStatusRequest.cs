using FieldPin.Api.Models;

namespace FieldPin.Api.Contracts.ServiceRequests;

public record ChangeStatusRequest(
    RequestStatus Status,
    string? ResolutionNote
);
