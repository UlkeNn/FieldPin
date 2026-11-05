import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { clearAccessToken, getAccessToken, setAccessToken } from "./auth.storage";
import { onUnauthorized } from "./auth.events";
import { meApi } from "./auth.api"; // ✅ EKLE

type AuthState = {
  token: string | null;
  isLoading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setLoading] = useState(true);

  //  401 gelirse: state + storage temizle
  useEffect(() => {
    return onUnauthorized(() => {
      setToken(null);
      void clearAccessToken();
    });
  }, []);

  // BOOTSTRAP: token varsa önce doğrula
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const t = await getAccessToken();
        if (!t) {
          if (!cancelled) setToken(null);
          return;
        }

        // token'ı kullanarak backend'te doğrula (expired/invalid ise 401 döner)
        await meApi();

        if (!cancelled) setToken(t);
      } catch {
        await clearAccessToken();
        if (!cancelled) setToken(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      token,
      isLoading,
      login: async (t) => {
        await setAccessToken(t);
        setToken(t);
      },
      logout: async () => {
        await clearAccessToken();
        setToken(null);
      },
    }),
    [token, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}