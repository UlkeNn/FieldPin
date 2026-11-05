import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { COLORS, INPUT_STYLE } from "@/src/lib/theme";
import { RequestStatus } from "../types/servicerequest.enums";
import { requestStatusColor, requestStatusLabel } from "../utils/labels";
import { requiresResolutionNote } from "../viewModel/useServiceRequestDetailViewModel";

type Props = {
  visible: boolean;
  targets: RequestStatus[];
  submitting: boolean;
  onCancel: () => void;
  onConfirm: (target: RequestStatus, resolutionNote: string | null) => void;
};

export function ChangeStatusSheet({ visible, targets, submitting, onCancel, onConfirm }: Props) {
  const [selected, setSelected] = useState<RequestStatus | null>(null);
  const [note, setNote] = useState("");

  // Modal her açılışta temiz başlasın
  useEffect(() => {
    if (visible) {
      setSelected(targets[0] ?? null);
      setNote("");
    }
    // targets prop'u her render'da yeni bir dizi referansı — deps'e eklersek
    // modal her render'da sıfırlanır. Yalnızca visible değişince tetiklenmeli.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const noteRequired = selected != null && requiresResolutionNote(selected);
  const canConfirm = selected != null && (!noteRequired || note.trim().length > 0) && !submitting;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onCancel}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, justifyContent: "flex-end" }}
      >
        {/* Arkadaki boş (karanlık) alana tıklandığında iptal et */}
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onCancel}>
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)" }} />
        </TouchableOpacity>

        <View
          style={{
            backgroundColor: "white",
            borderRadius: 20,
            padding: 20,
            gap: 14,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "900" }}>Durum Değiştir</Text>

          <View style={{ gap: 8 }}>
            {targets.map((t) => {
              const isActive = selected === t;
              return (
                <TouchableOpacity
                  key={t}
                  onPress={() => setSelected(t)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    padding: 12,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: isActive ? requestStatusColor(t) : COLORS.border,
                    backgroundColor: isActive ? requestStatusColor(t) + "18" : "white",
                  }}
                >
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: requestStatusColor(t),
                    }}
                  />
                  <Text style={{ fontWeight: "700" }}>{requestStatusLabel(t)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={{ gap: 6 }}>
            <Text style={{ fontWeight: "700" }}>
              Çözüm Notu {noteRequired ? "(zorunlu)" : "(opsiyonel)"}
            </Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Yapılan işlemi kısaca açıkla..."
              multiline
              numberOfLines={3}
              style={[INPUT_STYLE, { minHeight: 80, textAlignVertical: "top" }]}
            />
          </View>

          <TouchableOpacity
            disabled={!canConfirm}
            onPress={() => selected != null && onConfirm(selected, note.trim() || null)}
            style={{
              padding: 14,
              borderRadius: 12,
              backgroundColor: canConfirm ? COLORS.primary : COLORS.border,
              alignItems: "center",
            }}
          >
            <Text style={{ fontWeight: "800", color: "white" }}>
              {submitting ? "Kaydediliyor..." : "Kaydet"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
