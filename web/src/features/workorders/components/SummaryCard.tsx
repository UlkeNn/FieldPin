import { Typography } from "@mui/material";
import GlassPaper from "../../../components/GlassPaper";

interface SummaryCardProps {
  title: string;
  value: string;
  hint?: string;
}

/**
 * Harita sayfasındaki özet kartı (toplam iş, mesafe, seçili çalışan).
 */
export default function SummaryCard({ title, value, hint }: SummaryCardProps) {
  return (
    <GlassPaper sx={{ p: 2 }}>
      <Typography
        fontSize={13}
        sx={{ color: "rgba(255,255,255,0.85)", mb: 0.5 }}
      >
        {title}
      </Typography>
      <Typography variant="h5" fontWeight={800} sx={{ color: "white" }}>
        {value}
      </Typography>
      {hint && (
        <Typography fontSize={11} sx={{ color: "rgba(255,255,255,0.6)", mt: 0.5 }}>
          {hint}
        </Typography>
      )}
    </GlassPaper>
  );
}
