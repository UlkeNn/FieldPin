// ─────────────────────────────────────────────────────────────
//  Tarih / sayı format yardımcıları.
//  Tekrarları tekilleştirmek için ortak yere alındı.
// ─────────────────────────────────────────────────────────────

/**
 * ISO tarihi yerel formata çevirir.
 * Geçersiz tarih olursa ham ISO string'i geri verir.
 */
export function toLocalDateTime(iso?: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

/**
 * Bir <input type="date"> için ISO tarihinin YYYY-MM-DD kısmını verir.
 */
export function toDateInputValue(iso?: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

/**
 * Doğum tarihinden yaş hesaplar.
 */
export function ageFromBirthDate(iso?: string | null): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}
