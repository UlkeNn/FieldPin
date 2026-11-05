import { useState } from "react";
import { Box, Button, TextField, Typography } from "@mui/material";
import { useLocation, useNavigate, type Location } from "react-router-dom";
import { login } from "../api/auth";
import { setToken } from "../api/session";
import { AxiosError } from "axios";
import bgImage from "../assets/bg-login.png";
import GlassPaper from "../components/GlassPaper";
import { inputWhiteSx } from "../theme";

import icon from "../assets/icon.png";


type ApiError = { message?: string };
type LocationState = { from?: Location };

export default function LoginPage() {
  const nav = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;
  const from = state?.from?.pathname ?? "/dashboard";

  const [username, setUsername] = useState(
    import.meta.env.VITE_DEV_USERNAME ?? ""
  );
  const [password, setPassword] = useState(
    import.meta.env.VITE_DEV_PASSWORD ?? ""
  );
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setErr(null);
    setLoading(true);
    try {
      const res = await login(username, password);

      if (!res.accessToken) {
        setErr("Token gelmedi. Backend login response'unu kontrol et.");
        return;
      }

      setToken(res.accessToken);
      nav(from, { replace: true });
    } catch (e: unknown) {
      const ax = e as AxiosError<ApiError>;
      setErr(ax.response?.data?.message ?? ax.message ?? "Login başarısız");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        width: "100%",
        margin: 0,
        display: "grid",
        placeItems: "center",
      }}
    >
      {/* BACKGROUND */}
      <Box
        sx={{
          position: "fixed",
          inset: 0,
          zIndex: -1,
          backgroundImage: `url(${bgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* ICON */}
      <Box
        component="img"
        src={icon}
        alt="FieldPin"
        sx={{
          position: "fixed",
          bottom: 16,
          right: 16,
          zIndex: 0,
          width: { xs: 56, md: 96 },
          height: { xs: 56, md: 96 },
          boxShadow: 3,
          pointerEvents: "none",
        }}
      />


      <GlassPaper sx={{ width: 420, p: 3 }}>
        <Typography
          variant="h5"
          fontWeight={900}
          mb={2}
          sx={{ color: "white" }}
        >
          FieldPin Admin Giriş
        </Typography>

        <Box
          component="form"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          sx={{ display: "grid", gap: 2 }}
        >
          <TextField
            label="Kullanıcı Adı"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
            sx={inputWhiteSx}
          />
          <TextField
            label="Şifre"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={inputWhiteSx}
          />

          {err && (
            <Typography sx={{ color: "#fecaca" }} fontSize={14}>
              {err}
            </Typography>
          )}

          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{ fontWeight: 700 }}
          >
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </Button>
        </Box>
      </GlassPaper>
    </Box>
  );
}