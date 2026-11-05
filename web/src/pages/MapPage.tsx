import { useMemo, useState } from "react";
import { Box, CircularProgress } from "@mui/material";
import { useMapPoints } from "../features/workorders/useMapPoints";
import {
  WorkOrderLocationMap,
  haversineKm,
} from "../features/workorders/WorkOrderLocationMap";
import { useTechnicians } from "../features/technicians/useTechnicians";
import type { Technician } from "../api/technicians";

import GlassPaper from "../components/GlassPaper";
import PageHeader from "../components/PageHeader";
import MapFilters from "../features/workorders/components/MapFilters";
import SummaryCard from "../features/workorders/components/SummaryCard";
import RouteSidePanel from "../features/workorders/components/RouteSidePanel";

import {
  ISO_DAYS_AGO,
  TODAY_ISO,
  type QuickRange,
} from "../features/workorders/mapUtils";
import { isTechnician } from "../utils/roles";
import { glassColors } from "../theme";
import { Typography } from "@mui/material";

export const MapPage: React.FC = () => {
  // ── State ──────────────────────────────────────────────
  const [fromDate, setFromDate] = useState<string>(ISO_DAYS_AGO(6));
  const [toDate, setToDate] = useState<string>(TODAY_ISO());
  const [quickRange, setQuickRange] = useState<QuickRange>("7d");
  const [technicianId, setTechnicianId] = useState<string>("");
  const [systemType, setSystemType] = useState<number | undefined>(undefined);
  const [jobType, setJobType] = useState<number | undefined>(undefined);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);

  // ── Çalışanlar (aktif technician'lar) ──────────────────
  const techsQ = useTechnicians();
  const techOptions = useMemo(
    () => (techsQ.data ?? []).filter((t) => isTechnician(t.role) && t.isActive),
    [techsQ.data]
  );
  const technicianMap = useMemo(() => {
    const m = new Map<string, Technician>();
    for (const t of techOptions) m.set(t.id, t);
    return m;
  }, [techOptions]);

  // ── Veri ───────────────────────────────────────────────
  const {
    data: points = [],
    isLoading,
    isError,
    error,
  } = useMapPoints({
    fromDate,
    toDate,
    technicianId: technicianId || undefined,
    systemType,
    jobType,
  });

  // Tarihe göre sıralı liste (panel + rota için)
  const sortedPoints = useMemo(
    () =>
      [...points]
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
        .map((p, i) => ({ ...p, routeIndex: i + 1 })),
    [points]
  );

  // Toplam kuş uçuşu mesafe
  const totalDistanceKm = useMemo(() => {
    let sum = 0;
    for (let i = 1; i < sortedPoints.length; i++) {
      sum += haversineKm(
        sortedPoints[i - 1].latitude,
        sortedPoints[i - 1].longitude,
        sortedPoints[i].latitude,
        sortedPoints[i].longitude
      );
    }
    return sum;
  }, [sortedPoints]);

  const limitWarning = points.length >= 2000;

  return (
    <Box sx={{ p: 2, display: "grid", gap: 2 }}>
      <PageHeader sx={{ mb: 1 }}>Harita Görünümü</PageHeader>

      {/* ── FİLTRE PANELİ ────────────────────────────── */}
      <MapFilters
        fromDate={fromDate}
        toDate={toDate}
        setFromDate={setFromDate}
        setToDate={setToDate}
        quickRange={quickRange}
        setQuickRange={setQuickRange}
        technicianId={technicianId}
        setTechnicianId={setTechnicianId}
        techOptions={techOptions}
        technicianMap={technicianMap}
        systemType={systemType}
        setSystemType={setSystemType}
        jobType={jobType}
        setJobType={setJobType}
      />

      {/* ── ÖZET KARTLARI ────────────────────────────── */}
      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(3, 1fr)" },
        }}
      >
        <SummaryCard
          title="Toplam İş"
          value={isLoading ? "…" : String(sortedPoints.length)}
        />
        <SummaryCard
          title="Tahmini Toplam Mesafe"
          value={
            isLoading
              ? "…"
              : sortedPoints.length < 2
              ? "–"
              : `${totalDistanceKm.toFixed(1)} km`
          }
          hint="Düz hat (kuş uçuşu)"
        />
        <SummaryCard
          title="Seçilen Çalışan"
          value={
            technicianId
              ? technicianMap.get(technicianId)?.username ?? "—"
              : "Tümü"
          }
        />
      </Box>

      {limitWarning && (
        <GlassPaper sx={{ p: 1.5 }}>
          <Typography fontSize={13} sx={{ color: glassColors.warningText }}>
            ⚠ Sonuçlar 2000 nokta ile sınırlandı. Daha keskin sonuç için tarih
            aralığını veya çalışanı daraltın.
          </Typography>
        </GlassPaper>
      )}

      {/* ── HARİTA + YAN LİSTE ──────────────────────── */}
      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", md: "320px 1fr" },
          minHeight: 560,
        }}
      >
        <RouteSidePanel
          isLoading={isLoading}
          isError={isError}
          error={error as Error | null | undefined}
          sortedPoints={sortedPoints}
          selectedPointId={selectedPointId}
          onSelectPoint={setSelectedPointId}
        />

        <GlassPaper
          sx={{
            overflow: "hidden",
            position: "relative",
            minHeight: 560,
            p: 0,
          }}
        >
          {isLoading && (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                zIndex: 999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(255,255,255,0.6)",
              }}
            >
              <CircularProgress size={28} />
            </Box>
          )}
          <WorkOrderLocationMap
            points={points}
            selectedPointId={selectedPointId}
          />
        </GlassPaper>
      </Box>
    </Box>
  );
};

export default MapPage;
