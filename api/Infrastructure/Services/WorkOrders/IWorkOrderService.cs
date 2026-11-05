using FieldPin.Api.Contracts.Common;
using FieldPin.Api.Contracts.WorkOrders;
using FieldPin.Api.Models;
using Microsoft.AspNetCore.Http;

namespace FieldPin.Api.Infrastructure.Services.WorkOrders;

public interface IWorkOrderService
{
    Task<Guid> CreateAsync(CreateWorkOrderRequest req, string userId, bool isAdmin);

    Task<WorkOrder?> GetByIdAsync(Guid id);

    Task<(List<WorkOrder> Items, int TotalCount, int TotalPages)> GetMyPagedAsync(
        string userId, int page, int pageSize);

    Task<(List<WorkOrder> Items, int TotalCount, int TotalPages)> GetByTechnicianPagedAsync(
        string technicianId, int page, int pageSize);

    Task<List<BatchObjectResult>> CreateObjectsBatchAsync(
        Guid workOrderId, List<BatchObjectDto> items);

    // Media
    Task<WorkOrderObject?> GetObjectWithWorkOrderAsync(Guid objectId);
    Task<List<WorkOrderObjectMedia>> UploadMediaAsync(WorkOrderObject obj, IFormFileCollection files);

    // ── Konum ─────────────────────────────────────
    // KISITLIYORUZ:::restrictTechnicianId null değilse sadece o teknisyenin kayıtları döner (admin değilse zorunlu).
    Task<List<WorkOrderMapPointDto>> GetMapPointsAsync(MapQueryRequest q, string? restrictTechnicianId);

    Task<bool> UpdateLocationAsync(Guid id, UpdateLocationRequest req);
}
