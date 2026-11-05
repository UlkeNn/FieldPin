import {
  Box,
  CircularProgress,
  Divider,
  Typography,
} from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import GlassPaper from "../../../components/GlassPaper";
import { glassColors, glassItemSx, glassScrollbarSx } from "../../../theme";
import type { WorkOrderMapPointDto } from "../../../api/map";
import { jobTypeLabel, systemTypeLabel } from "../../../api/workorders";
import { badgeColor } from "../mapUtils";

type SortedPoint = WorkOrderMapPointDto & { routeIndex: number };

interface RouteSidePanelProps {
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  sortedPoints: SortedPoint[];
  selectedPointId: string | null;
  onSelectPoint: (id: string) => void;
}

/**
 * Haritanın yanındaki sıralı işler paneli.
 */
export default function RouteSidePanel({
  isLoading,
  isError,
  error,
  sortedPoints,
  selectedPointId,
  onSelectPoint,
}: RouteSidePanelProps) {
  return (
    <GlassPaper
      sx={{
        p: 2,
        display: "flex",
        flexDirection: "column",
        maxHeight: 720,
      }}
    >
      <Typography fontWeight={800} sx={{ mb: 1, color: glassColors.text }}>
        Sıralı İşler
      </Typography>
      <Typography sx={{ color: glassColors.textSubtle, fontSize: 12, mb: 1 }}>
        Tarihe göre sıralı
      </Typography>
      <Divider sx={{ borderColor: glassColors.divider, mb: 1 }} />

      {isLoading && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 2 }}>
          <CircularProgress size={18} sx={{ color: "white" }} />
          <Typography fontSize={14} sx={{ color: glassColors.text }}>
            Yükleniyor…
          </Typography>
        </Box>
      )}

      {isError && (
        <Typography sx={{ color: glassColors.errorText, fontSize: 13 }}>
          Hata: {error?.message || "İstek başarısız"}
        </Typography>
      )}

      {!isLoading && !isError && sortedPoints.length === 0 && (
        <Typography sx={{ color: glassColors.textSubtle, fontSize: 14 }}>
          Bu filtrede iş bulunamadı.
        </Typography>
      )}

      {!isLoading && sortedPoints.length > 0 && (
        <Box
          sx={{
            overflowY: "auto",
            pr: 0.5,
            display: "flex",
            flexDirection: "column",
            gap: 0.75,
            ...glassScrollbarSx,
          }}
        >
          {sortedPoints.map((p) => {
            const total = sortedPoints.length;
            const color = badgeColor(p.routeIndex - 1, total);
            const isSelected = p.id === selectedPointId;
            return (
              <Box
                key={p.id}
                onClick={() => onSelectPoint(p.id)}
                sx={glassItemSx(isSelected)}
              >
                <Box
                  sx={{
                    flexShrink: 0,
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: color,
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: 12,
                    border: "2px solid white",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                  }}
                >
                  {p.routeIndex}
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography
                    fontSize={13}
                    fontWeight={700}
                    sx={{
                      color: glassColors.text,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {p.customerName?.trim() || "(Müşteri yok)"}
                  </Typography>
                  <Typography fontSize={11} sx={{ color: "rgba(255,255,255,0.78)" }}>
                    {new Date(p.createdAt).toLocaleString("tr-TR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {" • "}
                    {systemTypeLabel(p.systemType)} • {jobTypeLabel(p.jobType)}
                  </Typography>
                </Box>
                <LocationOnIcon
                  sx={{
                    color: isSelected ? "white" : glassColors.textFaint,
                    fontSize: 18,
                  }}
                />
              </Box>
            );
          })}
        </Box>
      )}
    </GlassPaper>
  );
}
