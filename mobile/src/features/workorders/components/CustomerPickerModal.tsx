import { useMemo } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
} from "react-native";
import { type CustomerDto } from "../../customers/api/customers.api";
import { INPUT_STYLE } from "@/src/lib/theme";

// ─── CustomerWheel ────────────────────────────────────────────────────────────

type ListProps = {
  customers: CustomerDto[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

function CustomerList({
   customers, selectedId, onSelect }: ListProps) {
  const items = useMemo(() => {
    const other = { id: "OTHER",
       name: "Diğer",
        info: "Kayıtsız müşteri",
        phone: null 
      } as CustomerDto;
    return [other, ...(customers ?? [])];
  }, [customers]);

  if (items.length === 0) {
    return (
      <View style={{ paddingVertical: 16, alignItems: "center" }}>
        <Text style={{ color: "#667085" }}>Müşteri bulunamadı</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ maxHeight: 320, marginTop: 4 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {items.map((c) => {
        const isSel = c.id === selectedId;
        return (
          <TouchableOpacity
            key={c.id}
            // Her isme dokununca doğrudan seç
            onPress={() => onSelect(c.id)}
            activeOpacity={0.6}
            style={{
              minHeight: 56,
              justifyContent: "center",
              paddingHorizontal: 12,
              borderRadius: 10,
              // Kırmızı vurgu kaldırıldı; sadece seçili olan hafifçe belirtilir
              backgroundColor: isSel ? "rgba(13,148,136,0.08)" : "transparent",
            }}
          >
            <Text style={{ fontWeight: "900" }}>{c.name ?? "-"}</Text>
            <Text style={{ color: "#667085", fontSize: 12 }}>
              {c.phone ?? ""}
              {c.phone && c.info ? " • " : ""}
              {c.info ?? ""}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}


// ─── CustomerPickerModal ──────────────────────────────────────────────────────

type ModalProps = {
  visible: boolean;
  customers: CustomerDto[];
  isLoading: boolean;
  search: string;
  initialId: string | null;
  onSearchChange: (v: string) => void;
  onSelect: (id: string) => void;
  onCancel: () => void;
};

export function CustomerPickerModal({
  visible,
  customers,
  isLoading,
  search,
  initialId,
  onSearchChange,
  onSelect,
  onCancel,
}: ModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1, justifyContent: "flex-end" }}
        >
        
        {/* Arkadaki boş (karanlık) alana tıklandığında iptal et */}
        <TouchableOpacity 
          style={StyleSheet.absoluteFillObject} 
          activeOpacity={1} 
          onPress={onCancel} 
        >
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)" }} />
        </TouchableOpacity>

        <View
          style={{
            backgroundColor: "white",
            borderRadius: 24,
            padding: 16,
            // İçeriğin touch eventlerinin arkaya geçmemesi için
            //Dokunma olayı bu view'ı delip geçer gibi ama box-none yaparak sadece içindeki öğelerin dokunulabilir olmasını sağlıyoruz
            pointerEvents: "box-none"
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "900", marginBottom: 10 }}>
            Müşteri Seç
          </Text>

          <TextInput
            value={search}
            onChangeText={onSearchChange}
            placeholder="Ara..."
            style={INPUT_STYLE}
          />

          {isLoading ? (
            <View style={{ paddingVertical: 16, alignItems: "center" }}>
              <ActivityIndicator />
              <Text style={{ marginTop: 8, color: "#667085" }}>Yükleniyor...</Text>
            </View>
          ) : (
            <CustomerList
              customers={customers}
              selectedId={initialId}
              onSelect={onSelect}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}