//app/(tabs)/create.tsx
import { ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useWorkOrderCreateViewModel } from "@/src/features/workorders/viewModel/useWorkOrderCreateViewModel";
import { SystemTypeSelector }   from "@/src/features/workorders/components/SystemTypeSelector";
import { JobTypeSelector }      from "@/src/features/workorders/components/JobTypeSelector";
import { ObjectRow }            from "@/src/features/workorders/components/ObjectRow";
import { ObjectCard }           from "@/src/features/workorders/components/ObjectCard";
import { MultiSlotCard }        from "@/src/features/workorders/components/MultiSlotCard";
import { PhotoViewerModal }     from "@/src/features/workorders/components/PhotoViewerModal";
import { CustomerPickerModal }  from "@/src/features/workorders/components/CustomerPickerModal";
import { QrScannerModal }       from "@/src/features/workorders/components/QrScannerModal";
import { PlateScannerModal }    from "@/src/features/workorders/components/PlateScannerModal";
import { COLORS, INPUT_STYLE }  from "@/src/lib/theme";
import { SystemType }           from "@/src/features/workorders/types/workorder.enums";
import { makeCamSlot }          from "@/src/features/workorders/hooks/useMultiObjectForm";

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
} from "react-native-reanimated";
import { useCallback} from "react";
import { useFocusEffect } from "expo-router";

export default function CreateWorkOrderScreen() {
  const vm = useWorkOrderCreateViewModel();
  const { multiForm, isReplacement, systemType, viewer } = vm;
//Logo döndürme için____________________
  const rotation = useSharedValue(90);
  useFocusEffect(
  useCallback(() => {
    rotation.value = 90;                                         // her açılışta 90° yatık başla
    rotation.value = withDelay(1, withSpring( 0, { damping: 12, stiffness: 200 , mass: 2 })); // 0°'de düz biter. Ayarlar: sertlik, ağırlık vs
  }, [])
);

    const logoStyle = useAnimatedStyle(() => ({
      transform: [{ rotate: `${rotation.value}deg` }],
  }));
//-----------------------------------------
  const vehiclePlaceholder = systemType === SystemType.System2 ? "Tanım No" : "Araç Plaka";
  // Sistem 1 → "Araç": QR yerine plaka tanıma. Sistem 2 → "Tanım": klasik QR.
  const isVehiclePlate = systemType === SystemType.System1;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.BGCOLOR }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 130 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Başlık + Logo ──────────────────────────────────────────── */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ fontSize: 28, fontWeight: "800" }}>Yeni İş Oluştur</Text>
          <Animated.Image
            source={require("../../assets/topLogoRot.png")}
            style={[{ width: 40, height: 40 }, logoStyle]}
            resizeMode="contain"
          />
        </View>

        {/* Talep bağlantısı — talep detayından "İş Emri Oluştur" ile gelindiyse görünür */}
        {vm.linkedRequest && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: "#EEF4FF",
              borderRadius: 10,
              paddingVertical: 10,
              paddingHorizontal: 12,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 1 }}>
              <Ionicons name="link-outline" size={16} color={COLORS.blue} />
              <Text style={{ color: COLORS.blue, fontWeight: "700", flexShrink: 1 }} numberOfLines={1}>
                {vm.linkedRequest.requestNo} talebine bağlı
              </Text>
            </View>
            <TouchableOpacity onPress={vm.clearLink} hitSlop={8}>
              <Ionicons name="close" size={18} color={COLORS.blue} />
            </TouchableOpacity>
          </View>
        )}

        {/* Sistem tipi */}
        <SystemTypeSelector
          value={vm.systemType}
          onChange={(v) => vm.headerForm.setValue("systemType", v)}
        />

        {/* İş tipi */}
        <JobTypeSelector
          value={vm.jobType}
          onChange={(v) => vm.headerForm.setValue("jobType", v)}
        />

        {/* Müşteri */}
        <View style={{ gap: 6 }}>
          <Text style={{ fontWeight: "700" }}>Müşteri</Text>
          <TouchableOpacity
            onPress={vm.customer.openModal}
            style={{ borderWidth: 1, borderColor: "#BFC7D1", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: "white" }}
          >
            <Text style={{ fontWeight: "800", color: "#111" }}>{vm.customer.label}</Text>
            {!vm.customer.isOther && vm.customer.selected && (
              <Text style={{ marginTop: 4, color: "#667085" }}>
                {vm.customer.selected.phone ?? ""}
                {vm.customer.selected.phone && vm.customer.selected.info ? " • " : ""}
                {vm.customer.selected.info ?? ""}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {vm.customer.isOther && (
          <View style={{ gap: 6 }}>
            <Text style={{ fontWeight: "700" }}>Diğer (Müşteri Detayı)</Text>
            <TextInput
              value={vm.customer.otherText}
              onChangeText={vm.customer.setOtherText}
              placeholder="Müşteri adı / lokasyon vb."
              style={INPUT_STYLE}
            />
          </View>
        )}

        {/* Notlar */}
        <View style={{ gap: 6 }}>
          <Text style={{ fontWeight: "700" }}>Notlar</Text>
          <TextInput
            value={vm.headerForm.watch("notes")}
            onChangeText={(v) => vm.headerForm.setValue("notes", v)}
            placeholder="Yeni montaj için kontroller..."
            multiline
            style={INPUT_STYLE}
          />
        </View>

        {/* Arıza alanları */}
        {vm.isFault && (
          <>
            <View style={{ gap: 6 }}>
              <Text style={{ fontWeight: "700" }}>Arıza Sebebi</Text>
              <TextInput
                value={vm.headerForm.watch("faultCause")}
                onChangeText={(v) => vm.headerForm.setValue("faultCause", v)}
                placeholder="Varsa arıza sebebi..."
                style={INPUT_STYLE}
              />
            </View>
            <View style={{ gap: 6 }}>
              <Text style={{ fontWeight: "700" }}>Çözüm</Text>
              <TextInput
                value={vm.headerForm.watch("faultResolution")}
                onChangeText={(v) => vm.headerForm.setValue("faultResolution", v)}
                placeholder="Varsa yapılan işlem / çözüm..."
                style={INPUT_STYLE}
              />
            </View>
          </>
        )}

        {/* ── Araç / Tanım ──────────────────────────────────────────────── */}
        <ObjectCard title={systemType === SystemType.System2 ? "Tanım" : "Araç"} accentColor={COLORS.primary}>
          <ObjectRow
            isReplacement={isReplacement}
            placeholder={vehiclePlaceholder}
            entry={multiForm.vehicle}
            onSetId={(role, v) => multiForm.setId("vehicle", 0, role, v)}
            onCamera={(role) => vm.openCamera("vehicle", 0, role)}
            onPreview={(role, i) => vm.openViewer("vehicle", 0, role, i)}
            scanType={isVehiclePlate ? "plate" : "qr"}
            onQr={(role) => vm.qr.open(makeCamSlot("vehicle", 0, role))}
            onPlate={(role) => vm.plate.open(makeCamSlot("vehicle", 0, role))}
          />
        </ObjectCard>

        {/* ── Cihaz ─────────────────────────────────────────────────────── */}
        <ObjectCard
          title="Cihaz"
          accentColor="#2D6BE4"
          onAdd={() => multiForm.addItem("device")}
          addLabel="Cihaz Ekle"
          addBg="#EEF3FB"
        >
          <View style={{ gap: 10 }}>
            {multiForm.devices.map((dev, idx) => (
              <MultiSlotCard
                key={`dev-${idx}`}
                label={multiForm.devices.length > 1 ? `Cihaz ${idx + 1}` : undefined}
                labelColor="#2D6BE4"
                isSingle={multiForm.devices.length === 1}
                bg="#F8FAFF"
                borderColor="#D6E4FF"
                onRemove={multiForm.devices.length > 1 ? () => multiForm.removeItem("device", idx) : undefined}
              >
                <ObjectRow
                  isReplacement={isReplacement}
                  placeholder="Cihaz ID"
                  entry={dev}
                  onSetId={(role, v) => multiForm.setId("device", idx, role, v)}
                  onCamera={(role) => vm.openCamera("device", idx, role)}
                  onQr={(role) => vm.qr.open(makeCamSlot("device", idx, role))}
                  onPreview={(role, i) => vm.openViewer("device", idx, role, i)}
                />
              </MultiSlotCard>
            ))}
          </View>
        </ObjectCard>

        {/* ── Sensör ────────────────────────────────────────────────────── */}
        <ObjectCard
          title="Sensör"
          accentColor="#0E9F6E"
          onAdd={() => multiForm.addItem("sensor")}
          addLabel="Sensör Ekle"
          addBg="#ECFDF5"
        >
          <View style={{ gap: 10 }}>
            {multiForm.sensors.map((sen, idx) => (
              <MultiSlotCard
                key={`sen-${idx}`}
                label={multiForm.sensors.length > 1 ? `Sensör ${idx + 1}` : undefined}
                labelColor="#0E9F6E"
                isSingle={multiForm.sensors.length === 1}
                bg="#F0FDF9"
                borderColor="#A7F3D0"
                onRemove={multiForm.sensors.length > 1 ? () => multiForm.removeItem("sensor", idx) : undefined}
              >
                <ObjectRow
                  isReplacement={isReplacement}
                  placeholder="Sensör ID"
                  entry={sen}
                  onSetId={(role, v) => multiForm.setId("sensor", idx, role, v)}
                  onCamera={(role) => vm.openCamera("sensor", idx, role)}
                  onQr={(role) => vm.qr.open(makeCamSlot("sensor", idx, role))}
                  onPreview={(role, i) => vm.openViewer("sensor", idx, role, i)}
                />
              </MultiSlotCard>
            ))}
          </View>
        </ObjectCard>
      </ScrollView>

      {/* ── Kaydet butonu ──────────────────────────────────────────────── */}
      <View style={{ position: "absolute", left: 16, right: 16, bottom: 16 }}>
        <TouchableOpacity
          disabled={vm.submitting}
          onPress={vm.finalize}
          style={{ padding: 14, borderRadius: 12, backgroundColor: COLORS.primary, opacity: vm.submitting ? 0.7 : 1 }}
        >
          <Text style={{ textAlign: "center", color: "white", fontWeight: "900" }}>
            {vm.submitting ? "Kaydediliyor..." : "KAYDET VE GÖNDER"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Modallar ───────────────────────────────────────────────────── */}
      <CustomerPickerModal
        visible={vm.customer.open}
        customers={vm.customer.filtered}
        isLoading={vm.customer.isLoading}
        search={vm.customer.search}
        initialId={vm.customer.wheelInitialId}
        onSearchChange={vm.customer.setSearch}
        onSelect={vm.customer.select}
        onCancel={vm.customer.closeModal}
      />

      <QrScannerModal
        visible={vm.qr.visible}
        onClose={vm.qr.close}
        onScanned={vm.qr.handleScan}
      />

      <PlateScannerModal
        visible={vm.plate.visible}
        busy={vm.plate.busy}
        detected={vm.plate.detected}
        error={vm.plate.error}
        onClose={vm.plate.close}
        onCapture={vm.plate.recognize}
        onConfirm={vm.plate.confirm}
        onRetry={vm.plate.reset}
      />

      <PhotoViewerModal
        visible={viewer.visible}
        files={viewer.files}
        selectedIndex={viewer.index}
        onClose={viewer.close}
        onSelect={viewer.setIndex}
        onDelete={viewer.askDelete}
      />
    </SafeAreaView>
  );
}
