namespace FieldPin.Api.Contracts.ServiceRequests;

// Talepten iş emri üretirken atlanabilen alanlar; boş bırakılırsa talepten kopyalanır.
public record CreateWorkOrderFromRequestRequest(
    string? TechnicianId,
    string? Notes
);
