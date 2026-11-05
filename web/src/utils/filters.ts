// ─────────────────────────────────────────────────────────────
//  Liste filtre yardımcıları.
//  Aktif / Pasif / Hepsi filtresi iki sayfada tekrar ediyordu.
// ─────────────────────────────────────────────────────────────

export type StatusFilter = "all" | "active" | "inactive";

/**
 * "active" → true, "inactive" → false, "all" → null
 */
export function statusToBool(v: StatusFilter): boolean | null {
  if (v === "active") return true;
  if (v === "inactive") return false;
  return null;
}
