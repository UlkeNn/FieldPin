import {
  Box,
  Button,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import type { CustomerDto } from "../../../api/customers";
import {
  REQUEST_PRIORITY,
  REQUEST_SOURCE,
  REQUEST_STATUS,
  requestPriorityLabel,
  requestSourceLabel,
  requestStatusLabel,
} from "../../../api/serviceRequests";
import type { Technician } from "../../../api/technicians";
import { JOB_TYPE, SYSTEM_TYPE, jobTypeLabel, systemTypeLabel } from "../../../api/workorders";
import { inputWhiteSx } from "../../../theme";

interface ServiceRequestFiltersProps {
  searchInput: string;
  setSearchInput: (v: string) => void;

  status: number | "";
  setStatus: (v: number | "") => void;
  priority: number | "";
  setPriority: (v: number | "") => void;
  source: number | "";
  setSource: (v: number | "") => void;
  systemType: number | "";
  setSystemType: (v: number | "") => void;
  jobType: number | "";
  setJobType: (v: number | "") => void;

  customerId: string;
  setCustomerId: (v: string) => void;
  customers: CustomerDto[];

  assignedUserId: string;
  setAssignedUserId: (v: string) => void;
  technicians: Technician[];

  unassigned: boolean;
  setUnassigned: (v: boolean) => void;
  overdueOnly: boolean;
  setOverdueOnly: (v: boolean) => void;

  fromDate: string;
  setFromDate: (v: string) => void;
  toDate: string;
  setToDate: (v: string) => void;

  sort: string;
  setSort: (v: string) => void;

  onNewClick: () => void;
}

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "-createdAt", label: "Oluşturma (Yeni → Eski)" },
  { value: "createdAt", label: "Oluşturma (Eski → Yeni)" },
  { value: "-priority", label: "Öncelik (Yüksek → Düşük)" },
  { value: "priority", label: "Öncelik (Düşük → Yüksek)" },
  { value: "-slaDueAt", label: "SLA (Yakın → Uzak)" },
  { value: "slaDueAt", label: "SLA (Uzak → Yakın)" },
];

/**
 * Servis Talepleri listesinin üstündeki arama + filtre grid'i.
 * Görünüm MapFilters.tsx desenini takip eder: sabit alan başına
 * value/setter prop çifti, tek bir responsive grid içinde.
 */
export default function ServiceRequestFilters({
  searchInput,
  setSearchInput,
  status,
  setStatus,
  priority,
  setPriority,
  source,
  setSource,
  systemType,
  setSystemType,
  jobType,
  setJobType,
  customerId,
  setCustomerId,
  customers,
  assignedUserId,
  setAssignedUserId,
  technicians,
  unassigned,
  setUnassigned,
  overdueOnly,
  setOverdueOnly,
  fromDate,
  setFromDate,
  toDate,
  setToDate,
  sort,
  setSort,
  onNewClick,
}: ServiceRequestFiltersProps) {
  return (
    <Box sx={{ display: "grid", gap: 2 }}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
        <TextField
          label="Ara (Talep No / Başlık / Açıklama / Müşteri)"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          fullWidth
          sx={inputWhiteSx}
        />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onNewClick}
          sx={{ flexShrink: 0 }}
        >
          Yeni Talep
        </Button>
      </Stack>

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: {
            xs: "1fr",
            sm: "1fr 1fr",
            md: "1fr 1fr 1fr 1fr",
          },
        }}
      >
        <FormControl size="small" sx={inputWhiteSx}>
          <InputLabel>Durum</InputLabel>
          <Select
            label="Durum"
            value={status}
            onChange={(e) => {
              const v = e.target.value;
              setStatus(String(v) === "" ? "" : Number(v));
            }}
          >
            <MenuItem value="">Tümü</MenuItem>
            {Object.values(REQUEST_STATUS).map((v) => (
              <MenuItem key={v} value={v}>
                {requestStatusLabel(v)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={inputWhiteSx}>
          <InputLabel>Öncelik</InputLabel>
          <Select
            label="Öncelik"
            value={priority}
            onChange={(e) => {
              const v = e.target.value;
              setPriority(String(v) === "" ? "" : Number(v));
            }}
          >
            <MenuItem value="">Tümü</MenuItem>
            {Object.values(REQUEST_PRIORITY).map((v) => (
              <MenuItem key={v} value={v}>
                {requestPriorityLabel(v)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={inputWhiteSx}>
          <InputLabel>Kaynak</InputLabel>
          <Select
            label="Kaynak"
            value={source}
            onChange={(e) => {
              const v = e.target.value;
              setSource(String(v) === "" ? "" : Number(v));
            }}
          >
            <MenuItem value="">Tümü</MenuItem>
            {Object.values(REQUEST_SOURCE).map((v) => (
              <MenuItem key={v} value={v}>
                {requestSourceLabel(v)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={inputWhiteSx}>
          <InputLabel>Sistem</InputLabel>
          <Select
            label="Sistem"
            value={systemType}
            onChange={(e) => {
              const v = e.target.value;
              setSystemType(String(v) === "" ? "" : Number(v));
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
            value={jobType}
            onChange={(e) => {
              const v = e.target.value;
              setJobType(String(v) === "" ? "" : Number(v));
            }}
          >
            <MenuItem value="">Tümü</MenuItem>
            <MenuItem value={JOB_TYPE.Montage}>{jobTypeLabel(JOB_TYPE.Montage)}</MenuItem>
            <MenuItem value={JOB_TYPE.Replace}>{jobTypeLabel(JOB_TYPE.Replace)}</MenuItem>
            <MenuItem value={JOB_TYPE.Fault}>{jobTypeLabel(JOB_TYPE.Fault)}</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={inputWhiteSx}>
          <InputLabel>Müşteri</InputLabel>
          <Select
            label="Müşteri"
            value={customerId}
            onChange={(e) => setCustomerId(String(e.target.value))}
            MenuProps={{ PaperProps: { sx: { maxHeight: 320 } } }}
          >
            <MenuItem value="">Tümü</MenuItem>
            {customers.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.name ?? c.id}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={inputWhiteSx}>
          <InputLabel>Atanan</InputLabel>
          <Select
            label="Atanan"
            value={assignedUserId}
            onChange={(e) => setAssignedUserId(String(e.target.value))}
            MenuProps={{ PaperProps: { sx: { maxHeight: 320 } } }}
          >
            <MenuItem value="">Tümü</MenuItem>
            {technicians.map((t) => (
              <MenuItem key={t.id} value={t.id}>
                {t.username}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          type="date"
          label="Başlangıç (Oluşturma)"
          size="small"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={inputWhiteSx}
        />

        <TextField
          type="date"
          label="Bitiş (Oluşturma)"
          size="small"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={inputWhiteSx}
        />

        <FormControl size="small" sx={inputWhiteSx}>
          <InputLabel>Sıralama</InputLabel>
          <Select label="Sıralama" value={sort} onChange={(e) => setSort(String(e.target.value))}>
            {SORT_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
        <FormControlLabel
          control={
            <Switch
              checked={unassigned}
              onChange={(e) => setUnassigned(e.target.checked)}
            />
          }
          label="Sadece atanmamış"
          sx={{ color: "white" }}
        />
        <FormControlLabel
          control={
            <Switch
              checked={overdueOnly}
              onChange={(e) => setOverdueOnly(e.target.checked)}
            />
          }
          label="Sadece SLA aşan"
          sx={{ color: "white" }}
        />
      </Box>
    </Box>
  );
}
