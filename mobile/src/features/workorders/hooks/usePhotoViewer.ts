//src/features/workorders/hooks/usePhotoViewer.ts
import { useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";

import { type RNFile } from "../api/workorders.api";
import { type ObjectRole, type SlotMap } from "./useSlotState";

/**
 * Silme onay modalını hook dışına alarak (nesting) uyarısını engelliyoruz.
 */
function showDeleteAlert(onConfirm: () => void) {
  Alert.alert("Fotoğrafı sil", "Bu fotoğrafı silmek istiyor musun?", [
    { text: "Vazgeç", style: "cancel" },
    {
      text: "Sil",
      style: "destructive",
      onPress: onConfirm,
    },
  ]);
}

/**
 * Fotoğraf önizleme modalını yönetir.
 * Aktif slot'un files array'ini SlotMap üzerinden okur ve günceller.
 *
 * Kullanım:
 * const viewer = usePhotoViewer(slots);
 *
 * thumbnail'a tıklandığında:
 * viewer.open("single", index);
 *
 * <PhotoViewerModal
 * visible={viewer.visible}
 * files={viewer.files}
 * selectedIndex={viewer.index}
 * onClose={viewer.close}
 * onSelect={viewer.setIndex}
 * onDelete={viewer.askDelete}
 * />
 */
export function usePhotoViewer(slots: SlotMap) {
  const [visible, setVisible] = useState(false);
  const [role, setRole] = useState<ObjectRole>("single");
  const [index, setIndex] = useState(0);

  /* Aktif slotun güncel files array'i */
  const files: RNFile[] = useMemo(() => {
    return slots[role]?.files ?? [];
    // slots objesinin kendisi değil, içindeki files array'leri dependency —
    // role değişince doğru slotun files'ına geçilmesi için role da eklendi.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, slots.single.files, slots.old.files, slots.new.files]);

  // Dosya silinince index ve modal durumunu senkronize tut
  useEffect(() => {
    if (!visible) return; // modal kapalıysa işlem yok

    if (!files.length) {
      // Dosya kalmadıysa kapansın
      setVisible(false);
      setIndex(0);
      return;
    }

    if (index > files.length - 1) {
      // burası 2. indexte (silinen fotoda) kalan kullanıcıya 1. index'e taşır
      setIndex(files.length - 1);
    }
  }, [files, visible, index]);

  function open(r: ObjectRole, i: number) {
    setRole(r);
    setIndex(i);
    setVisible(true);
  }

  function close() {
    setVisible(false);
  }

  function deleteAt(i: number) {
    const next = files.filter((_, idx) => idx !== i);
    slots[role].setFiles(next);

    if (!next.length) {
      setVisible(false);
      setIndex(0);
    } else if (index >= next.length) {
      setIndex(next.length - 1);
    }
  }

  function askDelete(i: number) {
    // Alert çağrısını dışarıdaki fonksiyona devrederek nesting'i kırıyoruz
    showDeleteAlert(() => deleteAt(i));
  }

  return {
    visible,
    role,
    index,
    files,

    open,
    close,
    setIndex,
    askDelete,
  };
}