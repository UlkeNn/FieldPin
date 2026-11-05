using FieldPin.Api.Models;

namespace FieldPin.Api.Contracts.WorkOrders;

// GET /api/workorders/map için [FromQuery] parametre kabı.
// Hepsi opsiyonel; bbox alanları ya hep birlikte verilmeli ya hiç verilmemeli.
public class MapQueryRequest
{
    public DateTime? From { get; set; }
    public DateTime? To { get; set; }

    public string? TechnicianId { get; set; }   // sadece admin için anlamlı
    public Guid? CustomerId { get; set; }

    public SystemType? SystemType { get; set; }
    public JobType? JobType { get; set; }

    // Bounding box (opsiyonel) — harita viewport'una göre filtre
    public double? MinLat { get; set; }
    public double? MinLng { get; set; }
    public double? MaxLat { get; set; }
    public double? MaxLng { get; set; }
}
