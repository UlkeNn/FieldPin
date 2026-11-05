import {
  Alert,
  Box,
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
import { useState } from "react";
import type { Technician } from "../../../api/technicians";

interface CreateWorkOrderDialogProps {
  open: boolean;
  technicians: Technician[];
  assignedUserId?: string | null;
  busy?: boolean;
  error?: string | null;
  onClose: () => void;
  onCreate: (payload: { technicianId?: string | null; notes?: string | null }) => void;
  onLink: (workOrderId: string) => void;
}

/**
 * Talepten iş emri üretme / var olan iş emrini bağlama dialog'u.
 * POST /work-orders ve POST /work-orders/link tek dialog altında,
 * iki ayrı aksiyon butonuyla.
 */
export default function CreateWorkOrderDialog({
  open,
  technicians,
  assignedUserId,
  busy,
  error,
  onClose,
  onCreate,
  onLink,
}: CreateWorkOrderDialogProps) {
  const [technicianId, setTechnicianId] = useState("");
  const [notes, setNotes] = useState("");
  const [linkWorkOrderId, setLinkWorkOrderId] = useState("");

  const handleCreate = () => {
    onCreate({
      technicianId: technicianId || null,
      notes: notes.trim() || null,
    });
  };

  const handleLink = () => {
    if (!linkWorkOrderId.trim()) return;
    onLink(linkWorkOrderId.trim());
  };

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>İş Emri</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error ? <Alert severity="error">{error}</Alert> : null}

          <Typography fontWeight={900}>Yeni İş Emri Üret</Typography>

          <FormControl fullWidth disabled={busy}>
            <InputLabel>Teknisyen (opsiyonel)</InputLabel>
            <Select
              label="Teknisyen (opsiyonel)"
              value={technicianId}
              onChange={(e) => setTechnicianId(String(e.target.value))}
            >
              <MenuItem value="">
                {assignedUserId ? "Talebe atanan teknisyen kullanılsın" : "-"}
              </MenuItem>
              {technicians.map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.username}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Not (opsiyonel)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={busy}
            multiline
            minRows={2}
            helperText="Boş bırakılırsa talep başlığından otomatik üretilir."
          />

          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="contained"
              onClick={handleCreate}
              disabled={busy || (!technicianId && !assignedUserId)}
            >
              {busy ? "Oluşturuluyor..." : "İş Emri Üret"}
            </Button>
          </Box>

          <Divider />
          <Typography fontWeight={900}>Var Olan İş Emrini Bağla</Typography>

          <TextField
            label="İş Emri Id"
            value={linkWorkOrderId}
            onChange={(e) => setLinkWorkOrderId(e.target.value)}
            disabled={busy}
          />

          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button variant="outlined" onClick={handleLink} disabled={busy || !linkWorkOrderId.trim()}>
              {busy ? "Bağlanıyor..." : "Bağla"}
            </Button>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>
          Kapat
        </Button>
      </DialogActions>
    </Dialog>
  );
}
