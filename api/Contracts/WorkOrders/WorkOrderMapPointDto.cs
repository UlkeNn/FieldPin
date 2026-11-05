using FieldPin.Api.Models;

namespace FieldPin.Api.Contracts.WorkOrders;

// Harita endpoint'i için ince DTO. Detay yerine sadece marker'a yetecek alanlar.
public record WorkOrderMapPointDto(
    Guid Id,
    double Latitude,
    double Longitude,
    double? Accuracy,
    LocationSource? Source,
    SystemType SystemType,
    JobType JobType,
    string TechnicianId,
    string? CustomerName,
    DateTime CreatedAt
);
