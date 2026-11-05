import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  Modal,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import GlassPaper from "../../components/GlassPaper";
import PageHeader from "../../components/PageHeader";
import LoadingCenter from "../../components/LoadingCenter";
import { glassColors } from "../../theme";
import { safeErrMessage } from "../../utils/errors";
import { useAdminCustomers } from "../../features/customers/useAdminCustomers";
import { useTechnicians } from "../../features/technicians/useTechnicians";
import { isTechnician } from "../../utils/roles";
import { useAdminServiceRequests } from "../../features/servicerequests/useAdminServiceRequests";
import { useServiceRequest } from "../../features/servicerequests/useServiceRequest";
import { useServiceRequestMutations } from "../../features/servicerequests/useServiceRequestMutations";
import { useWorkOrder } from "../../features/workorders/useWorkOrder";
import WorkOrderDetail from "../../features/workorders/components/WorkOrderDetail";
import type {
  CreateServiceRequestRequest,
  ServiceRequestListItemDto,
  UpdateServiceRequestRequest,
} from "../../api/serviceRequests";
import ServiceRequestFilters from "../../features/servicerequests/components/ServiceRequestFilters";
import ServiceRequestsTable from "../../features/servicerequests/components/ServiceRequestsTable";
import ServiceRequestDetail from "../../features/servicerequests/components/ServiceRequestDetail";
import ServiceRequestDialog from "../../features/servicerequests/components/ServiceRequestDialog";
import AssignDialog from "../../features/servicerequests/components/AssignDialog";
import ChangeStatusDialog from "../../features/servicerequests/components/ChangeStatusDialog";
import CreateWorkOrderDialog from "../../features/servicerequests/components/CreateWorkOrderDialog";

const PAGE_SIZE = 15;

export default function ServiceRequestsPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  // Talep (720px) + iş detayı (620px) panelleri yan yana sığıyor mu?
  const fitsSideBySide = useMediaQuery("(min-width:1340px)");

  // ── Filtreler ──────────────────────────────────────────────
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatusRaw] = useState<number | "">("");
  const [priority, setPriorityRaw] = useState<number | "">("");
  const [source, setSourceRaw] = useState<number | "">("");
  const [systemType, setSystemTypeRaw] = useState<number | "">("");
  const [jobType, setJobTypeRaw] = useState<number | "">("");
  const [customerId, setCustomerIdRaw] = useState("");
  const [assignedUserId, setAssignedUserIdRaw] = useState("");
  const [unassigned, setUnassignedRaw] = useState(false);
  const [overdueOnly, setOverdueOnlyRaw] = useState(false);
  const [fromDate, setFromDateRaw] = useState("");
  const [toDate, setToDateRaw] = useState("");
  const [sort, setSortRaw] = useState("-createdAt");
  const [page, setPage] = useState(1);

  // Filtre setter'ları: WorkOrdersPage.tsx desenindeki gibi, sayfayı
  // sıfırlama doğrudan aynı event handler içinde yapılır (bir effect
  // içinde senkron setState çağırmak yerine).
  const setStatus = (v: number | "") => { setStatusRaw(v); setPage(1); };
  const setPriority = (v: number | "") => { setPriorityRaw(v); setPage(1); };
  const setSource = (v: number | "") => { setSourceRaw(v); setPage(1); };
  const setSystemType = (v: number | "") => { setSystemTypeRaw(v); setPage(1); };
  const setJobType = (v: number | "") => { setJobTypeRaw(v); setPage(1); };
  const setCustomerId = (v: string) => { setCustomerIdRaw(v); setPage(1); };
  const setAssignedUserId = (v: string) => { setAssignedUserIdRaw(v); setPage(1); };
  const setUnassigned = (v: boolean) => { setUnassignedRaw(v); setPage(1); };
  const setOverdueOnly = (v: boolean) => { setOverdueOnlyRaw(v); setPage(1); };
  const setFromDate = (v: string) => { setFromDateRaw(v); setPage(1); };
  const setToDate = (v: string) => { setToDateRaw(v); setPage(1); };
  const setSort = (v: string) => { setSortRaw(v); setPage(1); };

  // Arama yazarken sürekli istek atmasın — küçük debounce.
  // setPage burada setTimeout callback'i içinde çağrılıyor (efekt
  // gövdesinde senkron değil), bu yüzden set-state-in-effect kuralını
  // tetiklemiyor.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const query = useMemo(
    () => ({
      q: search || undefined,
      status: status === "" ? undefined : status,
      priority: priority === "" ? undefined : priority,
      source: source === "" ? undefined : source,
      systemType: systemType === "" ? undefined : systemType,
      jobType: jobType === "" ? undefined : jobType,
      customerId: customerId || undefined,
      assignedUserId: assignedUserId || undefined,
      unassigned: unassigned || undefined,
      overdueOnly: overdueOnly || undefined,
      from: fromDate || undefined,
      to: toDate || undefined,
      sort,
      page,
      pageSize: PAGE_SIZE,
    }),
    [search, status, priority, source, systemType, jobType, customerId, assignedUserId, unassigned, overdueOnly, fromDate, toDate, sort, page]
  );

  const listQ = useAdminServiceRequests(query);
  const customersQ = useAdminCustomers("", true); // yalnızca aktif müşteriler
  const techsQ = useTechnicians();
  const technicians = useMemo(
    () => (techsQ.data ?? []).filter((t) => isTechnician(t.role)),
    [techsQ.data]
  );

  const {
    createRequest,
    updateRequest,
    assignRequest,
    changeStatus,
    uploadMedia,
    deleteMedia,
    createWorkOrder,
    linkWorkOrder,
    softDeleteRequest,
  } = useServiceRequestMutations();

  // ── Detay drawer ───────────────────────────────────────────
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const detailQ = useServiceRequest(selectedId);

  // ── İş detayı paneli (talep drawer'ının solunda) ───────────
  // Hangi talepten açıldığı da tutuluyor: başka bir talebe geçilince
  // panel kendiliğinden kapanır, her setSelectedId çağrısında ayrıca
  // sıfırlamaya gerek kalmaz.
  const [openWorkOrder, setOpenWorkOrder] = useState<{ requestId: string; workOrderId: string } | null>(null);
  const workOrderId =
    openWorkOrder && openWorkOrder.requestId === selectedId ? openWorkOrder.workOrderId : null;
  const workOrderQ = useWorkOrder(workOrderId);

  // ── Oluştur / düzenle dialog'u ─────────────────────────────
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [dialogErr, setDialogErr] = useState<string | null>(null);

  const openCreate = () => {
    setDialogErr(null);
    setSelectedId(null);
    setDialogMode("create");
    setDialogOpen(true);
  };

  const openEdit = (row: ServiceRequestListItemDto) => {
    setDialogErr(null);
    setSelectedId(row.id);
    setDialogMode("edit");
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (createRequest.isPending || updateRequest.isPending) return;
    setDialogOpen(false);
  };

  const submitDialog = async (
    payload: CreateServiceRequestRequest | UpdateServiceRequestRequest
  ) => {
    setDialogErr(null);
    try {
      if (dialogMode === "create") {
        await createRequest.mutateAsync(payload as CreateServiceRequestRequest);
        setDialogOpen(false);
        return;
      }
      if (!selectedId) return;
      await updateRequest.mutateAsync({
        id: selectedId,
        payload: payload as UpdateServiceRequestRequest,
      });
      setDialogOpen(false);
    } catch (e) {
      setDialogErr(safeErrMessage(e));
    }
  };

  // ── Ata dialog'u ───────────────────────────────────────────
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignErr, setAssignErr] = useState<string | null>(null);

  const submitAssign = async (payload: { assignedUserId: string; slaDueAtUtc?: string | null }) => {
    if (!selectedId) return;
    setAssignErr(null);
    try {
      await assignRequest.mutateAsync({ id: selectedId, payload });
      setAssignOpen(false);
    } catch (e) {
      setAssignErr(safeErrMessage(e));
    }
  };

  // ── Durum değiştir dialog'u ────────────────────────────────
  const [statusOpen, setStatusOpen] = useState(false);
  const [statusErr, setStatusErr] = useState<string | null>(null);

  const submitStatus = async (payload: { status: number; resolutionNote?: string | null }) => {
    if (!selectedId) return;
    setStatusErr(null);
    try {
      await changeStatus.mutateAsync({ id: selectedId, payload });
      setStatusOpen(false);
    } catch (e) {
      setStatusErr(safeErrMessage(e));
    }
  };

  // ── İş emri dialog'u ───────────────────────────────────────
  const [workOrderOpen, setWorkOrderOpen] = useState(false);
  const [workOrderErr, setWorkOrderErr] = useState<string | null>(null);

  const submitCreateWorkOrder = async (payload: { technicianId?: string | null; notes?: string | null }) => {
    if (!selectedId) return;
    setWorkOrderErr(null);
    try {
      await createWorkOrder.mutateAsync({ id: selectedId, payload });
      setWorkOrderOpen(false);
    } catch (e) {
      setWorkOrderErr(safeErrMessage(e));
    }
  };

  const submitLinkWorkOrder = async (workOrderId: string) => {
    if (!selectedId) return;
    setWorkOrderErr(null);
    try {
      await linkWorkOrder.mutateAsync({ id: selectedId, workOrderId });
      setWorkOrderOpen(false);
    } catch (e) {
      setWorkOrderErr(safeErrMessage(e));
    }
  };

  // ── Silme ──────────────────────────────────────────────────
  const onSoftDeleteClick = async (row: ServiceRequestListItemDto) => {
    const ok = window.confirm(
      `"${row.requestNo} - ${row.title}" silinsin mi?\n\n` +
        `Kayıt veritabanından kaldırılmaz fakat listelerde görünmez (soft delete).`
    );
    if (!ok) return;
    try {
      await softDeleteRequest.mutateAsync(row.id);
      if (selectedId === row.id) setSelectedId(null);
    } catch (e) {
      alert(safeErrMessage(e));
    }
  };

  const onDeleteFromDrawer = async () => {
    if (!detailQ.data) return;
    const ok = window.confirm(
      `"${detailQ.data.requestNo} - ${detailQ.data.title}" silinsin mi?\n\n` +
        `Kayıt veritabanından kaldırılmaz fakat listelerde görünmez (soft delete).`
    );
    if (!ok) return;
    try {
      await softDeleteRequest.mutateAsync(detailQ.data.id);
      setSelectedId(null);
    } catch (e) {
      alert(safeErrMessage(e));
    }
  };

  // ── Medya ──────────────────────────────────────────────────
  const [photoOpen, setPhotoOpen] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const onUploadMedia = async (files: File[]) => {
    if (!selectedId) return;
    try {
      await uploadMedia.mutateAsync({ id: selectedId, files });
    } catch (e) {
      alert(safeErrMessage(e));
    }
  };

  const onDeleteMediaClick = async (mediaId: string) => {
    if (!selectedId) return;
    const ok = window.confirm("Bu medya kalıcı olarak silinsin mi?");
    if (!ok) return;
    try {
      await deleteMedia.mutateAsync({ id: selectedId, mediaId });
    } catch (e) {
      alert(safeErrMessage(e));
    }
  };

  const paged = listQ.data;
  const items = paged?.items ?? [];
  const totalPages = paged?.totalPages ?? 0;
  const totalCount = paged?.totalCount ?? 0;

  const loading = listQ.isLoading && !listQ.isPlaceholderData;
  const errText = listQ.isError ? safeErrMessage(listQ.error) : null;

  return (
    <Box sx={{ p: 2 }}>
      <PageHeader>Servis Talepleri</PageHeader>

      <GlassPaper sx={{ p: 2, display: "grid", gap: 2 }}>
        <ServiceRequestFilters
          searchInput={searchInput}
          setSearchInput={setSearchInput}
          status={status}
          setStatus={setStatus}
          priority={priority}
          setPriority={setPriority}
          source={source}
          setSource={setSource}
          systemType={systemType}
          setSystemType={setSystemType}
          jobType={jobType}
          setJobType={setJobType}
          customerId={customerId}
          setCustomerId={setCustomerId}
          customers={customersQ.data ?? []}
          assignedUserId={assignedUserId}
          setAssignedUserId={setAssignedUserId}
          technicians={technicians}
          unassigned={unassigned}
          setUnassigned={setUnassigned}
          overdueOnly={overdueOnly}
          setOverdueOnly={setOverdueOnly}
          fromDate={fromDate}
          setFromDate={setFromDate}
          toDate={toDate}
          setToDate={setToDate}
          sort={sort}
          setSort={setSort}
          onNewClick={openCreate}
        />

        <Divider sx={{ borderColor: glassColors.divider }} />

        {errText ? <Alert severity="error">{errText}</Alert> : null}

        {loading ? (
          <LoadingCenter color="white" />
        ) : (
          <Box
            sx={{
              bgcolor: "rgba(255,255,255,0.92)",
              borderRadius: 2,
              p: 1,
              opacity: listQ.isPlaceholderData ? 0.6 : 1,
              transition: "opacity 0.15s",
              overflowX: "auto",
            }}
          >
            <ServiceRequestsTable
              rows={items}
              onSelect={(row) => setSelectedId(row.id)}
              onEdit={openEdit}
              onSoftDelete={onSoftDeleteClick}
              deletePending={softDeleteRequest.isPending}
            />
          </Box>
        )}

        {totalPages > 1 && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              pt: 1.5,
              mt: 0.5,
              borderTop: `1px solid ${glassColors.divider}`,
            }}
          >
            <Typography sx={{ color: glassColors.textSubtle }} fontSize={13}>
              Toplam {totalCount} talep • Sayfa {page}/{totalPages}
            </Typography>

            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                size="small"
                variant="outlined"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                sx={{ color: "white", borderColor: "rgba(255,255,255,0.4)", "&:hover": { borderColor: "white" } }}
              >
                ← ÖNCEKİ
              </Button>
              <Button
                size="small"
                variant="outlined"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                sx={{ color: "white", borderColor: "rgba(255,255,255,0.4)", "&:hover": { borderColor: "white" } }}
              >
                SONRAKİ →
              </Button>
            </Box>
          </Box>
        )}
      </GlassPaper>

      {/* ── Detay Drawer ─────────────────────────────────────── */}
      <Drawer
        anchor={isMobile ? "bottom" : "right"}
        open={!!selectedId && !dialogOpen}
        onClose={() => setSelectedId(null)}
        PaperProps={{
          sx: {
            width: isMobile ? "100%" : "min(720px, 100vw)",
            height: isMobile ? "88vh" : "100%",
            p: 2,
            borderTopLeftRadius: isMobile ? 16 : 0,
            borderTopRightRadius: isMobile ? 16 : 0,
          },
        }}
      >
        <Typography variant="h6" fontWeight={900}>
          Talep Detayı
        </Typography>
        <Divider sx={{ my: 2 }} />

        {detailQ.isLoading && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <CircularProgress size={18} />
            <Typography>Detay yükleniyor...</Typography>
          </Box>
        )}

        {detailQ.isError && (
          <Typography color="error">Detay alınamadı: {safeErrMessage(detailQ.error)}</Typography>
        )}

        {detailQ.data && (
          <ServiceRequestDetail
            request={detailQ.data}
            onPhotoClick={(url) => {
              setPhotoUrl(url);
              setPhotoOpen(true);
            }}
            onAssignClick={() => {
              setAssignErr(null);
              setAssignOpen(true);
            }}
            onStatusClick={() => {
              setStatusErr(null);
              setStatusOpen(true);
            }}
            onWorkOrderClick={() => {
              setWorkOrderErr(null);
              setWorkOrderOpen(true);
            }}
            onOpenWorkOrder={(id) => setOpenWorkOrder({ requestId: detailQ.data.id, workOrderId: id })}
            onDeleteClick={onDeleteFromDrawer}
            onUploadMedia={onUploadMedia}
            onDeleteMedia={onDeleteMediaClick}
            uploadPending={uploadMedia.isPending}
            deleteMediaPending={deleteMedia.isPending}
          />
        )}
      </Drawer>

      {/* ── İş Detayı Drawer ─────────────────────────────────── */}
      {/* Geniş ekranda talep drawer'ının hemen soluna, dar ekranda onun
          üstüne, mobilde alttan açılır. Backdrop görünmez: talep drawer'ı
          zaten karartma yapıyor, ikinci kez karartılmasın. */}
      <Drawer
        anchor={isMobile ? "bottom" : "right"}
        open={!!workOrderId && !dialogOpen}
        onClose={() => setOpenWorkOrder(null)}
        slotProps={{ backdrop: { invisible: true } }}
        PaperProps={{
          sx: {
            width: isMobile ? "100%" : "min(620px, 100vw)",
            height: isMobile ? "80vh" : "100%",
            right: !isMobile && fitsSideBySide ? "720px" : 0,
            p: 2,
            borderTopLeftRadius: isMobile ? 16 : 0,
            borderTopRightRadius: isMobile ? 16 : 0,
            boxShadow: 8,
          },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography variant="h6" fontWeight={900}>
            İş Detayı
          </Typography>
          <IconButton aria-label="Kapat" onClick={() => setOpenWorkOrder(null)}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider sx={{ my: 2 }} />

        {workOrderQ.isLoading && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <CircularProgress size={18} />
            <Typography>Detay yükleniyor...</Typography>
          </Box>
        )}

        {workOrderQ.isError && (
          <Typography color="error">Detay alınamadı: {safeErrMessage(workOrderQ.error)}</Typography>
        )}

        {workOrderQ.data && (
          <WorkOrderDetail
            wo={workOrderQ.data}
            technicianName={technicians.find((t) => t.id === workOrderQ.data.technicianId)?.username}
            onPhotoClick={(url) => {
              setPhotoUrl(url);
              setPhotoOpen(true);
            }}
          />
        )}
      </Drawer>

      {/* ── Tam ekran fotoğraf ───────────────────────────────── */}
      <Modal
        open={photoOpen}
        onClose={() => {
          setPhotoOpen(false);
          setPhotoUrl(null);
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            bgcolor: "white",
            p: 2,
            borderRadius: 2,
            outline: "none",
            maxWidth: "90vw",
            maxHeight: "90vh",
          }}
        >
          {photoUrl && (
            <Box
              component="img"
              src={photoUrl}
              alt="full"
              sx={{ maxWidth: "86vw", maxHeight: "86vh", objectFit: "contain" }}
            />
          )}
        </Box>
      </Modal>

      {/* ── Oluştur / Düzenle ────────────────────────────────── */}
      {dialogOpen && (dialogMode === "create" || (detailQ.data && detailQ.data.id === selectedId)) && (
        <ServiceRequestDialog
          key={`${dialogMode}-${selectedId ?? "new"}-${dialogOpen ? "1" : "0"}`}
          open={dialogOpen}
          mode={dialogMode}
          initial={dialogMode === "edit" ? detailQ.data : null}
          customers={customersQ.data ?? []}
          technicians={technicians}
          busy={createRequest.isPending || updateRequest.isPending}
          error={dialogErr}
          onClose={closeDialog}
          onSubmit={submitDialog}
        />
      )}

      {/* ── Ata ──────────────────────────────────────────────── */}
      {assignOpen && detailQ.data && (
        <AssignDialog
          open={assignOpen}
          technicians={technicians}
          currentAssignedUserId={detailQ.data.assignedUserId}
          currentSlaDueAtUtc={detailQ.data.slaDueAtUtc}
          busy={assignRequest.isPending}
          error={assignErr}
          onClose={() => setAssignOpen(false)}
          onSubmit={submitAssign}
        />
      )}

      {/* ── Durum Değiştir ───────────────────────────────────── */}
      {statusOpen && detailQ.data && (
        <ChangeStatusDialog
          open={statusOpen}
          currentStatus={detailQ.data.status}
          busy={changeStatus.isPending}
          error={statusErr}
          onClose={() => setStatusOpen(false)}
          onSubmit={submitStatus}
        />
      )}

      {/* ── İş Emri ──────────────────────────────────────────── */}
      {workOrderOpen && detailQ.data && (
        <CreateWorkOrderDialog
          open={workOrderOpen}
          technicians={technicians}
          assignedUserId={detailQ.data.assignedUserId}
          busy={createWorkOrder.isPending || linkWorkOrder.isPending}
          error={workOrderErr}
          onClose={() => setWorkOrderOpen(false)}
          onCreate={submitCreateWorkOrder}
          onLink={submitLinkWorkOrder}
        />
      )}
    </Box>
  );
}
