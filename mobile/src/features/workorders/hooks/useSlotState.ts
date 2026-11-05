//src/features/workorders/hooks/useSlotState.ts

import { useState } from "react";
import { type RNFile } from "../api/workorders.api";

//İsim ObjectRole olarak devam etmekte isimlendirmelere dikkat et
export type ObjectRole = "single" | "old" | "new";

export type SlotState = {
  identifier: string;
  files: RNFile[];
};

export type SlotActions = {
  setIdentifier: (v: string) => void;
  setFiles: (files: RNFile[]) => void;
  appendFiles: (incoming: RNFile[]) => void;
  removeFile: (index: number) => void;
  reset: () => void;
};

export type Slot = SlotState & SlotActions;

export type SlotMap = Record<ObjectRole, Slot>;

function useOneSlot(): Slot {
  const [identifier, setIdentifier] = useState("");
  const [files, setFiles] = useState<RNFile[]>([]);

  function appendFiles(incoming: RNFile[]) {
    setFiles((prev) => [...prev, ...incoming]);
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function reset() {
    setIdentifier("");
    setFiles([]);
  }

  return { identifier, files, setIdentifier, setFiles, appendFiles, removeFile, reset };
}

/**
 * Üç slot için (single / old / new) ayrı ayrı identifier + files state'i tutar.
 *
 * Kullanım:
 *   const slots = useSlotState();
 *   slots.single.identifier
 *   slots.old.setFiles([...])
 *   slots.resetAll()
 */
export function useSlotState() {
  const single = useOneSlot();
  const old = useOneSlot();
  const _new = useOneSlot(); // 'new' reserved keyword olduğu için _new

  const slotMap: SlotMap = {
    single,
    old,
    new: _new,
  };

  /** Belirli bir slotun getter'larını döner — ObjectRole üzerinden erişim için */
  function getSlot(role: ObjectRole): Slot {
    return slotMap[role];
  }

  /** Üç slotu da sıfırlar */
  function resetAll() {
    single.reset();
    old.reset();
    _new.reset();
  }

  return {
    single,
    old,
    new: _new,
    getSlot,
    resetAll,
  };
}