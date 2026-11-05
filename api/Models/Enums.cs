namespace FieldPin.Api.Models;

public enum SystemType { System1 = 1, System2 = 2 }
public enum JobType { NewInstall = 1, Replacement = 2, Fault = 3 }

public enum ObjectType
{
    Plate = 1,
    Device = 2,
    Sensor = 3,
    Gateway = 4,
    Other = 99
}

// Replacement için old/new/single
public enum WorkOrderObjectRole
{
    Single = 0,
    Old = 1,
    New = 2
}

// Konum kaynağı
public enum LocationSource
{
    Gps = 1,
    Network = 2,
    Manual = 3
}

// ── ServiceRequest (Talep) ──────────────────────────────────

// Talep durumu. Completed/Cancelled terminaldir, oradan çıkış yok.
public enum RequestStatus
{
    New = 1,
    Assigned = 2,
    InProgress = 3,
    OnHold = 4,
    Completed = 5,
    Cancelled = 6
}

public enum RequestPriority
{
    Low = 1,
    Normal = 2,
    High = 3,
    Critical = 4
}

// Talebin geldiği kanal
public enum RequestSource
{
    Web = 1,        // Admin panelinden elle açıldı
    WhatsApp = 2,   // WhatsApp'tan geldi, alanlar elle girildi
    WhatsAppAi = 3, // WhatsApp mesajı bot tarafından AI ile ayrıştırılıp dolduruldu
    Email = 4,
    Phone = 5       // Telefonla arandı, admin girdi
}
