// src/features/workorders/api/plate.api.ts
//
// Plaka tanıma (ANPR/ALPR) servis katmanı.
//
// Bu projede cihaz-içi OCR kütüphanesi (vision-camera + ML Kit vb.) yok; mevcut
// akış görselleri zaten multipart ile backend'e yüklüyor. Aynı deseni izliyoruz:
// çekilen kareyi bir tanıma uç noktasına gönderir, dönen plakayı normalize ederiz.
//
// Yapılandırma (hepsi opsiyonel, .env içine EXPO_PUBLIC_* olarak):
//   EXPO_PUBLIC_PLATE_OCR_URL    → Harici tam URL (ör. Plate Recognizer). Verilirse
//                                  doğrudan bu adrese POST atılır.
//   EXPO_PUBLIC_PLATE_OCR_TOKEN  → Harici sağlayıcı için Authorization token'ı.
//   EXPO_PUBLIC_PLATE_OCR_PATH   → İç backend yolu (varsayılan: /api/anpr/recognize).
//
// Hiçbiri ayarlı değilse iç backend'in varsayılan yoluna httpFormData ile gider.

import { httpFormData } from "../../../lib/http";
import { normalizePlate } from "../utils/plate";
import type { RNFile } from "./workorders.api";

const EXTERNAL_URL = process.env.EXPO_PUBLIC_PLATE_OCR_URL || "";
const EXTERNAL_TOKEN = process.env.EXPO_PUBLIC_PLATE_OCR_TOKEN || "";
const INTERNAL_PATH = process.env.EXPO_PUBLIC_PLATE_OCR_PATH || "/api/anpr/recognize";

export type PlateRecognitionResult = {
  /** Normalleştirilmiş plaka, örn. "34 ABC 123". */
  plate: string;
  /** Bilinen TR kalıbına uydu mu. */
  isValid: boolean;
  /** Sağlayıcı güven skoru (0–1) — varsa. */
  confidence: number | null;
  /** Ham yanıt (hata ayıklama / loglama için). */
  raw: unknown;
};

/**
 * Çeşitli ANPR sağlayıcılarının yanıtlarından ham plaka metnini ve güven skorunu
 * en iyi şekilde çıkarmaya çalışır. Bilinen şekiller:
 *   { plate: "34ABC123", confidence: 0.97 }
 *   { plateNumber: "..." }                       (iç backend)
 *   { results: [{ plate: "...", score: 0.9 }] }  (Plate Recognizer)
 *   { predictions: [{ plate: "...", confidence }]}
 */
function extractFromResponse(data: any): { text: string; confidence: number | null } {
  if (!data || typeof data !== "object") {
    return { text: String(data ?? ""), confidence: null };
  }

  // Düz alanlar
  const flat = data.plate ?? data.plateNumber ?? data.licensePlate ?? data.text;
  if (typeof flat === "string" && flat.trim()) {
    const conf = pickConfidence(data);
    return { text: flat, confidence: conf };
  }

  // Dizi tabanlı yanıtlar
  const list: any[] =
    (Array.isArray(data.results) && data.results) ||
    (Array.isArray(data.predictions) && data.predictions) ||
    (Array.isArray(data.data) && data.data) ||
    [];

  if (list.length) {
    // En yüksek güven skoruna sahip adayı seç.
    const best = [...list].sort(
      (a, b) => (pickConfidence(b) ?? 0) - (pickConfidence(a) ?? 0),
    )[0];
    const text = best?.plate ?? best?.plateNumber ?? best?.text ?? "";
    return { text: String(text ?? ""), confidence: pickConfidence(best) };
  }

  return { text: "", confidence: null };
}

function pickConfidence(o: any): number | null {
  const c = o?.confidence ?? o?.score ?? o?.probability;
  return typeof c === "number" ? c : null;
}

function buildForm(file: RNFile): FormData {
  const form = new FormData();
  // Çoğu ANPR uç noktası "upload" ya da "file" alanını bekler; ikisini de gönderiyoruz.
  const part = { uri: file.uri, name: file.name, type: file.type } as any;
  form.append("upload", part);
  form.append("file", part);
  return form;
}

/** Harici tam-URL sağlayıcıya doğrudan fetch (kendi auth başlığıyla). */
async function recognizeExternal(file: RNFile): Promise<any> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (EXTERNAL_TOKEN) headers.Authorization = `Token ${EXTERNAL_TOKEN}`;

  const res = await fetch(EXTERNAL_URL, {
    method: "POST",
    headers, // Content-Type'ı set etmiyoruz → boundary bozulmasın
    body: buildForm(file),
  });

  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const msg = data?.message ?? data?.detail ?? data?.error ?? `HTTP ${res.status}`;
    throw new Error(typeof msg === "string" ? msg : `HTTP ${res.status}`);
  }
  return data;
}

/**
 * Bir görselden plaka tanır. Çekilen kareyi sağlayıcıya gönderir,
 * dönen metni normalize eder.
 */
export async function recognizePlate(file: RNFile): Promise<PlateRecognitionResult> {
  if (!file?.uri) throw new Error("Tanıma için görsel bulunamadı.");

  const data = EXTERNAL_URL
    ? await recognizeExternal(file)
    : await httpFormData<any>(INTERNAL_PATH, buildForm(file));

  const { text, confidence } = extractFromResponse(data);
  if (!text || !text.trim()) {
    throw new Error("Plaka okunamadı. Tekrar deneyin ya da elle girin.");
  }

  const norm = normalizePlate(text);
  return {
    plate: norm.value,
    isValid: norm.isValid,
    confidence,
    raw: data,
  };
}
