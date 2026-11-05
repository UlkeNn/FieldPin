import { Box, Button, Typography } from "@mui/material";

export default function NotFoundPage() {
  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", bgcolor: "#F6F7FB" }}>
      <Box sx={{ textAlign: "center" }}>
        <Typography variant="h1" fontWeight={900} color="text.secondary">
          404 Bu sayfa sunucuda bulunamadı
        </Typography>
        <Typography variant="h6" mb={3}>
          Aradığınız sayfa bulunamadı.
        </Typography>
        <Button variant="contained" onClick={() => window.location.assign("/")}>
          Ana Sayfaya Dön
        </Button>
      </Box>
    </Box>
  );
}