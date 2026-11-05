using System.Text.Json.Serialization;

namespace FieldPin.Api.Models;

// Müşteriden gelen montaj/değişim/arıza talebi. İş öncesi kayıt — sahadaki iş WorkOrder'da tutulur.
// Bir talepten birden çok WorkOrder açılabilir (1-N).
public class ServiceRequest
{
    public Guid Id { get; set; } = Guid.NewGuid();

    // ── Talep No ─────────────────────────────────────────────
    // Global sıralı, "TLP-1001" biçiminde. RequestSeq üretim için, RequestNo görüntüleme için.
    public int RequestSeq { get; set; }
    public string RequestNo { get; set; } = default!;

    // ── İlişkiler ────────────────────────────────────────────
    public Guid? CustomerId { get; set; }
    public Customer? Customer { get; set; }

    // ── Sınıflandırma ────────────────────────────────────────
    public SystemType SystemType { get; set; }
    public JobType JobType { get; set; }
    public RequestPriority Priority { get; set; } = RequestPriority.Normal;
    public RequestStatus Status { get; set; } = RequestStatus.New;
    public RequestSource Source { get; set; }

    // ── İçerik ───────────────────────────────────────────────
    public string Title { get; set; } = default!;
    public string? Description { get; set; }

    // ── Cihaz (tablo yok, WorkOrderObject deseni: tip + serbest metin) ───
    public ObjectType? DeviceType { get; set; }
    public string? DeviceIdentifier { get; set; }

    // ── Talepçi ──────────────────────────────────────────────
    public string? CreatedByUserId { get; set; }       // AppUser.Id, admin ise dolduran admin
    public string? RequesterName { get; set; }          // sistem kullanıcısı olmayan talepçi
    public string? RequesterPhone { get; set; }

    // ── Atama ────────────────────────────────────────────────
    public string? AssignedUserId { get; set; }         // AppUser.Id, FK yok (WorkOrder.TechnicianId ile aynı yaklaşım)
    public DateTime? AssignedAtUtc { get; set; }

    // ── Konum (opsiyonel, WorkOrder ile aynı alan seti) ───────
    public string? AddressText { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public double? LocationAccuracy { get; set; }
    public DateTime? LocationCapturedAt { get; set; }
    public LocationSource? LocationSource { get; set; }

    // ── Zaman / kapanış ──────────────────────────────────────
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAtUtc { get; set; }
    public DateTime? SlaDueAtUtc { get; set; }
    public DateTime? CompletedAtUtc { get; set; }
    public string? ResolutionNote { get; set; }

    // ── Entegrasyon ──────────────────────────────────────────
    // WhatsApp/AI ham veri. SQLite'ta jsonb yok, TEXT olarak saklanır.
    public string? RawPayload { get; set; }

    public bool IsDeleted { get; set; } = false;

    // SQLite byte[] rowversion desteklemez, concurrency token olarak Guid kullanılır.
    public Guid RowVersion { get; set; } = Guid.NewGuid();

    [JsonIgnore]
    public List<WorkOrder> WorkOrders { get; set; } = new();

    public List<ServiceRequestMedia> Media { get; set; } = new();
}
