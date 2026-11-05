// src/features/auth/hooks/useUpdateAvatar.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  uploadAvatarApi,
  deleteAvatarApi,
  type AvatarUploadFile,
} from "../api/avatar.api";

/**
 * Profil fotoğrafı yükleme ve silme mutation'larını döndürür.
 * Her iki mutation da başarılı olunca ["auth", "me"] query'sini invalidate eder
 * → useMe'yi tüketen tüm ekranlarda avatar otomatik tazelenir.
 *
 * Kullanım:
 *   const avatar = useUpdateAvatar();
 *   await avatar.upload.mutateAsync(file);
 *   avatar.upload.isPending  // yükleme sürüyor mu
 *   await avatar.remove.mutateAsync();
 */
export function useUpdateAvatar() {
  const queryClient = useQueryClient();

  const upload = useMutation({
    mutationFn: (file: AvatarUploadFile) => uploadAvatarApi(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });

  const remove = useMutation({
    mutationFn: () => deleteAvatarApi(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });

  return { upload, remove };
}
