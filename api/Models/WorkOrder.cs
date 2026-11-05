namespace FieldPin.Api.Models;

public class WorkOrder
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public SystemType SystemType { get; set; }
    public JobType JobType { get; set; }

    public string TechnicianId { get; set; } = default!;

    public Guid? CustomerId { get; set; }
    public Customer? Customer { get; set; }

    // Bu iş emri bir talepten üretildiyse doldurulur (bir talepten birden çok WorkOrder açılabilir).
    public Guid? ServiceRequestId { get; set; }
    public ServiceRequest? ServiceRequest { get; set; }

    public string? Notes { get; set; }

    // Arıza için yeni alanlar
    public string? FaultCause { get; set; }
    public string? FaultResolution { get; set; }

    // ── Konum (opsiyonel) ────────────────────────────────────
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public double? LocationAccuracy { get; set; }       // metre
    public DateTime? LocationCapturedAt { get; set; }   // UTC
    public LocationSource? LocationSource { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<WorkOrderObject> Objects { get; set; } = new();
}
