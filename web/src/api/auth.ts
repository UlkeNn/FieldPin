// src/api/auth.ts
import { http } from "./http";

interface LoginResponse {
  accessToken: string;
  expiresAtUtc: string;
  userId: string;
  role: string;
  refreshToken: string; // Web bunu ignore eder, cookie zaten set edildi
}

export async function login(username: string, password: string) {
  const res = await http.post<LoginResponse>("/api/Auth/login", {
    username,
    password,
  });

  return {
    accessToken: res.data.accessToken,
    role: res.data.role,
    userId: res.data.userId,
    expiresAtUtc: res.data.expiresAtUtc,
  };
}

/**
 * Backend'e logout isteği gönderir.
 * HttpOnly cookie otomatik gider → backend revoke eder + cookie temizlenir.
 */
export async function logout() {
  try {
    await http.post("/api/Auth/logout", {});
  } catch {
    // Logout başarısız olsa bile session'ı temizliyoruz
  }
}
