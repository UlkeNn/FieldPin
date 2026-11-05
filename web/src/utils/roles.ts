// ─────────────────────────────────────────────────────────────
//  Rol kontrolü.
//  MapPage ve WorkOrdersPage'de tekrar ediyordu.
// ─────────────────────────────────────────────────────────────

export function isTechnician(role?: string | null): boolean {
  return (role ?? "").toLowerCase() === "technician";
}
