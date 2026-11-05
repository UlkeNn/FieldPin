using FieldPin.Api.Models;

namespace FieldPin.Api.Contracts.WorkOrders;

//Fotoğraflar
public sealed record WorkOrderObjectMediaDto(
    Guid Id,
    string Url,
    string FileName,
    string? OriginalFileName,
    string? ContentType,
    long? SizeBytes,
    DateTime CreatedAt
);


public record WorkOrderObjectDto(
    Guid Id,
    ObjectType ObjectType,
    WorkOrderObjectRole Role,
    string? ObjectIdentifier,
    DateTime CreatedAt,
    string? Notes,
    List<WorkOrderObjectMediaDto> Media
    
);
