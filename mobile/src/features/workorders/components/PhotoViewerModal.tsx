import { Image, Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { type RNFile } from "../api/workorders.api";

type Props = {
  visible: boolean;
  files: RNFile[];
  selectedIndex: number;
  onClose: () => void;
  onSelect: (index: number) => void;
  onDelete: (index: number) => void;
};

export function PhotoViewerModal({ visible, files, selectedIndex, onClose, onSelect, onDelete }: Props) {
  const selected = files[selectedIndex] ?? null;

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "black" }}>
        {/* Ana görüntü */}
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          {selected && (
            <Image
              source={{ uri: selected.uri }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="contain"
            />
          )}
        </View>

        {/* Alt şerit */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 24,
            backgroundColor: "rgba(0,0,0,0.85)",
            gap: 12,
          }}
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: "row", gap: 10 }}>
              {files.map((file, index) => {
                const isSelected = index === selectedIndex;
                return (
                  <TouchableOpacity
                    key={`${file.uri}-${index}`}
                    onPress={() => onSelect(index)}
                    style={{
                      width: 70,
                      height: 70,
                      borderRadius: 12,
                      overflow: "hidden",
                      borderWidth: isSelected ? 2 : 0,
                      borderColor: "white",
                    }}
                  >
                    <Image source={{ uri: file.uri }} style={{ width: "100%", height: "100%" }} />

                    {isSelected && (
                      <TouchableOpacity
                        onPress={() => onDelete(index)}
                        style={{
                          position: "absolute",
                          top: 6,
                          right: 6,
                          width: 26,
                          height: 26,
                          borderRadius: 13,
                          backgroundColor: "rgba(0,0,0,0.45)",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <FontAwesome name="trash-o" size={15} color="white" />
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          <TouchableOpacity
            onPress={onClose}
            style={{
              backgroundColor: "rgba(255,255,255,0.92)",
              paddingVertical: 14,
              borderRadius: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ fontWeight: "900" }}>Kapat</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}