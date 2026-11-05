import { View } from "react-native";
import { IdentifierInput } from "./IdentifierInput";
import type { RNFile } from "../api/workorders.api";
import type { EntryRole } from "../hooks/useMultiObjectForm";

type SlotData = { identifier: string; files: RNFile[] };

type Props = {
  isReplacement: boolean;
  placeholder: string;
  entry: { single: SlotData; old: SlotData; new: SlotData };
  onSetId:   (role: EntryRole, v: string) => void;
  onCamera:  (role: EntryRole) => void;
  onQr:      (role: EntryRole) => void;
  onPreview: (role: EntryRole, index: number) => void;
  /** Tarama tipi: "qr" (varsayılan) ya da "plate". */
  scanType?: "qr" | "plate";
  /** Plaka tanıma akışını açar (scanType === "plate" iken). */
  onPlate?:  (role: EntryRole) => void;
};

export function ObjectRow({ isReplacement, placeholder, entry, onSetId, onCamera, onQr, onPreview, scanType = "qr", onPlate }: Props) {
  if (!isReplacement) {
    return (
      <IdentifierInput
        value={entry.single.identifier}
        onChange={(v) => onSetId("single", v)}
        placeholder={placeholder}
        onCamera={() => onCamera("single")}
        onQr={() => onQr("single")}
        scanType={scanType}
        onPlate={() => onPlate?.("single")}
        files={entry.single.files}
        onPreview={(i) => onPreview("single", i)}
      />
    );
  }

  return (
    <View style={{ gap: 10 }}>
      <IdentifierInput
        label="Eski"
        value={entry.old.identifier}
        onChange={(v) => onSetId("old", v)}
        placeholder={`Eski ${placeholder}`}
        onCamera={() => onCamera("old")}
        onQr={() => onQr("old")}
        scanType={scanType}
        onPlate={() => onPlate?.("old")}
        files={entry.old.files}
        onPreview={(i) => onPreview("old", i)}
      />
      <IdentifierInput
        label="Yeni"
        value={entry.new.identifier}
        onChange={(v) => onSetId("new", v)}
        placeholder={`Yeni ${placeholder}`}
        onCamera={() => onCamera("new")}
        onQr={() => onQr("new")}
        scanType={scanType}
        onPlate={() => onPlate?.("new")}
        files={entry.new.files}
        onPreview={(i) => onPreview("new", i)}
      />
    </View>
  );
}
