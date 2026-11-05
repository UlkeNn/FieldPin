using FieldPin.Api.Models;

namespace FieldPin.Api.Contracts.ServiceRequests;

// GET liste endpoint'leri için [FromQuery] parametre kabı. Hepsi opsiyonel;
// boş gelen filtre uygulanmaz. MapQueryRequest deseni örnek alınmıştır.
public class ServiceRequestListQuery
{
    // RequestNo/Title/Description/RequesterName/RequesterPhone içinde arama
    public string? Q { get; set; }

    public RequestStatus? Status { get; set; }
    public RequestPriority? Priority { get; set; }
    public RequestSource? Source { get; set; }

    public SystemType? SystemType { get; set; }
    public JobType? JobType { get; set; }

    public Guid? CustomerId { get; set; }

    public string? AssignedUserId { get; set; }
    public bool? Unassigned { get; set; }
    public bool? OverdueOnly { get; set; }

    public DateTime? From { get; set; }   // CreatedAtUtc
    public DateTime? To { get; set; }

    // "createdAt" | "priority" | "slaDueAt" — "-" öneki azalan sıralama. Varsayılan "-createdAt".
    public string? Sort { get; set; }

    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 15;
}
