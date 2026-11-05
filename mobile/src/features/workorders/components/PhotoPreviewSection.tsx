import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { type RNFile } from "../api/workorders.api";

type Props = {
  files: RNFile[];
  onPreview: (index: number) => void;
};

export function PhotoPreviewSection({ files, onPreview }: Props) {
  return (
    <View style={{ gap: 10 }}>
      <Text style={{ fontWeight: "800" }}>Fotoğraflar ({files.length})</Text>

      {!files.length ? (
        <Text style={{ color: "#98A2B3" }}>Henüz fotoğraf eklenmedi.</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {files.map((file, index) => (
              <TouchableOpacity
                key={`${file.uri}-${index}`}
                onPress={() => onPreview(index)}
              >
                <Image
                  source={{ uri: file.uri }}
                  style={{ width: 64, height: 64, borderRadius: 12, backgroundColor: "#eee" }}
                />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}