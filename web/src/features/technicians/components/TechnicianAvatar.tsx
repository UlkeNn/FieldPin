// src/features/technicians/components/TechnicianAvatar.tsx
import { useState } from "react";
import { Avatar, Dialog, Box, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

type Props = {
  src?: string | null;
  username?: string | null;
  size?: number;
  enablePreview?: boolean; // Yeni eklenen prop
};

function initialsOf(username?: string | null): string {
  if (!username) return "?";
  const cleaned = username.trim();
  if (cleaned.length === 0) return "?";

  const parts = cleaned.split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return cleaned.slice(0, 2).toUpperCase();
}

export function TechnicianAvatar({ src, username, size = 36, enablePreview = false }: Props) {
  const [open, setOpen] = useState(false);
  const initials = initialsOf(username);

  // Sadece src doluysa ve preview istenmişse tıklanabilir yapıyoruz
  const isClickable = enablePreview && Boolean(src);

  return (
    <>
      <Avatar
        src={src ?? undefined}
        alt={username ?? "Avatar"}
        onClick={isClickable ? () => setOpen(true) : undefined}
        sx={{
          width: size,
          height: size,
          bgcolor: "primary.main",
          color: "white",
          fontWeight: 800,
          fontSize: Math.round(size * 0.4),
          cursor: isClickable ? "pointer" : "default", // Sadece tıklanabilirse imleç değişsin
          transition: isClickable ? "opacity 0.2s" : "none",
          "&:hover": isClickable ? { opacity: 0.8 } : {},
        }}
      >
        {initials}
      </Avatar>

      {/* Lightbox / Preview Dialog */}
      {isClickable && (
        <Dialog
          open={open}
          onClose={() => setOpen(false)}
          maxWidth="md"
          PaperProps={{
            sx: {
              backgroundColor: "transparent", // Modal'ın kendi beyaz arka planını kaldırır
              boxShadow: "none",
              overflow: "hidden",
            },
          }}
        >
          <Box sx={{ position: "relative" }}>
            <IconButton
              onClick={() => setOpen(false)}
              sx={{
                position: "absolute",
                top: 8,
                right: 8,
                color: "white",
                bgcolor: "rgba(0,0,0,0.5)",
                "&:hover": { bgcolor: "rgba(0,0,0,0.7)" },
              }}
            >
              <CloseIcon />
            </IconButton>
            <img
              src={src as string}
              alt={username ?? "Büyük Profil Fotoğrafı"}
              style={{
                maxWidth: "100%",
                maxHeight: "85vh", // Ekrana sığması için
                objectFit: "contain",
                display: "block",
                borderRadius: "8px",
              }}
            />
          </Box>
        </Dialog>
      )}
    </>
  );
}