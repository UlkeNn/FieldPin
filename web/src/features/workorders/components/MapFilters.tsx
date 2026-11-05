import {
  Box,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material";
import GlassPaper from "../../../components/GlassPaper";
import { glassChipSx, inputWhiteSx } from "../../../theme";
import { TechnicianAvatar } from "../../technicians/components/TechnicianAvatar";
import type { Technician } from "../../../api/technicians";
import { JOB_TYPE, SYSTEM_TYPE, systemTypeLabel } from "../../../api/workorders";
import { ISO_DAYS_AGO, TODAY_ISO, type QuickRange } from "../mapUtils";

interface MapFiltersProps {
  // Tarih
  fromDate: string;
  toDate: string;
  setFromDate: (v: string) => void;
  setToDate: (v: string) => void;
  quickRange: QuickRange;
  setQuickRange: (v: QuickRange) => void;

  // Çalışan
  technicianId: string;
  setTechnicianId: (id: string) => void;
  techOptions: Technician[];
  technicianMap: Map<string, Technician>;

  // Sistem / İş tipi
  systemType: number | undefined;
  setSystemType: (v: number | undefined) => void;
  jobType: number | undefined;
  setJobType: (v: number | undefined) => void;
}

/**
 * Harita sayfasındaki tüm filtreler (tarih chip'leri + 5'li grid).
 */
export default function MapFilters(props: MapFiltersProps) {
  const {
    fromDate,
    toDate,
    setFromDate,
    setToDate,
    quickRange,
    setQuickRange,
    technicianId,
    setTechnicianId,
    techOptions,
    technicianMap,
    systemType,
    setSystemType,
    jobType,
    setJobType,
  } = props;

  const setQuick = (r: QuickRange) => {
    setQuickRange(r);
    if (r === "today") {
      setFromDate(TODAY_ISO());
      setToDate(TODAY_ISO());
    } else if (r === "7d") {
      setFromDate(ISO_DAYS_AGO(6));
      setToDate(TODAY_ISO());
    } else if (r === "30d") {
      setFromDate(ISO_DAYS_AGO(29));
      setToDate(TODAY_ISO());
    }
  };

  const rangeChips: { v: QuickRange; label: string }[] = [
    { v: "today", label: "Bugün" },
    { v: "7d", label: "Son 7 Gün" },
    { v: "30d", label: "Son 30 Gün" },
    { v: "custom", label: "Özel Aralık" },
  ];

  return (
    <GlassPaper sx={{ p: 2, display: "grid", gap: 2 }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
        {rangeChips.map((c) => (
          <Chip
            key={c.v}
            label={c.label}
            onClick={() => setQuick(c.v)}
            sx={glassChipSx(quickRange === c.v)}
          />
        ))}
      </Box>

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: {
            xs: "1fr",
            sm: "1fr 1fr",
            md: "1fr 1fr 1.4fr 1fr 1fr",
          },
        }}
      >
        <TextField
          type="date"
          label="Başlangıç"
          size="small"
          value={fromDate}
          onChange={(e) => {
            setFromDate(e.target.value);
            setQuickRange("custom");
          }}
          InputLabelProps={{ shrink: true }}
          sx={inputWhiteSx}
        />
        <TextField
          type="date"
          label="Bitiş"
          size="small"
          value={toDate}
          onChange={(e) => {
            setToDate(e.target.value);
            setQuickRange("custom");
          }}
          InputLabelProps={{ shrink: true }}
          sx={inputWhiteSx}
        />

        <FormControl size="small" sx={inputWhiteSx}>
          <InputLabel>Çalışan</InputLabel>
          <Select
            label="Çalışan"
            value={technicianId}
            onChange={(e) => setTechnicianId(String(e.target.value))}
            MenuProps={{ PaperProps: { sx: { maxHeight: 320 } } }}
            renderValue={(value) => {
              const v = String(value);
              if (!v) return "Tümü";
              const t = technicianMap.get(v);
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
            <MenuItem value="">Tümü</MenuItem>
            {techOptions.map((t) => (
              <MenuItem key={t.id} value={t.id}>
                <Stack direction="row" spacing={1.25} alignItems="center">
                  <TechnicianAvatar
                    src={t.avatarUrl}
                    username={t.username}
                    size={28}
                  />
                  <span>{t.username}</span>
                </Stack>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={inputWhiteSx}>
          <InputLabel>Sistem</InputLabel>
          <Select
            label="Sistem"
            value={systemType ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              setSystemType(String(v) === "" ? undefined : Number(v));
            }}
          >
            <MenuItem value="">Tümü</MenuItem>
            <MenuItem value={SYSTEM_TYPE.System1}>{systemTypeLabel(SYSTEM_TYPE.System1)}</MenuItem>
            <MenuItem value={SYSTEM_TYPE.System2}>{systemTypeLabel(SYSTEM_TYPE.System2)}</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={inputWhiteSx}>
          <InputLabel>İş Tipi</InputLabel>
          <Select
            label="İş Tipi"
            value={jobType ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              setJobType(String(v) === "" ? undefined : Number(v));
            }}
          >
            <MenuItem value="">Tümü</MenuItem>
            <MenuItem value={JOB_TYPE.Montage}>Montaj</MenuItem>
            <MenuItem value={JOB_TYPE.Replace}>Değişim</MenuItem>
            <MenuItem value={JOB_TYPE.Fault}>Arıza</MenuItem>
          </Select>
        </FormControl>
      </Box>
    </GlassPaper>
  );
}
