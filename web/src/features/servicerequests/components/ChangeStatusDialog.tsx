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
import type { ChangeServiceRequestStatusRequest } from "../../../api/serviceRequests";
import { requestStatusLabel } from "../../../api/serviceRequests";
import { ALLOWED_STATUS_TRANSITIONS, requiresResolutionNote } from "../utils";

interface ChangeStatusDialogProps {
  open: boolean;
  currentStatus: number;
  busy?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (payload: ChangeServiceRequestStatusRequest) => void;
}

/**
 * Durum değiştirme dialog'u — PATCH /status.
 * Hedef durum listesi ALLOWED_STATUS_TRANSITIONS'tan geliyor, böylece
 * kullanıcı backend'in 400 döneceği bir geçişi hiç seçemiyor.
 */
export default function ChangeStatusDialog({
  open,
  currentStatus,
  busy,
  error,
  onClose,
  onSubmit,
}: ChangeStatusDialogProps) {
  const options = ALLOWED_STATUS_TRANSITIONS[currentStatus] ?? [];
  const [status, setStatus] = useState<number | "">(() => options[0] ?? "");
  const [resolutionNote, setResolutionNote] = useState("");

  const needsNote = status !== "" && requiresResolutionNote(status);

  const canSubmit = useMemo(() => {
    if (busy) return false;
    if (status === "") return false;
    if (needsNote && resolutionNote.trim().length === 0) return false;
    return true;
  }, [busy, status, needsNote, resolutionNote]);

  const handleSubmit = () => {
    onSubmit({
      status: status as number,
      resolutionNote: resolutionNote.trim() || null,
    });
  };

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Durum Değiştir</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error ? <Alert severity="error">{error}</Alert> : null}

          {options.length === 0 ? (
            <Alert severity="info">
              Bu talep kapalı ({requestStatusLabel(currentStatus)}) — durumu değiştirilemez.
            </Alert>
          ) : (
            <>
              <FormControl fullWidth disabled={busy}>
                <InputLabel>Yeni Durum</InputLabel>
                <Select
                  label="Yeni Durum"
                  value={status}
                  onChange={(e) => setStatus(String(e.target.value) === "" ? "" : Number(e.target.value))}
                >
                  {options.map((v) => (
                    <MenuItem key={v} value={v}>
                      {requestStatusLabel(v)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label={needsNote ? "Sonuç Notu (zorunlu)" : "Sonuç Notu"}
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                required={needsNote}
                disabled={busy}
                multiline
                minRows={2}
                helperText={
                  needsNote
                    ? "Talebi tamamlarken / iptal ederken zorunludur."
                    : undefined
                }
              />
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>
          İptal
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!canSubmit}>
          {busy ? "Kaydediliyor..." : "Uygula"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
