using System.Text.Json.Serialization;

namespace FieldPin.Api.Models;

public class WorkOrderObjectMedia
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid WorkOrderObjectId { get; set; }

    [JsonIgnore]
    public WorkOrderObject WorkOrderObject { get; set; } = default!;

    public string FileName { get; set; } = default!;          // stored file name
    public string? OriginalFileName { get; set; }             // istersen gösterirsin
    public string RelativePath { get; set; } = default!;      // uploads/workorders/{wo}/objects/{obj}/filename

    public string? ContentType { get; set; }
    public long? SizeBytes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}