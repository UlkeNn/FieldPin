import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material";
import { useMemo, useState } from "react";
import type { AssignServiceRequestRequest } from "../../../api/serviceRequests";
import type { Technician } from "../../../api/technicians";

interface AssignDialogProps {
  open: boolean;
  technicians: Technician[];
  currentAssignedUserId?: string | null;
  currentSlaDueAtUtc?: string | null;
  busy?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (payload: AssignServiceRequestRequest) => void;
}

/**
 * Teknisyene atama dialog'u — PATCH /assign.
 * slaDueAtUtc opsiyonel: boş bırakılırsa mevcut SLA'e dokunulmaz.
 */
export default function AssignDialog({
  open,
  technicians,
  currentAssignedUserId,
  currentSlaDueAtUtc,
  busy,
  error,
  onClose,
  onSubmit,
}: AssignDialogProps) {
  const [assignedUserId, setAssignedUserId] = useState(() => currentAssignedUserId ?? "");
  const [slaDueAtUtc, setSlaDueAtUtc] = useState(() =>
    currentSlaDueAtUtc ? currentSlaDueAtUtc.slice(0, 16) : ""
  );

  const canSubmit = useMemo(() => {
    if (busy) return false;
    return assignedUserId.trim().length > 0;
  }, [busy, assignedUserId]);

  const handleSubmit = () => {
    const sla = slaDueAtUtc ? new Date(slaDueAtUtc).toISOString() : null;
    onSubmit({ assignedUserId, slaDueAtUtc: sla });
  };

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Teknisyene Ata</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error ? <Alert severity="error">{error}</Alert> : null}

          <FormControl fullWidth disabled={busy}>
            <InputLabel>Teknisyen</InputLabel>
            <Select
              label="Teknisyen"
              value={assignedUserId}
              onChange={(e) => setAssignedUserId(String(e.target.value))}
            >
              {technicians.map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.username}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            type="datetime-local"
            label="SLA Bitiş Tarihi (opsiyonel)"
            value={slaDueAtUtc}
            onChange={(e) => setSlaDueAtUtc(e.target.value)}
            disabled={busy}
            InputLabelProps={{ shrink: true }}
            helperText="Boş bırakılırsa mevcut SLA değişmez."
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>
          İptal
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!canSubmit}>
          {busy ? "Kaydediliyor..." : "Ata"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
