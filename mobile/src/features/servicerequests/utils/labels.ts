import { RequestPriority, RequestSource, RequestStatus } from "../types/servicerequest.enums";

// formatDateTime burada yeniden yazılmaz — workorders feature'ından reuse edilir.
export { formatDateTime } from "../../workorders/utils/labels";

// ─── Durum ─────────────────────────────────────────────────────────────

export function requestStatusLabel(status: number): string {
  switch (status) {
    case RequestStatus.New:
      return "Yeni";
    case RequestStatus.Assigned:
      return "Atandı";
    case RequestStatus.InProgress:
      return "İşlemde";
    case RequestStatus.OnHold:
      return "Beklemede";
    case RequestStatus.Completed:
      return "Tamamlandı";
    case RequestStatus.Cancelled:
      return "İptal";
    default:
      return `Durum ${status}`;
  }
}

export function requestStatusColor(status: number): string {
  switch (status) {
    case RequestStatus.New:
      return "#667085";
    case RequestStatus.Assigned:
      return "#2D6BE4";
    case RequestStatus.InProgress:
      return "#D97706";
    case RequestStatus.OnHold:
      return "#D97706";
    case RequestStatus.Completed:
      return "#16A34A";
    case RequestStatus.Cancelled:
      return "#DC2626";
    default:
      return "#667085";
  }
}

// ─── Öncelik ───────────────────────────────────────────────────────────

export function requestPriorityLabel(priority: number): string {
  switch (priority) {
    case RequestPriority.Low:
      return "Düşük";
    case RequestPriority.Normal:
      return "Normal";
    case RequestPriority.High:
      return "Yüksek";
    case RequestPriority.Critical:
      return "Kritik";
    default:
      return `Öncelik ${priority}`;
  }
}

export function requestPriorityColor(priority: number): string {
  switch (priority) {
    case RequestPriority.Low:
      return "#667085";
    case RequestPriority.Normal:
      return "#2D6BE4";
    case RequestPriority.High:
      return "#D97706";
    case RequestPriority.Critical:
      return "#DC2626";
    default:
      return "#667085";
  }
}

// ─── Kaynak ────────────────────────────────────────────────────────────

export function requestSourceLabel(source: number): string {
  switch (source) {
    case RequestSource.Web:
      return "Web";
    case RequestSource.WhatsApp:
      return "WhatsApp";
    case RequestSource.WhatsAppAi:
      return "WhatsApp (AI)";
    case RequestSource.Email:
      return "E-posta";
    case RequestSource.Phone:
      return "Telefon";
    default:
      return `Kaynak ${source}`;
  }
}

// ─── Cihaz Tipi (deviceType) ─────────────────────────────────────────────
// DİKKAT: workorders/utils/labels.ts'teki getObjectTypeLabel reuse edilmez —
// o fonksiyon systemType'a göre "Araç"/"Tanım" arasında değişiyor; bu bağlamda
// (talebin deviceType'ı) o mantık geçerli değil. Bağımsız, sabit bir label.
// Değerler backend ObjectType ile aynı sayı uzayını paylaşır (1/2/3/4/99) ama
// workorder.enums.ts'teki ObjectType enum'u bilinçli olarak genişletilmedi.
export function requestDeviceTypeLabel(deviceType: number | null | undefined): string {
  switch (deviceType) {
    case 1:
      return "Plaka";
    case 2:
      return "Cihaz";
    case 3:
      return "Sensör";
    case 4:
      return "Gateway";
    case 99:
      return "Diğer";
    default:
      return "—";
  }
}
