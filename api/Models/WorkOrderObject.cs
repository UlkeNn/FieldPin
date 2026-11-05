using System.Text.Json.Serialization;

namespace FieldPin.Api.Models;

public class WorkOrderObject
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid WorkOrderId { get; set; }

    [JsonIgnore]
    public WorkOrder WorkOrder { get; set; } = default!;

    public ObjectType ObjectType { get; set; }

    // ExternalId kaldırıldı
    // public string? ObjectExternalId { get; set; }

    public string? ObjectIdentifier { get; set; }

    // Replacement için role
    public WorkOrderObjectRole Role { get; set; } = WorkOrderObjectRole.Single;

    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Çoklu foto
    public List<WorkOrderObjectMedia> Media { get; set; } = new();
}