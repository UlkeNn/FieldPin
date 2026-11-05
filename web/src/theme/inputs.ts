import type { SxProps, Theme } from "@mui/material";

/**
 * Cam (koyu) zemin üzerinde TextField / Select için beyaz görünüm.
 * MapPage'de tanımlanmıştı, oradan tekilleştirildi.
 */
export const inputWhiteSx: SxProps<Theme> = {
  "& .MuiOutlinedInput-root": {
    color: "white",
    "& fieldset": { borderColor: "rgba(255,255,255,0.4)" },
    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.7)" },
    "&.Mui-focused fieldset": { borderColor: "white" },
  },
  "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.85)" },
  "& .MuiInputLabel-root.Mui-focused": { color: "white" },
  "& .MuiSvgIcon-root": { color: "rgba(255,255,255,0.85)" },
};

/**
 * Cam üzerinde Chip stilleri — seçili / seçili değil için.
 * MapPage'deki hızlı aralık chip'leri için kullanılır.
 */
export const glassChipSx = (selected = false): SxProps<Theme> => ({
  fontWeight: 700,
  color: selected ? "#111827" : "white",
  backgroundColor: selected ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.12)",
  border: "1px solid rgba(255,255,255,0.3)",
  "&:hover": {
    backgroundColor: selected ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.22)",
  },
});
