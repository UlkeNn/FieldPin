using FieldPin.Api.Models;

namespace FieldPin.Api.Contracts.ServiceRequests;

public record LinkedWorkOrderDto(
    Guid Id,
    SystemType SystemType,
    JobType JobType,
    string TechnicianId,
    DateTime CreatedAt
);
