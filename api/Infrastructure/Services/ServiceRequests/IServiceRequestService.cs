using FieldPin.Api.Contracts.ServiceRequests;
using FieldPin.Api.Models;
using Microsoft.AspNetCore.Http;

namespace FieldPin.Api.Infrastructure.Services.ServiceRequests;

public interface IServiceRequestService
{
    Task<(List<ServiceRequestListItemDto> Items, int Page, int PageSize, int TotalCount, int TotalPages)>
        ListPagedAsync(ServiceRequestListQuery q, string? restrictAssignedUserId);

    Task<ServiceRequest?> GetByIdAsync(Guid id);

    // AssignedUserId'nin FK'sı yok; detay DTO'su kurulurken görünen ad ayrıca çözülür.
    Task<string?> GetUserNameAsync(string? userId);

    Task<ServiceRequest> CreateAsync(CreateServiceRequestRequest req, string? createdByUserId);
    Task<bool> UpdateAsync(Guid id, UpdateServiceRequestRequest req);
    Task<bool> AssignAsync(Guid id, AssignServiceRequestRequest req);

    // isAdmin, izin verilen durum geçişi kümesini belirler (teknisyen kısıtlı, admin serbest).
    Task<bool> ChangeStatusAsync(Guid id, ChangeStatusRequest req, string userId, bool isAdmin);

    Task<Guid> CreateWorkOrderFromRequestAsync(
        Guid id, CreateWorkOrderFromRequestRequest req, string userId, bool isAdmin);

    Task<bool> LinkWorkOrderAsync(Guid id, Guid workOrderId);

    Task<List<ServiceRequestMedia>> UploadMediaAsync(ServiceRequest r, IFormFileCollection files);
    Task<bool> DeleteMediaAsync(Guid requestId, Guid mediaId);

    Task<bool> SoftDeleteAsync(Guid id);
}
