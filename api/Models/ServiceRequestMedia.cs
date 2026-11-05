using System.Text.Json.Serialization;

namespace FieldPin.Api.Models;

public class ServiceRequestMedia
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid ServiceRequestId { get; set; }

    [JsonIgnore]
    public ServiceRequest ServiceRequest { get; set; } = default!;

    public string FileName { get; set; } = default!;          // stored file name
    public string? OriginalFileName { get; set; }
    public string RelativePath { get; set; } = default!;      // servicerequests/{requestId}/filename

    public string? ContentType { get; set; }
    public long? SizeBytes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
