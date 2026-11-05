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
  TextField,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import type {
  CreateTechnicianRequest,
  Technician,
  UpdateTechnicianRequest,
} from "../../../api/technicians";
import { toDateInputValue } from "../../../utils/format";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(val: string): string {
  if (!val) return "";
  return EMAIL_RE.test(val) ? "" : "Geçerli bir mail adresi girin";
}

interface TechnicianDialogProps {
  open: boolean;
  mode: "create" | "edit";
  initial?: Technician | null;
  busy?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmitCreate: (payload: CreateTechnicianRequest) => void;
  onSubmitEdit: (id: string, payload: UpdateTechnicianRequest) => void;
}

/**
 * Çalışan ekleme/düzenleme dialog'u.
 * mode = "create" → Yeni Çalışan
 * mode = "edit"   → Çalışan Düzenle (initial zorunlu)
 */
export default function TechnicianDialog({
  open,
  mode,
  initial,
  busy,
  error,
  onClose,
  onSubmitCreate,
  onSubmitEdit,
}: TechnicianDialogProps) {
  const isCreate = mode === "create";

  // Form state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [role, setRole] = useState<string>("Technician");
  const [isActive, setIsActive] = useState<boolean>(true);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [birthDate, setBirthDate] = useState<string | null>(null);
  const [emailError, setEmailError] = useState("");

  // initial / mode değişince form sıfırla
  useEffect(() => {
    if (!open) return;
    setEmailError("");
    if (isCreate) {
      setUsername("");
      setPassword("");
      setNewPassword("");
      setRole("Technician");
      setIsActive(true);
      setPhone("");
      setEmail("");
      setAddress("");
      setBirthDate(null);
    } else if (initial) {
      setUsername(initial.username ?? "");
      setPassword("");
      setNewPassword("");
      setRole(initial.role ?? "Technician");
      setIsActive(initial.isActive);
      setPhone(initial.phone ?? "");
      setEmail(initial.email ?? "");
      setAddress(initial.address ?? "");
      setBirthDate(initial.birthDate ?? null);
    }
  }, [open, isCreate, initial]);

  const canSubmit = useMemo(() => {
    if (busy) return false;
    if (emailError) return false;
    if (isCreate) {
      return username.trim().length > 0 && password.trim().length > 0;
    }
    return true;
  }, [busy, emailError, isCreate, username, password]);

  const handleSubmit = () => {
    if (isCreate) {
      const payload: CreateTechnicianRequest = {
        username: username.trim(),
        password: password.trim(),
        role: role.trim() || "Technician",
        phone: phone.trim() || "",
        email: email.trim() || "",
        address: address.trim() || "",
        birthDate: birthDate ? birthDate : null,
      };
      onSubmitCreate(payload);
      return;
    }

    if (!initial) return;

    const payload: UpdateTechnicianRequest = {
      username: username.trim() || undefined,
      role: role.trim() || undefined,
      isActive,
      newPassword: newPassword.trim() ? newPassword.trim() : undefined,
      phone: phone ?? "",
      email: email ?? "",
      address: address ?? "",
      birthDate: birthDate ? birthDate : undefined,
    };
    onSubmitEdit(initial.id, payload);
  };

  // Telefon: rakam ve + , maks 13
  const handlePhoneChange = (val: string) => {
    const sanitized = val.replace(/[^0-9+]/g, "").slice(0, 13);
    setPhone(sanitized);
  };


  //yeni çalışan oluşturma / çalışan düzenleme
  return (
    <Dialog
      open={open}
      onClose={busy ? undefined : onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>{isCreate ? "Yeni Çalışan" : "Çalışan Düzenle"}</DialogTitle>
      <DialogContent sx={{ display: "grid", gap: 2, pt: 2 }}>
        {error ? <Alert severity="error">{error}</Alert> : null}

        <TextField
          sx={{ mt: 2 }}
          label={isCreate ? "Kullanıcı adı" : "Kullanıcı Adı"}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={busy}
        />

        {isCreate && (
          <TextField
            label="Şifre"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={busy}
          />
        )}

        <FormControl disabled={busy}>
          <InputLabel>Rol</InputLabel>
          <Select
            label="Rol"
            value={role}
            onChange={(e) => setRole(String(e.target.value))}
          >
            <MenuItem value="Technician">Teknisyen</MenuItem>
            <MenuItem value="Admin">Admin</MenuItem>
          </Select>
        </FormControl>

        {!isCreate && (
          <FormControl disabled={busy}>
            <InputLabel>Durum</InputLabel>
            <Select
              label="Durum"
              value={isActive ? "active" : "inactive"}
              onChange={(e) => setIsActive(e.target.value === "active")}
            >
              <MenuItem value="active">Aktif</MenuItem>
              <MenuItem value="inactive">Pasif</MenuItem>
            </Select>
          </FormControl>
        )}

        <TextField
          label={isCreate ? "Telefon (opsiyonel)" : "Telefon"}
          value={phone}
          onChange={(e) => handlePhoneChange(e.target.value)}
          disabled={busy}
          placeholder="Örn: 05xx xxx xx xx"
          inputProps={{ inputMode: "tel", maxLength: 13 }}
        />

        <TextField
          label={isCreate ? "Mail (opsiyonel)" : "Mail"}
          value={email}
          onChange={(e) => {
            const val = e.target.value;
            setEmail(val);
            setEmailError(validateEmail(val));
          }}
          error={!!emailError}
          helperText={emailError}
          disabled={busy}
        />

        <TextField
          label={isCreate ? "Adres (opsiyonel)" : "Adres"}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          disabled={busy}
        />

        <TextField
          label="Doğum Tarihi (opsiyonel)"
          type="date"
          InputLabelProps={{ shrink: true }}
          value={isCreate ? birthDate ?? "" : toDateInputValue(birthDate)}
          onChange={(e) => setBirthDate(e.target.value || null)}
          disabled={busy}
        />

        {!isCreate && (
          <TextField
            label="Yeni Şifre (opsiyonel)"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={busy}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>
          {isCreate ? "İptal" : "Kapat"}
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!canSubmit}>
          {busy ? "Kaydediliyor..." : "Kaydet"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
