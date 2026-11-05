// src/features/auth/api/avatar.api.ts
import { httpFormData, httpJson } from "@/src/lib/http";

/**
 * React Native FormData için dosya tipi.
 * NOT: Aynı yapıdaki tip workorders feature'ında da var. İleride
 * `src/lib/types.ts`'ye taşınıp ortak kullanılabilir; şimdilik
 * feature'lar arası bağımlılık yaratmamak için her feature kendi tipini tutuyor.
 */
export type AvatarUploadFile = {
  uri: string;
  name: string;
  type: string;
};

// PUT /api/Auth/me/avatar response'u 
export type AvatarResponse = {
  avatarUrl: string;
};


//   Profil fotoğrafını yükler. Backend tarafında eski avatar otomatik silinir.
//   HEIC dosyaları sunucu tarafında JPEG'e çevrilir.
 
export async function uploadAvatarApi(file: AvatarUploadFile) {
  const form = new FormData();

  // Backend'de IFormFile parametre adı "file"
  form.append("file", {
    uri: file.uri,
    name: file.name,
    type: file.type,
  } as any);

  return httpFormData<AvatarResponse>("/api/Auth/me/avatar", form, {
    method: "PUT",
  });
}

// Profil fotoğrafını siler. Idempotent — avatar zaten yoksa bile başarılı döner.
 
export async function deleteAvatarApi() {
  return httpJson<void>("/api/Auth/me/avatar", { method: "DELETE" });
}
