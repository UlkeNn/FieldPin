// ─────────────────────────────────────────────────────────────
//  Hata mesajı yardımcıları.
//  CustomersPage ve TechniciansPage'de birebir aynı şekilde
//  tanımlıydı, buraya alındı.
// ─────────────────────────────────────────────────────────────

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

/**
 * Backend / Axios hatalarından kullanıcıya gösterilecek metni çıkarır.
 *
 * Önce response.data'ya bakılır, err.message'a en son başvurulur:
 * Axios hatalarında err.message her zaman doludur (ör. "Request failed
 * with status code 400") ve backend'in gövdeye koyduğu asıl mesajı
 * (birçok endpoint'te düz Türkçe metin) gölgede bırakırdı.
 */
export function safeErrMessage(err: unknown): string {
  if (isRecord(err)) {
    const response = err["response"];
    if (isRecord(response)) {
      const data = response["data"];

      if (typeof data === "string" && data.trim().length > 0) return data;

      if (isRecord(data)) {
        const m1 = data["message"];
        if (typeof m1 === "string") return m1;

        const m2 = data["title"];
        if (typeof m2 === "string") return m2;

        const m3 = data["error"];
        if (typeof m3 === "string") return m3;

        // ASP.NET Core ValidationProblemDetails: { errors: { Field: ["msg", ...] } }
        const errors = data["errors"];
        if (isRecord(errors)) {
          for (const key of Object.keys(errors)) {
            const fieldErrors = errors[key];
            if (Array.isArray(fieldErrors) && typeof fieldErrors[0] === "string") {
              return fieldErrors[0];
            }
          }
        }
      }
    }

    const msg = err["message"];
    if (typeof msg === "string") return msg;
  }
  return "Bilinmeyen hata";
}
