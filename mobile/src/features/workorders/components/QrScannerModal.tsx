import { Modal, Text, TouchableOpacity, View } from "react-native";
import { CameraView } from "expo-camera";

type Props = {
  visible: boolean;
  onClose: () => void;
  onScanned: (data: string) => void;
};

export function QrScannerModal({ visible, onClose, onScanned }: Props) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: "black" }}>
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          active={visible}
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={(result) => onScanned(result.data)}
        />

        <View style={{ position: "absolute", top: 50, left: 16, right: 16 }}>
          <TouchableOpacity
            onPress={onClose}
            style={{
              padding: 12,
              borderRadius: 12,
              backgroundColor: "rgba(255,255,255,0.9)",
            }}
          >
            <Text style={{ textAlign: "center", fontWeight: "900" }}>Kapat</Text>
          </TouchableOpacity>

          <Text style={{ marginTop: 10, color: "white", textAlign: "center" }}>
            {"Qr'ı kameraya göster — ID otomatik dolacak"}
          </Text>
        </View>
      </View>
    </Modal>
  );
}