import { Box, CircularProgress } from "@mui/material";

interface LoadingCenterProps {
  py?: number;
  size?: number;
  /** Cam zemin üstündeyse "white"; varsayılan MUI primary */
  color?: "primary" | "white";
}

/**
 * Sayfa içinde ortalanmış yükleniyor göstergesi.
 */
export default function LoadingCenter({
  py = 4,
  size = 40,
  color = "primary",
}: LoadingCenterProps) {
  return (
    <Box sx={{ display: "flex", justifyContent: "center", py }}>
      <CircularProgress
        size={size}
        sx={color === "white" ? { color: "white" } : undefined}
      />
    </Box>
  );
}
