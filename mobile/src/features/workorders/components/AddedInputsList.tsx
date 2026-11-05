import { useMemo } from "react";
import { Image, ScrollView, Text, View } from "react-native";
import {WorkOrderObjectRole} from "../types/workorder.types";
import { type RNFile } from "../api/workorders.api";
import { type AddedObject } from "../types/workorder.types";
import { getObjectTypeLabel } from "../utils/labels";
// ─── ThumbnailStrip ───────────────────────────────────────────────────────────

function ThumbnailStrip({ files }: { files: RNFile[] }) {
  if (!files?.length) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {files.map((f, idx) => (
          <Image
            key={`${f.uri}-${idx}`}
            source={{ uri: f.uri }}
            style={{ width: 54, height: 54, borderRadius: 10, backgroundColor: "#eee" }}
          />
        ))}
      </View>
    </ScrollView>
  );
}

// ─── AddedObjectCard ──────────────────────────────────────────────────────────

function AddedObjectCard({
  item,
  title,
  systemType,
}: {
  item: AddedObject | null;
  title?: string;
  systemType: number;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#F8FAFC",
        borderRadius: 12,
        padding: 10,
        borderWidth: 1,
        borderColor: "#E4E7EC",
        minHeight: 96,
      }}
    >
      {!!title && (
        <Text style={{ fontWeight: "900", color: "#344054", marginBottom: 6 }}>{title}</Text>
      )}

      {item ? (
        <>
          <Text style={{ fontWeight: "900", fontSize: 15, color: "#101828" }}>
            {item.objectIdentifier}
          </Text>
          <Text style={{ marginTop: 4, color: "#667085", fontSize: 12 }}>
            {getObjectTypeLabel(item.objectType, systemType)} • {item.files?.length ?? 0} foto
          </Text>
          <ThumbnailStrip files={item.files} />
        </>
      ) : (
        <Text style={{ color: "#98A2B3", marginTop: 10 }}>Kayıt yok</Text>
      )}
    </View>
  );
}

// ─── AddedInputsList ──────────────────────────────────────────────────────────

type Props = {
  objects: AddedObject[];
  systemType: number;
};

export function AddedInputsList({ objects, systemType }: Props) {
  const isReplacementList = useMemo(
    () => objects.some((x) => x.role === WorkOrderObjectRole.Old || x.role === WorkOrderObjectRole.New),
    [objects]
  );

  const singleItems = useMemo(
    () => objects.filter((x) => x.role === WorkOrderObjectRole.Single),
    [objects]
  );

  const replacementRows = useMemo(() => {
    const olds = objects.filter((x) => x.role === WorkOrderObjectRole.Old);
    const news = objects.filter((x) => x.role === WorkOrderObjectRole.New);
    const size = Math.max(olds.length, news.length);
    return Array.from({ length: size }, (_, i) => ({
      key: `${olds[i]?.id ?? "old"}-${news[i]?.id ?? "new"}-${i}`,
      oldItem: olds[i] ?? null,
      newItem: news[i] ?? null,
    }));
  }, [objects]);

  if (!objects.length) return null;

  return (
    <View style={{ backgroundColor: "white", borderRadius: 12, padding: 12, gap: 12 }}>
      <Text style={{ fontWeight: "800", fontSize: 16 }}>
        Eklenen Girdiler ({objects.length})
      </Text>

      {isReplacementList
        ? replacementRows.map((row, index) => (
            <View
              key={row.key}
              style={{
                gap: 8,
                paddingBottom: 10,
                borderBottomWidth: index === replacementRows.length - 1 ? 0 : 1,
                borderBottomColor: "#EAECF0",
              }}
            >
              <Text style={{ fontWeight: "800", color: "#344054" }}>
                {index + 1}. Değişim
              </Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <AddedObjectCard item={row.oldItem} title="Eski" systemType={systemType} />
                <AddedObjectCard item={row.newItem} title="Yeni" systemType={systemType} />
              </View>
            </View>
          ))
        : singleItems.map((item, index) => (
            <View
              key={item.id}
              style={{
                gap: 8,
                paddingBottom: 10,
                borderBottomWidth: index === singleItems.length - 1 ? 0 : 1,
                borderBottomColor: "#EAECF0",
              }}
            >
              <Text style={{ fontWeight: "800", color: "#344054" }}>
                {index + 1}. Girdi
              </Text>
              <AddedObjectCard item={item} systemType={systemType} />
            </View>
          ))}
    </View>
  );
}