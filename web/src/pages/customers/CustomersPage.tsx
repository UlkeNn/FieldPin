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

import { useEffect, useState } from "react";
import { useAdminCustomers } from "../../features/customers/useAdminCustomers";
import { useCustomerMutations } from "../../features/customers/useCustomerMutations";
import type {
  CreateCustomerRequest,
  CustomerDto,
  UpdateCustomerRequest,
} from "../../api/customers";

import GlassPaper from "../../components/GlassPaper";
import PageHeader from "../../components/PageHeader";
import LoadingCenter from "../../components/LoadingCenter";
import CustomerDialog from "../../features/customers/components/CustomerDialog";
import CustomersTable from "../../features/customers/components/CustomersTable";
import { inputWhiteSx } from "../../theme";
import { safeErrMessage } from "../../utils/errors";
import { statusToBool, type StatusFilter } from "../../utils/filters";

export default function CustomersPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("active");
  const isActive = statusToBool(status);

  // küçük debounce: arama yazarken sürekli istek atmasın
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const q = useAdminCustomers(search, isActive);
  const {
    createCustomer,
    updateCustomer,
    setActivation,
    softDeleteCustomer,
  } = useCustomerMutations();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<CustomerDto | null>(null);
  const [dialogErr, setDialogErr] = useState<string | null>(null);

  const openCreate = () => {
    setDialogErr(null);
    setEditing(null);
    setDialogMode("create");
    setDialogOpen(true);
  };

  const openEdit = (c: CustomerDto) => {
    setDialogErr(null);
    setEditing(c);
    setDialogMode("edit");
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (createCustomer.isPending || updateCustomer.isPending) return;
    setDialogOpen(false);
  };

  const submitDialog = async (
    payload: CreateCustomerRequest | UpdateCustomerRequest
  ) => {
    setDialogErr(null);
    try {
      if (dialogMode === "create") {
        await createCustomer.mutateAsync(payload as CreateCustomerRequest);
        setDialogOpen(false);
        return;
      }

      if (!editing) return;
      await updateCustomer.mutateAsync({
        id: editing.id,
        payload: payload as UpdateCustomerRequest,
      });
      setDialogOpen(false);
    } catch (e) {
      setDialogErr(safeErrMessage(e));
    }
  };

  const onActivationClick = async (c: CustomerDto) => {
    const next = !c.isActive;
    const ok = window.confirm(
      next
        ? `"${c.name ?? "Müşteri"}" aktif edilsin mi?`
        : `"${c.name ?? "Müşteri"}" pasif edilsin mi?`
    );
    if (!ok) return;

    try {
      await setActivation.mutateAsync({ id: c.id, isActive: next });
    } catch (e) {
      alert(safeErrMessage(e));
    }
  };

  const onSoftDeleteClick = async (c: CustomerDto) => {
    if (c.isActive) {
      alert("Silmek için önce müşteriyi pasife almalısınız.");
      return;
    }

    const ok = window.confirm(
      `"${c.name ?? "Müşteri"}" silinsin mi?\n\n` +
        `Kayıt veritabanından kaldırılmaz fakat listelerde görünmez (soft delete).`
    );
    if (!ok) return;

    try {
      await softDeleteCustomer.mutateAsync(c.id);
    } catch (e) {
      alert(safeErrMessage(e));
    }
  };

  const loading = q.isLoading;
  const errText = q.isError ? safeErrMessage(q.error) : null;
  const rows = q.data ?? [];

  return (
    <Box sx={{ p: 2 }}>
      <PageHeader>Müşteriler</PageHeader>

      <Stack spacing={2}>
        <GlassPaper sx={{ p: 2 }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems={{ md: "center" }}
          >
            <TextField
              label="Ara (Ad / Bilgi / Telefon)"
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
              Yeni Müşteri
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
                // Tabloyu cam üstünde okunaklı kıl
                bgcolor: "rgba(255,255,255,0.92)",
                borderRadius: 2,
                p: 1,
              }}
            >
              <CustomersTable
                rows={rows}
                onEdit={openEdit}
                onToggleActivation={onActivationClick}
                onSoftDelete={onSoftDeleteClick}
                activationPending={setActivation.isPending}
                deletePending={softDeleteCustomer.isPending}
              />
            </Box>
          )}
        </GlassPaper>
      </Stack>

      <CustomerDialog
        key={`${dialogMode}-${editing?.id ?? "new"}-${dialogOpen ? "1" : "0"}`}
        open={dialogOpen}
        mode={dialogMode}
        initial={editing}
        busy={createCustomer.isPending || updateCustomer.isPending}
        error={dialogErr}
        onClose={closeDialog}
        onSubmit={submitDialog}
      />
    </Box>
  );
}
