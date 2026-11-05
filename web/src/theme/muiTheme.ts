// ─────────────────────────────────────────────────────────────
//  MUI Teması (sadece renk paleti)
//  Yeni FieldPin logosu ve arka planlarına göre marka renkleri.
//  Butonlar, ikonlar, focus çizgileri rengini buradan alır.
// ─────────────────────────────────────────────────────────────
import { createTheme } from "@mui/material";

/**
 * Marka renkleri — logodaki teal pin, amber rota ve lacivert zemin.
 * Teal ana renk bilerek bir ton koyu: beyaz yazı ve beyaz dialog üzerinde okunur kalsın.
 */
export const brandColors = {
  teal: "#0D9488",
  tealLight: "#2DD4BF",
  tealDark: "#0F766E",
  amber: "#F5A623",
  amberDark: "#D98E0B",
  navy: "#0F1F3D",
} as const;

export const muiTheme = createTheme({
  palette: {
    primary: {
      main: brandColors.teal,
      light: brandColors.tealLight,
      dark: brandColors.tealDark,
      contrastText: "#fff",
    },
    secondary: {
      main: brandColors.amber,
      dark: brandColors.amberDark,
      contrastText: brandColors.navy,
    },
  },
});
