import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  IconButton,
  Drawer,
  useMediaQuery,
  useTheme,
} from "@mui/material";

// Mevcut İkonlar
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";

// Menü ikonları
import DashboardIcon from "@mui/icons-material/Dashboard";
import EngineeringIcon from "@mui/icons-material/Engineering";
import PeopleIcon from "@mui/icons-material/People";
import AssignmentIcon from "@mui/icons-material/Assignment";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import MapIcon from "@mui/icons-material/Map";

import bg from "../assets/PageBG.png";
import icon from "../assets/icon.png";
import { logout } from "../api/auth";
import { clearSession } from "../api/session";

// Menü elemanları
const MENU_ITEMS = [
  { path: "/dashboard", label: "Gösterge Paneli", icon: <DashboardIcon /> },
  { path: "/technicians", label: "Çalışanlar", icon: <EngineeringIcon /> },
  { path: "/customers", label: "Müşteriler", icon: <PeopleIcon /> },
  { path: "/service-requests", label: "Servis Talepleri", icon: <SupportAgentIcon /> },
  { path: "/workorders", label: "Yapılan İşler", icon: <AssignmentIcon /> },
  { path: "/map", label: "Harita Görünümü", icon: <MapIcon /> },
];

const makeLinkStyle = (collapsed: boolean) => ({ isActive }: { isActive: boolean }) => ({
  padding: "12px",
  borderRadius: 10,
  textDecoration: "none",
  color: isActive ? "#ffffff" : "rgba(255,255,255,0.65)",
  background: isActive ? "rgba(255,255,255,0.15)" : "transparent",
  fontWeight: isActive ? 700 : 600,
  display: "flex",
  alignItems: "center",
  justifyContent: collapsed ? "center" : "flex-start",
  gap: "16px",
  overflow: "hidden",
  whiteSpace: "nowrap",
});

export default function Layout() {
  const navigate = useNavigate();
  const theme = useTheme();
  // md altı = mobil/tablet kabul ediyoruz
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Masaüstü: sidebar açık/dar. Mobil: drawer açık/kapalı.
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    clearSession();
    navigate("/login", { replace: true });
  };

  // Yalnızca masaüstünde daraltılmış mod söz konusu
  const collapsed = !isMobile && !desktopOpen;

  // Sidebar içeriği — hem masaüstü panelinde hem mobil drawer'da kullanılıyor
  const sidebarContent = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", p: 2 }}>
      {/* Üst kısım: Başlık + Burger */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          mb: 2,
          minHeight: 40,
        }}
      >
        <Box
          sx={{
            fontWeight: 900,
            fontSize: 18,
            color: "white",
            display: collapsed ? "none" : "block",
          }}
        >
          FieldPin Admin
        </Box>
        <IconButton
          onClick={() =>
            isMobile ? setMobileOpen(false) : setDesktopOpen((v) => !v)
          }
          sx={{ color: "white" }}
        >
          <MenuIcon />
        </IconButton>
      </Box>

      {/* Menü Linkleri */}
      <Box sx={{ display: "grid", gap: 1 }}>
        {MENU_ITEMS.map((item) => (
          <NavLink
            to={item.path}
            style={makeLinkStyle(collapsed)}
            key={item.path}
            onClick={() => isMobile && setMobileOpen(false)}
          >
            <Box sx={{ display: "flex", minWidth: 24, justifyContent: "center" }}>
              {item.icon}
            </Box>
            {!collapsed && <Box>{item.label}</Box>}
          </NavLink>
        ))}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100dvh" }}>
      {/* Sabit arka plan katmanı */}
      <Box
        sx={{
          position: "fixed",
          inset: 0,
          zIndex: -1,
          backgroundImage: `url(${bg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* Sağ alt köşe proje iconu — küçük ekranda gizli, içeriği kapatmasın */}
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

      {/* Mobil burger — drawer'ı açar */}
      {isMobile && (
        <IconButton
          onClick={() => setMobileOpen(true)}
          sx={{
            position: "fixed",
            top: 12,
            left: 12,
            zIndex: 1200,
            color: "white",
            backgroundColor: "rgba(0,0,0,0.35)",
            backdropFilter: "blur(8px)",
            "&:hover": { backgroundColor: "rgba(0,0,0,0.5)" },
          }}
        >
          <MenuIcon />
        </IconButton>
      )}

      {/* Çıkış Butonu — mobilde sadece ikon */}
      <Button
        onClick={handleLogout}
        variant="contained"
        color="secondary"
        startIcon={<LogoutIcon />}
        sx={{
          position: "fixed",
          top: 12,
          right: 12,
          zIndex: 1200,
          // Çıkış, teal aksiyon butonlarından ayrışsın diye koyu turuncu
          bgcolor: "secondary.dark",
          "&:hover": { bgcolor: "#B87508" },
          fontWeight: 700,
          borderRadius: 3,
          textTransform: "none",
          minWidth: { xs: 0, sm: "auto" },
          "& .MuiButton-startIcon": { mr: { xs: 0, sm: 1 } },
        }}
      >
        <Box component="span" sx={{ display: { xs: "none", sm: "inline" }, zIndex: 1 }}>
          Çıkış Yap
        </Box>
      </Button>

      {/* MASAÜSTÜ SIDEBAR — artık tam yükseklikte, alt boşluk yok */}
      {!isMobile && (
        <Box
          sx={{
            width: desktopOpen ? 260 : 88,
            flexShrink: 0,
            transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            m: 2,
            borderRadius: 4,
            backgroundColor: "rgba(255,255,255,0.08)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.2)",
            position: "sticky",
            top: 16,
            alignSelf: "flex-start",
            height: "calc(100dvh - 32px)", // viewport yüksekliği kadar dolar
            overflow: "hidden",
          }}
        >
          {sidebarContent}
        </Box>
      )}

      {/* MOBİL DRAWER — sidebar overlay olarak açılır, içeriği itmez */}
      <Drawer
        anchor="left"
        open={isMobile && mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          "& .MuiDrawer-paper": {
            width: 260,
            border: "none",
            backgroundColor: "rgba(20,20,30,0.92)",
            backdropFilter: "blur(12px)",
            color: "white",
            zIndex: 1200,
          },
        }}
      >
        {sidebarContent}
      </Drawer>
	
      {/* Main */}
      <Box sx={{ flex: 1, p: 3, pl: 6 }}>
        <Outlet />
      </Box>
    </Box>
  );
}