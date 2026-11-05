using FieldPin.Api.Contracts.Admin.Technicians;

namespace FieldPin.Api.Infrastructure.Services.Technicians;

public interface ITechnicianService
{
    Task<List<TechnicianDto>> GetAllAsync(string? search, bool? isActive);
    Task<TechnicianDto?> GetByIdAsync(string id);
    Task<TechnicianDto> CreateAsync(CreateTechnicianRequest req);
    Task<bool> UpdateAsync(string id, UpdateTechnicianRequest req);
    Task<bool> DeactivateAsync(string id);
    Task<bool> SoftDeleteAsync(string id);
}
