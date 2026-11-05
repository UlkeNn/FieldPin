import { useRef, useState } from "react";
import { Alert } from "react-native";
import type { RNFile } from "../api/workorders.api";

/**
 * Generic fotoğraf görüntüleyici hook.
 * SlotMap'e bağlı değil — herhangi bir files dizisini açabilir.
 *
 * Kullanım:
 *   const viewer = useSlotPhotoViewer();
 *   viewer.open(slot.files, index, (i) => deleteFileFn(i));
 */
export function useSlotPhotoViewer() {
  const [visible, setVisible]   = useState(false);
  const [files,   setFiles]     = useState<RNFile[]>([]);
  const [index,   setIndex]     = useState(0);
  const deleteFnRef = useRef<(i: number) => void>(() => {});

  function open(f: RNFile[], startIndex: number, onDelete: (i: number) => void) {
    setFiles([...f]);
    setIndex(startIndex);
    deleteFnRef.current = onDelete;
    setVisible(true);
  }

  function close() {
    setVisible(false);
  }

  function askDelete(i: number) {
    Alert.alert("Fotoğrafı sil", "Bu fotoğrafı silmek istiyor musun?", [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: () => {
          deleteFnRef.current(i);
          setFiles((prev) => {
            const next = prev.filter((_, idx) => idx !== i);
            if (!next.length) { setVisible(false); setIndex(0); }
            else if (index >= next.length) setIndex(next.length - 1);
            return next;
          });
        },
      },
    ]);
  }

  return { visible, files, index, open, close, setIndex, askDelete };
}
