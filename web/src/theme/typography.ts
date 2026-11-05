import type { SxProps, Theme } from "@mui/material";

/**
 * Sayfa başlığı (h5 + 900 + beyaz + marginLeft 5).
 * 5 sayfada birebir aynı şekilde tekrarlanıyordu, tek yere taşındı.
 */
export const pageTitleSx: SxProps<Theme> = {
  color: "white",
  marginLeft: 5,
};

/**
 * Cam Paper içinde alt bölüm başlığı.
 */
export const sectionTitleSx: SxProps<Theme> = {
  color: "white",
  fontWeight: 800,
};
