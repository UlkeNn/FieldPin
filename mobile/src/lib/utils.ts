import {type RNFile} from "../features/workorders/api/workorders.api";

export function guessFile(uri: string): RNFile {
  const clean = uri.split("?")[0];
  const ext = (clean.split(".").pop() ?? "jpg").toLowerCase();
  const type =
    ext === "png" ? "image/png" : "image/jpeg";
  const name = `photo_${Date.now()}.${ext === "jpeg" ? "jpg" : ext}`;
  return { uri, name, type };
}
export function errorMessage(e: any): string {
  if (!e) return "Bilinmeyen hata";
  if (typeof e === "string") return e;
  if (e?.response?.data) {
    if (typeof e.response.data === "string") return e.response.data;
    try { return JSON.stringify(e.response.data); } catch {}
  }
  return e?.message ?? "Bilinmeyen hata";
}