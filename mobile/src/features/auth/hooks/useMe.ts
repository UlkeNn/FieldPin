// src/features/auth/hooks/useMe.ts
import { useQuery } from "@tanstack/react-query";
import { meApi, type MeResponse } from "../auth.api";
import { useAuth } from "../AuthProvider";

const FIVE_MINUTES = 5 * 60 * 1000;

/**
 * Giriş yapmış kullanıcının profil bilgilerini getirir.
 * Token süresi boyunca makul ölçüde taze kabul edilir; gereksiz refetch yapmaz.
 *
 * Kullanım:
 *   const me = useMe();
 *   if (me.isLoading) ...
 *   me.data?.username
 */
export function useMe() {
  const { token } = useAuth();

  return useQuery<MeResponse>({
    queryKey: ["auth", "me"],
    queryFn: meApi,
    enabled: !!token,         // token yoksa hiç çağırma
    staleTime: FIVE_MINUTES,  // 5 dk içinde tekrar mount olursa gereksiiz yere refetch yok 
    retry: 1,
  });
}
