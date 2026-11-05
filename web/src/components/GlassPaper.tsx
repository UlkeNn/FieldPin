import { Paper, type PaperProps } from "@mui/material";
import { glassPaperSx, glassPaperStrongSx } from "../theme/glass";

type GlassVariant = "default" | "strong";

interface GlassPaperProps extends Omit<PaperProps, "variant"> {
  /** "default": standart cam | "strong": daha opak (dashboard kartları) */
  glassVariant?: GlassVariant;
}

/**
 * Cam (frosted) görünümlü Paper.
 * Kullanım:
 *   <GlassPaper sx={{ p: 2 }}>içerik</GlassPaper>
 *   <GlassPaper glassVariant="strong" sx={{ p: 2 }}>vurgu kartı</GlassPaper>
 */
export default function GlassPaper({
  glassVariant = "default",
  sx,
  children,
  ...rest
}: GlassPaperProps) {
  const baseSx = glassVariant === "strong" ? glassPaperStrongSx : glassPaperSx;

  return (
    <Paper
      {...rest}
      elevation={0}
      sx={[
        baseSx,
        // sx prop'u array ya da object olabilir, ikisini de destekle
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {children}
    </Paper>
  );
}
