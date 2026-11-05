import {
  Alert,
  Box,
  Button,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useEffect, useMemo, useState } from "react";

import { useAdminTechnicians } from "../../features/technicians/useAdminTechnicians";
import {
  useCreateTechnician,
  useSetTechnicianActivation,
  useSoftDeleteTechnician,
  useUpdateTechnician,
} from "../../features/technicians/useTechnicianMutations";
import type {
  CreateTechnicianRequest,
  Technician,
  UpdateTechnicianRequest,
} from "../../api/technicians";

import GlassPaper from "../../components/GlassPaper";
import PageHeader from "../../components/PageHeader";
import LoadingCenter from "../../components/LoadingCenter";
import TechnicianDialog from "../../features/technicians/components/TechnicianDialog";
import TechniciansTable from "../../features/technicians/components/TechniciansTable";

import { inputWhiteSx } from "../../theme";
import { safeErrMessage } from "../../utils/errors";
import { statusToBool, type StatusFilter } from "../../utils/filters";

export default function TechniciansPage() {
  // toolbar state
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("active");
  const isActive = statusToBool(status);

  // debounce
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  // query
  const q = useAdminTechnicians(search, isActive);
  const rows = useMemo(() => q.data ?? [], [q.data]);

  // mutations
  const createM = useCreateTechnician();
  const updateM = useUpdateTechnician();
  const deactivateM = useSoftDeleteTechnician();
  const activationM = useSetTechnicianActivation();

  const busy =
    createM.isPending ||
    updateM.isPending ||
    deactivateM.isPending ||
    activationM.isPending;

  // dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<Technician | null>(null);
  const [dialogErr, setDialogErr] = useState<string | null>(null);

  const openCreate = () => {
    setDialogErr(null);
    setEditing(null);
    setDialogMode("create");
    setDialogOpen(true);
  };

  const openEdit = (t: Technician) => {
    setDialogErr(null);
    setEditing(t);
    setDialogMode("edit");
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (createM.isPending || updateM.isPending) return;
    setDialogOpen(false);
  };

  const handleCreate = async (payload: CreateTechnicianRequest) => {
    setDialogErr(null);
    try {
      await createM.mutateAsync(payload);
      setDialogOpen(false);
    } catch (e) {
      setDialogErr(safeErrMessage(e));
    }
  };

  const handleEdit = async (id: string, body: UpdateTechnicianRequest) => {
    setDialogErr(null);
    try {
      await updateM.mutateAsync({ id, body });
      setDialogOpen(false);
      setEditing(null);
    } catch (e) {
      setDialogErr(safeErrMessage(e));
    }
  };

  const onActivationClick = async (t: Technician) => {
    const next = !t.isActive;
    const ok = window.confirm(
      next
        ? `${t.username} aktif edilsin mi?`
        : `${t.username} pasif edilsin mi?`
    );
    if (!ok) return;

    try {
      await activationM.mutateAsync({ id: t.id, isActive: next });
    } catch (e) {
      alert(safeErrMessage(e));
    }
  };

  const onSoftDelete = async (t: Technician) => {
    if (t.isActive) {
      alert("Silmek için önce çalışanı pasife almalısınız.");
      return;
    }

    const ok = window.confirm(
      `${t.username} silinsin mi?\n\n` +
        `Kayıt veritabanından kaldırılmaz fakat listelerde görünmez (soft delete).`
    );
    if (!ok) return;

    try {
      await deactivateM.mutateAsync(t.id);
    } catch (e) {
      alert(safeErrMessage(e));
    }
  };

  const loading = q.isLoading;
  const errText = q.isError ? safeErrMessage(q.error) : null;

  return (
    <Box sx={{ p: 2 }}>
      <PageHeader>Çalışanlar</PageHeader>

      <Stack spacing={2}>
        <GlassPaper sx={{ p: 2 }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems={{ md: "center" }}
          >
            <TextField
              label="Ara (kullanıcı adı / email / telefon)"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              fullWidth
              sx={inputWhiteSx}
            />

            <FormControl sx={{ minWidth: 180, ...inputWhiteSx }}>
              <InputLabel id="status-label">Durum</InputLabel>
              <Select
                labelId="status-label"
                label="Durum"
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as StatusFilter)
                }
              >
                <MenuItem value="active">Aktif</MenuItem>
                <MenuItem value="inactive">Pasif</MenuItem>
                <MenuItem value="all">Hepsi</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={openCreate}
            >
              Yeni Çalışan
            </Button>
          </Stack>

          <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.18)" }} />

          {errText ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errText}
            </Alert>
          ) : null}

          {loading ? (
            <LoadingCenter color="white" />
          ) : (
            <Box
              sx={{
                bgcolor: "rgba(255,255,255,0.92)",
                borderRadius: 2,
                p: 1,
              }}
            >
              <TechniciansTable
                rows={rows}
                onEdit={openEdit}
                onToggleActivation={onActivationClick}
                onSoftDelete={onSoftDelete}
                activationPending={activationM.isPending || busy}
                deletePending={deactivateM.isPending || busy}
              />
            </Box>
          )}
        </GlassPaper>
      </Stack>

      <TechnicianDialog
        open={dialogOpen}
        mode={dialogMode}
        initial={editing}
        busy={createM.isPending || updateM.isPending}
        error={dialogErr}
        onClose={closeDialog}
        onSubmitCreate={handleCreate}
        onSubmitEdit={handleEdit}
      />
    </Box>
  );
}
