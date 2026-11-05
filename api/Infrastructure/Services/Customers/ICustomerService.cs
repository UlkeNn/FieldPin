using FieldPin.Api.Contracts.Customers;

namespace FieldPin.Api.Infrastructure.Services.Customers;

public interface ICustomerService
{
    // Public / Mobile
    Task<List<CustomerSummaryDto>> GetActiveAsync(string? search);
    Task<CustomerSummaryDto?> GetActiveByIdAsync(Guid id);

    // Admin
    Task<List<CustomerDto>> AdminListAsync(string? search, bool? isActive);
    Task<CustomerDto?> GetByIdAsync(Guid id);
    Task<CustomerDto> CreateAsync(CreateCustomerRequest req);
    Task<bool> UpdateAsync(Guid id, UpdateCustomerRequest req);
    Task<bool> SetActivationAsync(Guid id, bool isActive);
    Task<bool> SoftDeleteAsync(Guid id);
}
