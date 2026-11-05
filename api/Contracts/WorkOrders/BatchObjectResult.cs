using FieldPin.Api.Models;

namespace FieldPin.Api.Contracts.WorkOrders;

public record BatchObjectResult(
    Guid Id,
    ObjectType ObjectType,
    WorkOrderObjectRole Role,
    string? ObjectIdentifier
);
