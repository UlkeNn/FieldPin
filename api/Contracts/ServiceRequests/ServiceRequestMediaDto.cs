namespace FieldPin.Api.Contracts.ServiceRequests;

public record ServiceRequestMediaDto(
    Guid Id,
    string Url,
    string FileName,
    string? OriginalFileName,
    string? ContentType,
    long? SizeBytes,
    DateTime CreatedAt
);
