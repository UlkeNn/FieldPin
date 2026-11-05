import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import type { CustomerDto } from "../../../api/customers";
import type {
  CreateServiceRequestRequest,
  ServiceRequestDetailDto,
  UpdateServiceRequestRequest,
} from "../../../api/serviceRequests";
import {
  REQUEST_PRIORITY,
  REQUEST_SOURCE,
  requestPriorityLabel,
  requestSourceLabel,
} from "../../../api/serviceRequests";
import type { Technician } from "../../../api/technicians";
import { JOB_TYPE, SYSTEM_TYPE, jobTypeLabel, systemTypeLabel } from "../../../api/workorders";
import { objectTypeLabel } from "../../workorders/utils";

interface ServiceRequestDialogProps {
  open: boolean;
  mode: "create" | "edit";
  initial?: ServiceRequestDetailDto | null;
  customers: CustomerDto[];
  technicians: Technician[];
  busy?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (
    payload: CreateServiceRequestRequest | UpdateServiceRequestRequest
  ) => void;
}

// ObjectType (deviceType) seçenekleri — objectTypeLabel ile aynı enum.
const DEVICE_TYPES = [1, 2, 3, 4, 99];

function toDateTimeLocalValue(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function fromDateTimeLocalValue(v: string): string | null {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

/**
 * Talep ekleme / düzenleme dialog'u.
 * CustomerDialog.tsx deseni: mode prop'u ile iki amaca hizmet eder,
 * alan başına controlled useState, şema kütüphanesi yok.
 */
export default function ServiceRequestDialog({
  open,
  mode,
  initial,
  customers,
  technicians,
  busy,
  error,
  onClose,
  onSubmit,
}: ServiceRequestDialogProps) {
  const isCreate = mode === "create";

  const [title, setTitle] = useState(() => initial?.title ?? "");
  const [description, setDescription] = useState(() => initial?.description ?? "");
  const [systemType, setSystemType] = useState<number | "">(() => initial?.systemType ?? "");
  const [jobType, setJobType] = useState<number | "">(() => initial?.jobType ?? "");
  const [priority, setPriority] = useState<number | "">(() => initial?.priority ?? "");
  // Admin panelinden açılan yeni talepler varsayılan olarak "Web" kaynaklı
  const [source, setSource] = useState<number | "">(() => initial?.source ?? REQUEST_SOURCE.Web);
  const [customerId, setCustomerId] = useState(() => initial?.customer?.id ?? "");
  const [deviceType, setDeviceType] = useState<number | "">(() => initial?.deviceType ?? "");
  const [deviceIdentifier, setDeviceIdentifier] = useState(() => initial?.deviceIdentifier ?? "");
  const [requesterName, setRequesterName] = useState(() => initial?.requesterName ?? "");
  const [requesterPhone, setRequesterPhone] = useState(() => initial?.requesterPhone ?? "");
  const [assignedUserId, setAssignedUserId] = useState("");
  const [addressText, setAddressText] = useState(() => initial?.addressText ?? "");
  const [latitude, setLatitude] = useState(() => (initial?.latitude != null ? String(initial.latitude) : ""));
  const [longitude, setLongitude] = useState(() => (initial?.longitude != null ? String(initial.longitude) : ""));
  const [slaDueAtUtc, setSlaDueAtUtc] = useState(() => toDateTimeLocalValue(initial?.slaDueAtUtc));
  const [rawPayload, setRawPayload] = useState(() => initial?.rawPayload ?? "");

  const effectiveSource = isCreate ? source : initial?.source;
  const isWhatsAppAi = effectiveSource === REQUEST_SOURCE.WhatsAppAi;

  const latLngError = useMemo(() => {
    const hasLat = latitude.trim() !== "";
    const hasLng = longitude.trim() !== "";
    if (hasLat !== hasLng) return "Enlem ve boylam birlikte girilmeli.";
    if (hasLat && hasLng) {
      const lat = Number(latitude);
      const lng = Number(longitude);
      if (Number.isNaN(lat) || lat < -90 || lat > 90) return "Enlem -90 ile 90 arasında olmalı.";
      if (Number.isNaN(lng) || lng < -180 || lng > 180) return "Boylam -180 ile 180 arasında olmalı.";
    }
    return null;
  }, [latitude, longitude]);

  const canSubmit = useMemo(() => {
    if (busy) return false;
    if (title.trim().length === 0) return false;
    if (latLngError) return false;
    if (isCreate) {
      if (systemType === "" || jobType === "" || priority === "" || source === "") return false;
      if (isWhatsAppAi && rawPayload.trim().length === 0) return false;
    } else {
      if (isWhatsAppAi && rawPayload.trim().length === 0) return false;
    }
    return true;
  }, [busy, title, latLngError, isCreate, systemType, jobType, priority, source, isWhatsAppAi, rawPayload]);

  const handleSubmit = () => {
    const lat = latitude.trim() === "" ? null : Number(latitude);
    const lng = longitude.trim() === "" ? null : Number(longitude);
    const sla = fromDateTimeLocalValue(slaDueAtUtc);

    if (isCreate) {
      const payload: CreateServiceRequestRequest = {
        title: title.trim(),
        description: description.trim() || null,
        systemType: systemType as number,
        jobType: jobType as number,
        priority: priority as number,
        source: source as number,
        customerId: customerId || null,
        deviceType: deviceType === "" ? null : deviceType,
        deviceIdentifier: deviceIdentifier.trim() || null,
        requesterName: requesterName.trim() || null,
        requesterPhone: requesterPhone.trim() || null,
        assignedUserId: assignedUserId || null,
        addressText: addressText.trim() || null,
        latitude: lat,
        longitude: lng,
        slaDueAtUtc: sla,
        rawPayload: isWhatsAppAi ? rawPayload.trim() : rawPayload.trim() || null,
      };
      onSubmit(payload);
      return;
    }

    // ── Edit: sadece değişen alanları gönder ──
    // (null = backend'de "dokunma"; JSON.stringify undefined alanları
    // zaten atlar, bu yüzden değişmeyen alanlar undefined bırakılıyor.)
    const payload: UpdateServiceRequestRequest = { rowVersion: initial?.rowVersion ?? null };

    const setIfChanged = <K extends keyof UpdateServiceRequestRequest>(
      key: K,
      next: UpdateServiceRequestRequest[K],
      prev: UpdateServiceRequestRequest[K]
    ) => {
      if (next !== prev) payload[key] = next;
    };

    setIfChanged("title", title.trim(), initial?.title ?? "");
    setIfChanged("description", description.trim() || null, initial?.description ?? null);
    setIfChanged("systemType", systemType === "" ? null : systemType, initial?.systemType ?? null);
    setIfChanged("jobType", jobType === "" ? null : jobType, initial?.jobType ?? null);
    setIfChanged("priority", priority === "" ? null : priority, initial?.priority ?? null);
    setIfChanged("customerId", customerId || null, initial?.customer?.id ?? null);
    setIfChanged("deviceType", deviceType === "" ? null : deviceType, initial?.deviceType ?? null);
    setIfChanged("deviceIdentifier", deviceIdentifier.trim() || null, initial?.deviceIdentifier ?? null);
    setIfChanged("requesterName", requesterName.trim() || null, initial?.requesterName ?? null);
    setIfChanged("requesterPhone", requesterPhone.trim() || null, initial?.requesterPhone ?? null);
    setIfChanged("addressText", addressText.trim() || null, initial?.addressText ?? null);
    setIfChanged("latitude", lat, initial?.latitude ?? null);
    setIfChanged("longitude", lng, initial?.longitude ?? null);
    setIfChanged("slaDueAtUtc", sla, initial?.slaDueAtUtc ?? null);
    if (isWhatsAppAi) {
      setIfChanged("rawPayload", rawPayload.trim(), initial?.rawPayload ?? "");
    }

    onSubmit(payload);
  };

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="md">
      <DialogTitle>{isCreate ? "Yeni Talep" : "Talebi Düzenle"}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error ? <Alert severity="error">{error}</Alert> : null}

          <TextField
            label="Başlık"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={busy}
          />

          <TextField
            label="Açıklama"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={busy}
            multiline
            minRows={2}
          />

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <FormControl fullWidth disabled={busy}>
              <InputLabel>Sistem Tipi</InputLabel>
              <Select
                label="Sistem Tipi"
                value={systemType}
                onChange={(e) => setSystemType(String(e.target.value) === "" ? "" : Number(e.target.value))}
              >
                <MenuItem value={SYSTEM_TYPE.System1}>{systemTypeLabel(SYSTEM_TYPE.System1)}</MenuItem>
                <MenuItem value={SYSTEM_TYPE.System2}>{systemTypeLabel(SYSTEM_TYPE.System2)}</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth disabled={busy}>
              <InputLabel>İş Tipi</InputLabel>
              <Select
                label="İş Tipi"
                value={jobType}
                onChange={(e) => setJobType(String(e.target.value) === "" ? "" : Number(e.target.value))}
              >
                <MenuItem value={JOB_TYPE.Montage}>{jobTypeLabel(JOB_TYPE.Montage)}</MenuItem>
                <MenuItem value={JOB_TYPE.Replace}>{jobTypeLabel(JOB_TYPE.Replace)}</MenuItem>
                <MenuItem value={JOB_TYPE.Fault}>{jobTypeLabel(JOB_TYPE.Fault)}</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <FormControl fullWidth disabled={busy}>
              <InputLabel>Öncelik</InputLabel>
              <Select
                label="Öncelik"
                value={priority}
                onChange={(e) => setPriority(String(e.target.value) === "" ? "" : Number(e.target.value))}
              >
                {Object.values(REQUEST_PRIORITY).map((v) => (
                  <MenuItem key={v} value={v}>
                    {requestPriorityLabel(v)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth disabled={busy || !isCreate}>
              <InputLabel>Kaynak</InputLabel>
              <Select
                label="Kaynak"
                value={isCreate ? source : initial?.source ?? ""}
                onChange={(e) => setSource(String(e.target.value) === "" ? "" : Number(e.target.value))}
              >
                {Object.values(REQUEST_SOURCE).map((v) => (
                  <MenuItem key={v} value={v}>
                    {requestSourceLabel(v)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          {isWhatsAppAi && (
            <TextField
              label="Ham Veri (RawPayload)"
              value={rawPayload}
              onChange={(e) => setRawPayload(e.target.value)}
              required
              disabled={busy}
              multiline
              minRows={3}
              helperText="AI ile doldurulan taleplerde zorunludur."
            />
          )}

          <Divider />
          <Typography fontWeight={900}>Müşteri</Typography>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <FormControl fullWidth disabled={busy}>
              <InputLabel>Müşteri</InputLabel>
              <Select label="Müşteri" value={customerId} onChange={(e) => setCustomerId(String(e.target.value))}>
                <MenuItem value="">-</MenuItem>
                {customers.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name ?? c.id}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <FormControl fullWidth disabled={busy}>
              <InputLabel>Cihaz Tipi</InputLabel>
              <Select
                label="Cihaz Tipi"
                value={deviceType}
                onChange={(e) => setDeviceType(String(e.target.value) === "" ? "" : Number(e.target.value))}
              >
                <MenuItem value="">-</MenuItem>
                {DEVICE_TYPES.map((v) => (
                  <MenuItem key={v} value={v}>
                    {objectTypeLabel(v)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Cihaz No / Plaka"
              value={deviceIdentifier}
              onChange={(e) => setDeviceIdentifier(e.target.value)}
              disabled={busy}
              fullWidth
            />
          </Stack>

          {isCreate && (
            <FormControl fullWidth disabled={busy}>
              <InputLabel>Ata (opsiyonel)</InputLabel>
              <Select label="Ata (opsiyonel)" value={assignedUserId} onChange={(e) => setAssignedUserId(String(e.target.value))}>
                <MenuItem value="">-</MenuItem>
                {technicians.map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.username}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <Divider />
          <Typography fontWeight={900}>Talepçi / Konum</Typography>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="Talepçi Adı"
              value={requesterName}
              onChange={(e) => setRequesterName(e.target.value)}
              disabled={busy}
              fullWidth
            />
            <TextField
              label="Talepçi Telefonu"
              value={requesterPhone}
              onChange={(e) => setRequesterPhone(e.target.value)}
              disabled={busy}
              fullWidth
            />
          </Stack>

          <TextField
            label="Adres"
            value={addressText}
            onChange={(e) => setAddressText(e.target.value)}
            disabled={busy}
            multiline
            minRows={2}
          />

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="Enlem"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              disabled={busy}
              fullWidth
              inputProps={{ inputMode: "decimal" }}
            />
            <TextField
              label="Boylam"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              disabled={busy}
              fullWidth
              inputProps={{ inputMode: "decimal" }}
            />
          </Stack>
          {latLngError && (
            <Typography color="error" fontSize={13}>
              {latLngError}
            </Typography>
          )}

          <TextField
            type="datetime-local"
            label="SLA Bitiş Tarihi"
            value={slaDueAtUtc}
            onChange={(e) => setSlaDueAtUtc(e.target.value)}
            disabled={busy}
            InputLabelProps={{ shrink: true }}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>
          İptal
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!canSubmit}>
          {busy ? "Kaydediliyor..." : "Kaydet"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
