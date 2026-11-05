namespace FieldPin.Api.Contracts.ServiceRequests;

public record AssignServiceRequestRequest(
    string AssignedUserId,
    DateTime? SlaDueAtUtc
);
