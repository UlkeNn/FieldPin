import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from "@mui/material";
import { useMemo, useState } from "react";
import type {
  CreateCustomerRequest,
  CustomerDto,
  UpdateCustomerRequest,
} from "../../../api/customers";

interface CustomerDialogProps {
  open: boolean;
  mode: "create" | "edit";
  initial?: CustomerDto | null;
  busy?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (payload: CreateCustomerRequest | UpdateCustomerRequest) => void;
}

/**
 * Müşteri ekleme / düzenleme dialog'u.
 * Aynı dialog mode prop'u ile iki amaca hizmet eder.
 */
export default function CustomerDialog({
  open,
  mode,
  initial,
  busy,
  error,
  onClose,
  onSubmit,
}: CustomerDialogProps) {
  const [name, setName] = useState(() => initial?.name ?? "");
  const [phone, setPhone] = useState(() => initial?.phone ?? "");
  const [info, setInfo] = useState(() => initial?.info ?? "");

  const isCreate = mode === "create";

  const canSubmit = useMemo(() => {
    if (busy) return false;
    if (isCreate) return name.trim().length > 0;
    return true;
  }, [busy, isCreate, name]);

  const handleSubmit = () => {
    if (isCreate) {
      const payload: CreateCustomerRequest = {
        name: name.trim(),
        phone: phone.trim() || null,
        info: info.trim() || null,
      };
      onSubmit(payload);
      return;
    }

    const payload: UpdateCustomerRequest = {
      name: name.trim() || null,
      phone: phone.trim() || null,
      info: info.trim() || null,
    };
    onSubmit(payload);
  };

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isCreate ? "Yeni Müşteri" : "Müşteriyi Düzenle"}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error ? <Alert severity="error">{error}</Alert> : null}

          <TextField
            label="Ad"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required={isCreate}
            disabled={busy}
            placeholder="Örn: ABC Otomotiv"
          />

          <TextField
            label="Telefon"
            value={phone}
            onChange={(e) => {
              const sanitized = e.target.value.replace(/[^0-9\s]/g, "");
              setPhone(sanitized);
            }}
            disabled={busy}
            placeholder="Örn: 05xx xxx xx xx"
            inputProps={{ inputMode: "tel", maxLength: 13 }}
          />

          <TextField
            label="Bilgi"
            value={info}
            onChange={(e) => setInfo(e.target.value)}
            disabled={busy}
            multiline
            minRows={3}
            placeholder="Not / adres / açıklama..."
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
