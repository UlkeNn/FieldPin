import { Box, Typography } from "@mui/material";
import type { WorkOrderObjectDto } from "../../../api/workorders";
import { normalizeObjectMedia, objectTypeLabel } from "../utils";

interface ObjectCardProps {
  object: WorkOrderObjectDto;
  onPhotoClick: (url: string) => void;
}

/**
 * Tek bir iş emri nesnesinin kartı (foto + bilgiler).
 */
export default function ObjectCard({ object, onPhotoClick }: ObjectCardProps) {
  const media = normalizeObjectMedia(object);

  return (
    <Box
      sx={{
        p: 1.2,
        border: "1px solid #E5E7EB",
        borderRadius: 2,
        display: "grid",
        gap: 1.2,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography fontWeight={900}>
          {objectTypeLabel(object.objectType)} • {object.objectIdentifier}
        </Typography>

        <Typography sx={{ color: "#667085" }} fontSize={13}>
          Eklenme: {new Date(object.createdAt).toLocaleString()}
        </Typography>
      </Box>

      {media.length > 0 ? (
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          {media.map((m) => (
            <Box
              key={m.id}
              component="img"
              src={m.url}
              alt={m.originalFileName || m.fileName || "object-media"}
              sx={{
                width: 84,
                height: 84,
                objectFit: "cover",
                borderRadius: 2,
                border: "1px solid #E5E7EB",
                cursor: "pointer",
              }}
              onClick={() => onPhotoClick(m.url)}
            />
          ))}
        </Box>
      ) : (
        <Typography sx={{ color: "#98A2B3" }} fontSize={12}>
          Foto yok
        </Typography>
      )}
    </Box>
  );
}
