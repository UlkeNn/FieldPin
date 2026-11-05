import { ObjectType, SystemType } from "../types/workorder.enums";

// ─── Enum → Label ──────────────────────────────────────────────────────────

export function jobTypeLabel(jobType: number): string {
  if (jobType === 1) return "Montaj";
  if (jobType === 2) return "Değişim";
  if (jobType === 3) return "Arıza";
  return `Job ${jobType}`;
}

export function systemIcon(systemType: number): string {
  return systemType === 1 ? "car-outline" : "wifi-outline";
}

export function getObjectTypeLabel(objectType: number, systemType: number): string {
  if (objectType === ObjectType.Vehicle) return systemType === SystemType.System2 ? "Tanım" : "Araç";
  if (objectType === ObjectType.Device) return "Cihaz";
  if (objectType === ObjectType.Sensor) return "Sensör";
  return "Nesne";
}

export function systemTypeLabel(systemType: number): string {
  return systemType === SystemType.System1 ? "Sistem 1" : "Sistem 2";
}

export function roleLabel(role: number): string {
  if (role === 1) return "Eski";
  if (role === 2) return "Yeni";
  return "";
}

export function jobBadgeColor(jobType: number): string {
  if (jobType === 1) return "#16A34A"; // Montaj
  if (jobType === 2) return "#D97706"; // Değişim
  if (jobType === 3) return "#DC2626"; // Arıza
  return "#667085";
}

// ─── Tarih Formatlama ──────────────────────────────────────────────────────

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/**
 * Backend UTC tarihini Türkiye saatine (+3) çevirip formatlar.
 * Örnek çıktı şudur: "11.03.2026 - 13:43"
 */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    const s = iso.replace("T", " ");
    return s.length >= 16 ? `${s.slice(0, 10)} - ${s.slice(11, 16)}` : iso;
  }

  // UTC+3 (Türkiye)
  const turkey = new Date(d.getTime() + 3 * 60 * 60 * 1000);

  return `${pad2(turkey.getUTCDate())}.${pad2(turkey.getUTCMonth() + 1)}.${turkey.getUTCFullYear()} - ${pad2(
    turkey.getUTCHours(),
  )}:${pad2(turkey.getUTCMinutes())}`;
}

