//src/features/auth/auth.api.ts

import { httpJson } from "@/src/lib/http";

export type LoginRequest = { username: string; password: string };
export type LoginResponse = {
  accessToken: string;
  expiresAtUtc: string;
  userId: string;
  role: string;
};

export type MeResponse = { 
  userId: string;
  role: string;
  username?: string;
  avatarUrl?: string;

 };

export function loginApi(body: LoginRequest) {
  return httpJson<LoginResponse>("/api/Auth/login", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function meApi() {
  return httpJson<MeResponse>("/api/Auth/me");
}