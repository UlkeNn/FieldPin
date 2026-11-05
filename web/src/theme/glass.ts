// ─────────────────────────────────────────────────────────────
//  Cam (Glass / Frosted) Tasarım Token'ları
//  Tüm sayfalarda kullanılacak ortak saydam görünüm tanımları.
//  Tek doğruluk kaynağı burası - bunu değiştirince bütün sayfa
//  etkilenir.
// ─────────────────────────────────────────────────────────────
import type { SxProps, Theme } from "@mui/material";

/**
 * Standart cam Paper görünümü.
 * Sayfalardaki ana içerik kutuları için.
 */

export const glassPaperSx: SxProps<Theme> = {
  borderRadius: 4,
  backgroundColor: "rgba(255,255,255,0.15)",// Opaklık oranı ayarlanır
  backdropFilter: "blur(12px)",// kutular arkasındaki içeriği 12 piksel oranında bulandırır.
  WebkitBackdropFilter: "blur(12px)", // Safari // BURAYA BAK
  border: "1px solid rgba(255,255,255,0.30)",//camın sınırlarını vermek ve ışık yanasıması hissini vermek için
  color: "white",
  boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
};

/**
 * Daha opak cam (dashboard kartları gibi vurgu kartları için).
 */
export const glassPaperStrongSx: SxProps<Theme> = {
  borderRadius: 3,
  backgroundColor: "rgba(255,255,255,0.16)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  border: "1px solid rgba(255,255,255,0.28)",
  color: "white",
  boxShadow: "0 8px 24px rgba(0,0,0,0.20)",
};

/**
 * Cam Paper içinde liste item'ı.
 * Seçili/seçili değil durumları için.
 */
export const glassItemSx = (selected = false): SxProps<Theme> => ({
  cursor: "pointer",
  p: 1,
  borderRadius: 2,
  display: "flex",
  gap: 1.2,
  alignItems: "flex-start",
  backgroundColor: selected ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.06)",
  border: selected
    ? "1px solid rgba(255,255,255,0.55)"
    : "1px solid rgba(255,255,255,0.12)",
  "&:hover": { backgroundColor: "rgba(255,255,255,0.16)" },
  transition: "all .15s",
});

/**
 * Cam içerikte ince scrollbar (sıralı listeler gibi yerler için).
 */
export const glassScrollbarSx: SxProps<Theme> = {
  "&::-webkit-scrollbar": { width: 6 },
  "&::-webkit-scrollbar-thumb": {
    background: "rgba(255,255,255,0.3)",
    borderRadius: 4,
  },
};

/**
 * Cam üzerinde renk paleti — sıkça kullanılan beyaz tonları.
 * Renklerin ezberlenmesini önler.
 */
export const glassColors = {
  text: "white",
  textMuted: "rgba(255,255,255,0.85)",
  textSubtle: "rgba(255,255,255,0.70)",
  textFaint: "rgba(255,255,255,0.50)",
  divider: "rgba(255,255,255,0.18)",
  warningText: "#fde68a",
  errorText: "#fecaca",
} as const;
