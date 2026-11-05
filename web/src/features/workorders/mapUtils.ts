// ─────────────────────────────────────────────────────────────
//  Harita sayfası özel yardımcıları.
// ─────────────────────────────────────────────────────────────

export type QuickRange = "today" | "7d" | "30d" | "custom";

export const TODAY_ISO = (): string => new Date().toISOString().split("T")[0];

export const ISO_DAYS_AGO = (n: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
};

/**
 * Sıralı rota üzerinde renk dağılımı (yeşilden kırmızıya).
 */
export function badgeColor(idx: number, total: number): string {
  if (total <= 1) return "hsl(135, 70%, 42%)";
  const t = idx / (total - 1);
  const hue = 135 - 135 * t;
  return `hsl(${hue}, 75%, 45%)`;
}
