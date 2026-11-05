import { Box, Typography } from "@mui/material";
import type { WorkOrderObjectDto } from "../../../api/workorders";
import ObjectCard from "./ObjectCard";

interface RoleSectionProps {
  title: string;
  items: WorkOrderObjectDto[];
  onPhotoClick: (url: string) => void;
}

/**
 * Eski / Yeni nesneleri başlık altında listeleyen bölüm.
 * Yer değişikliği işlerinde kullanılır.
 */
export default function RoleSection({
  title,
  items,
  onPhotoClick,
}: RoleSectionProps) {
  return (
    <Box sx={{ display: "grid", gap: 1 }}>
      <Typography fontWeight={800}>{title}</Typography>

      {items.length === 0 ? (
        <Typography sx={{ color: "#667085" }}>Kayıt yok</Typography>
      ) : (
        items.map((o) => (
          <ObjectCard key={o.id} object={o} onPhotoClick={onPhotoClick} />
        ))
      )}
    </Box>
  );
}
