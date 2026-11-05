// src/api/session.ts
// ── Token artık SADECE memory'de tutuluyor — localStorage yok ──

let accessToken: string | null = null;

function base64UrlDecode(input: string) {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const str = atob(padded);
  try {
    return decodeURIComponent(
      Array.from(str)
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );
  } catch {
    return str;
  }
}

export function getToken(): string | null {
  return accessToken;
}

export function setToken(token: string) {
  accessToken = token;
}

export function clearSession() {
  accessToken = null;
}

export function isTokenExpired(token: string, skewSeconds = 30): boolean {
  const parts = token.split(".");
  if (parts.length < 2) return false;

  try {
    const payload = JSON.parse(base64UrlDecode(parts[1])) as { exp?: number };
    if (!payload.exp) return false;
    const expMs = payload.exp * 1000;
    return Date.now() >= expMs - skewSeconds * 1000;
  } catch {
    return false;
  }
}

export function isAuthenticated(): boolean {
  const token = getToken();
  if (!token) return false;
  if (isTokenExpired(token)) return false;
  return true;
}
