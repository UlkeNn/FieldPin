// src/api/http.ts
import axios, {type InternalAxiosRequestConfig } from "axios";
import { clearSession, getToken, setToken } from "./session";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5290";

export const http = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true, // ← Cookie gönderimi için
});

// ── Request interceptor: Memory'deki token'ı ekle ──
http.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: 401 → silent refresh → retry ──

let isRefreshing = false;
let pendingQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  for (const p of pendingQueue) {
    if (token) p.resolve(token);
    else p.reject(error);
  }
  pendingQueue = [];
}

http.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };
    const status = error?.response?.status;
    const url: string = original?.url ?? "";

    // Auth endpoint'lerinde 401 → döngüye girme
    const isAuthCall =
      url.includes("/api/Auth/login") ||
      url.includes("/api/Auth/refresh") ||
      url.includes("/api/Auth/logout");

    if (status !== 401 || isAuthCall || original._retry) {
      return Promise.reject(error);
    }

    // ── Silent refresh ──

    // Zaten bir refresh devam ediyorsa → kuyruğa ekle
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        pendingQueue.push({ resolve, reject });
      }).then((newToken) => {
        original.headers.Authorization = `Bearer ${newToken}`;
        original._retry = true;
        return http(original);
      });
    }

    isRefreshing = true;
    original._retry = true;

    try {
      // Cookie otomatik gider (withCredentials: true)
      const res = await axios.post<{ accessToken: string }>(
        `${API_BASE_URL}/api/Auth/refresh`,
        {},
        { withCredentials: true }
      );

      const newToken = res.data.accessToken;
      setToken(newToken);

      // Kuyruktaki istekleri yeni token ile devam ettir
      processQueue(null, newToken);

      // Orijinal isteği tekrarla
      original.headers.Authorization = `Bearer ${newToken}`;
      return http(original);
    } catch (refreshError) {
      // Refresh de başarısız → login'e yönlendir
      processQueue(refreshError, null);
      clearSession();
      if (window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
