import { useMemo, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  Drawer,
  FormControl,
  InputLabel,
  MenuItem,
  Modal,
  Select,
  Stack,
  Typography,
  useMediaQuery,// mobil için
  useTheme,//mobil içinn

} from "@mui/material";
import { useTechnicians } from "../features/technicians/useTechnicians";
import { useWorkOrdersByTech } from "../features/workorders/useWorkOrdersByTech";
import { useWorkOrder } from "../features/workorders/useWorkOrder";
import { TechnicianAvatar } from "../features/technicians/components/TechnicianAvatar";
import WorkOrderDetail from "../features/workorders/components/WorkOrderDetail";
import type { Technician } from "../api/technicians";
import { jobTypeLabel } from "../api/workorders";
import GlassPaper from "../components/GlassPaper";
import PageHeader from "../components/PageHeader";
import { inputWhiteSx, glassColors, glassItemSx } from "../theme";
import { isTechnician } from "../utils/roles";

const PAGE_SIZE = 15;

export default function WorkOrdersPage() {
  const techsQ = useTechnicians();

  const techOptions = useMemo(
    () => (techsQ.data ?? []).filter((t) => isTechnician(t.role)),
    [techsQ.data]
  );

  const technicianMap = useMemo(() => {
    const map = new Map<string, Technician>();
    for (const t of techOptions) {
      map.set(t.id, t);
    }
    return map;
  }, [techOptions]);

  const [technicianId, setTechnicianId] = useState<string>("");
  const [page, setPage] = useState(1);

  const effectiveTechnicianId = technicianId || techOptions[0]?.id || "";

  const listQ = useWorkOrdersByTech(effectiveTechnicianId, page, PAGE_SIZE);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const detailQ = useWorkOrder(selectedId);

  const [photoOpen, setPhotoOpen] = useState(false);
  const [url, setUrl] = useState<string | null>(null);

  const paged = listQ.data;
  const items = paged?.items ?? [];
  const totalPages = paged?.totalPages ?? 0;
  const totalCount = paged?.totalCount ?? 0;

  const theme = useTheme();

  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Box sx={{ display: "grid", p: 2 }}>
      <PageHeader>Yapılan İşler</PageHeader>

      <GlassPaper sx={{ p: 2, display: "grid", gap: 2 }}>
        {techsQ.isLoading && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <CircularProgress size={18} sx={{ color: "white" }} />
            <Typography sx={{ color: glassColors.text }}>
              Çalışanlar yükleniyor...
            </Typography>
          </Box>
        )}

        {techsQ.isError && (
          <Typography sx={{ color: glassColors.errorText }}>
            Çalışanlar alınamadı: {techsQ.error?.message || "Hata"}
          </Typography>
        )}

        {!techsQ.isLoading && !techsQ.isError && (
          <FormControl
            size="small"
            sx={{ maxWidth: 360, minWidth: 240, ...inputWhiteSx }}
            disabled={techOptions.length === 0}
          >
            <InputLabel>Çalışan</InputLabel>
            <Select
              label="Çalışan"
              value={effectiveTechnicianId}
              onChange={(e) => {
                setTechnicianId(String(e.target.value));
                setPage(1);
                setSelectedId(null);
              }}
              renderValue={(value) => {
                const t = technicianMap.get(String(value));
                if (!t) return "";
                return (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <TechnicianAvatar
                      src={t.avatarUrl}
                      username={t.username}
                      size={24}
                    />
                    <span>{t.username}</span>
                  </Stack>
                );
              }}
            >
              {techOptions.map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  <Stack direction="row" spacing={1.25} alignItems="center">
                    <TechnicianAvatar
                      src={t.avatarUrl}
                      username={t.username}
                      size={28}
                    />
                    <Box>
                      <Typography fontSize={14}>{t.username}</Typography>
                      <Typography fontSize={11} sx={{ color: "#667085" }}>
                        {t.id}
                      </Typography>
                    </Box>
                  </Stack>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {!effectiveTechnicianId ? (
          <Typography sx={{ color: glassColors.textSubtle }}>
            Önce çalışan seç.
          </Typography>
        ) : listQ.isLoading && !listQ.isPlaceholderData ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <CircularProgress size={18} sx={{ color: "white" }} />
            <Typography sx={{ color: glassColors.text }}>
              İşler yükleniyor...
            </Typography>
          </Box>
        ) : listQ.isError ? (
          <Typography sx={{ color: glassColors.errorText }}>
            Hata: {listQ.error?.message || "İstek başarısız"}
          </Typography>
        ) : items.length === 0 ? (
          <Typography sx={{ color: glassColors.textSubtle }}>
            Bu çalışanda iş yok.
          </Typography>
        ) : (
          <Box sx={{ display: "grid", gap: 1 }}>
            {items.map((w) => (
              <Box
                key={w.id}
                onClick={() => setSelectedId(w.id)}
                sx={{
                  ...glassItemSx(false),
                  p: 1.2,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 2,
                  opacity: listQ.isPlaceholderData ? 0.6 : 1,
                  transition: "opacity 0.15s, all .15s",
                }}
              >
                <Box>
                  <Typography fontWeight={900} sx={{ color: glassColors.text }}>
                    {w.customer?.name ? ` - ${w.customer.name} -    `  :  "(Diğer Müşteri) -    "}
                    {w.notes?.trim() ? `${w.notes}`  : " - "}
                  </Typography>
                  <Typography
                    sx={{ color: glassColors.textSubtle }}
                    fontSize={13}
                  >
                    {new Date(w.createdAt).toLocaleString()} •{" "}
                    {jobTypeLabel(w.jobType)} • Girdi: {w.objects?.length ?? 0}
                  </Typography>
                </Box>
                <Typography fontWeight={800} sx={{ color: glassColors.text }}>
                  Detay
                </Typography>
              </Box>
            ))}


            {/* ── Pagination Bar ────────────────────────── */}
            {totalPages > 1 && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  pt: 1.5,
                  mt: 0.5,
                  borderTop: `1px solid ${glassColors.divider}`,
                }}
              >
                <Typography
                  sx={{ color: glassColors.textSubtle }}
                  fontSize={13}
                >
                  Toplam {totalCount} iş • Sayfa {page}/{totalPages}
                </Typography>

                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    sx={{
                      color: "white",
                      borderColor: "rgba(255,255,255,0.4)",
                      "&:hover": { borderColor: "white" },
                    }}
                  >
                    ← ÖNCEKİ
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={page >= totalPages}
                    onClick={() =>
                      setPage((p) => Math.min(totalPages, p + 1))
                    }
                    sx={{
                      color: "white",
                      borderColor: "rgba(255,255,255,0.4)",
                      "&:hover": { borderColor: "white" },
                    }}
                  >
                    SONRAKİ →
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        )}
      </GlassPaper>

      <Drawer
        anchor={isMobile ? "bottom" : "right"}//mobilde alttan, masaüstünde sağdan açılacak
        open={!!selectedId}
        onClose={() => setSelectedId(null)}
        PaperProps={{ sx: { 
          width: isMobile ? "100%" : 620,
          height: isMobile ? "80vh" : "100%",
          //maxWidth: "100%", 
          p: 2,

          borderTopLeftRadius: isMobile ? 16 : 0,
          borderTopRightRadius: isMobile ? 16 : 0,
        } 
      }}
      >
        <Typography variant="h6" fontWeight={900}>
          İş Detayı
        </Typography>

        <Divider sx={{ my: 2 }} />

        {detailQ.isLoading && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <CircularProgress size={18} />
            <Typography>Detay yükleniyor...</Typography>
          </Box>
        )}

        {detailQ.isError && (
          <Typography color="error">
            Detay alınamadı: {detailQ.error?.message || "Hata"}
          </Typography>
        )}

        {detailQ.data && (
          <WorkOrderDetail
            wo={detailQ.data}
            technicianName={technicianMap.get(detailQ.data.technicianId)?.username}
            onPhotoClick={(photoUrl) => {
              setUrl(photoUrl);
              setPhotoOpen(true);
            }}
          />
        )}
      </Drawer>

      <Modal
        open={photoOpen}
        onClose={() => {
          setPhotoOpen(false);
          setUrl(null);
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            bgcolor: "white",
            p: 2,
            borderRadius: 2,
            outline: "none",
            maxWidth: "90vw",
            maxHeight: "90vh",
          }}
        >
          {url && (
            <Box
              component="img"
              src={url}
              alt="full"
              sx={{
                maxWidth: "86vw",
                maxHeight: "86vh",
                objectFit: "contain",
              }}
            />
          )}
        </Box>
      </Modal>
    </Box>
  );
}
