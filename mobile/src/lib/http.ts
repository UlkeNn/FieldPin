import { getAccessToken } from "@/src/features/auth/auth.storage";
import { emitUnauthorized } from "@/src/features/auth/auth.events";

const API_BASE_URL: string = process.env.EXPO_PUBLIC_BASE_URL || "";

if (!API_BASE_URL) {
    console.warn("Base URL bulunamadı, .env dosyanızı kontrol edin.");
}

type AnyObject = Record<string, any>;

function safeJson(text: string): AnyObject {
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function extractErrorMessage(data: AnyObject | null, status: number): string {
  return (
    data?.message ||
    data?.title ||
    data?.error ||
    (typeof data?.raw === "string" ? data.raw : null) ||
    `HTTP ${status}`
  );
}

async function buildHeaders(
  existing?: HeadersInit,
  contentType?: string
): Promise<Headers> {
  const headers = new Headers(existing);

  headers.set("Accept", "application/json");
  if (contentType) headers.set("Content-Type", contentType);

  const token = await getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  return headers;
}

export async function httpJson<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = await buildHeaders(options.headers, "application/json");

  const res = await fetch(API_BASE_URL + path, {
    ...options,
    headers,
  });

  const text = await res.text();
  const data = text ? safeJson(text) : null;

  if (!res.ok) {
    if (res.status === 401) {
      emitUnauthorized();
    }
    const err = new Error(extractErrorMessage(data, res.status));
    (err as any).status = res.status;
    throw err;
  }

  return data as T;
}

export async function httpFormData<T>(
  path: string,
  formData: FormData,
  options: RequestInit = {}
): Promise<T> {
  // ⚠️ Content-Type setlemiyoruz (boundary bozulmasın)
  const headers = await buildHeaders(options.headers);

  const res = await fetch(API_BASE_URL + path, {
    ...options,
    method: options.method ?? "POST",
    body: formData,
    headers,
  });

  const text = await res.text();
  const data = text ? safeJson(text) : null;

  if (!res.ok) {
    if (res.status === 401) {
      emitUnauthorized();
    }
    const err = new Error(extractErrorMessage(data, res.status));
    (err as any).status = res.status;
    throw err;
  }

  return data as T;
}