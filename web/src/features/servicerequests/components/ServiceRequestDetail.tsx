import { Box, Button, Divider, IconButton, Stack, Typography } from "@mui/material";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import SyncAltIcon from "@mui/icons-material/SyncAlt";
import BuildIcon from "@mui/icons-material/Build";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import { useRef } from "react";
import type { ServiceRequestDetailDto } from "../../../api/serviceRequests";
import {
  locationSourceLabel,
  requestPriorityLabel,
  requestSourceLabel,
} from "../../../api/serviceRequests";
import { jobTypeLabel, systemTypeLabel } from "../../../api/workorders";
import { toLocalDateTime } from "../../../utils/format";
import { objectTypeLabel } from "../../workorders/utils";
import { isTerminalStatus } from "../utils";
import ServiceRequestStatusChip from "./ServiceRequestStatusChip";

interface ServiceRequestDetailProps {
  request: ServiceRequestDetailDto;
  onPhotoClick: (url: string) => void;
  onAssignClick: () => void;
  onStatusClick: () => void;
  onWorkOrderClick: () => void;
  onOpenWorkOrder: (workOrderId: string) => void;
  onDeleteClick: () => void;
  onUploadMedia: (files: File[]) => void;
  onDeleteMedia: (mediaId: string) => void;
  uploadPending: boolean;
  deleteMediaPending: boolean;
}

/**
 * Sağdaki drawer'da gösterilen talep detay paneli.
 * WorkOrderDetail.tsx'in bu modüldeki karşılığı.
 */
export default function ServiceRequestDetail({
  request,
  onPhotoClick,
  onAssignClick,
  onStatusClick,
  onWorkOrderClick,
  onOpenWorkOrder,
  onDeleteClick,
  onUploadMedia,
  onDeleteMedia,
  uploadPending,
  deleteMediaPending,
}: ServiceRequestDetailProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const terminal = isTerminalStatus(request.status);

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onUploadMedia(Array.from(files));
    }
    e.target.value = "";
  };

  return (
    <Box sx={{ display: "grid", gap: 1.2 }}>
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
        <Typography fontWeight={900} fontSize={18}>
          {request.requestNo}
        </Typography>
        <ServiceRequestStatusChip status={request.status} />
        {request.isOverdue && (
          <Typography color="error" fontWeight={800} fontSize={13}>
            SLA aşıldı
          </Typography>
        )}
      </Stack>

      <Typography fontWeight={700}>{request.title}</Typography>
      {request.description && (
        <Typography sx={{ color: "#667085" }}>{request.description}</Typography>
      )}

      <Divider sx={{ my: 1 }} />

      <Stack direction="row" spacing={1} flexWrap="wrap">
        <Button size="small" variant="outlined" startIcon={<AssignmentIndIcon />} onClick={onAssignClick} disabled={terminal}>
          Ata
        </Button>
        <Button size="small" variant="outlined" startIcon={<SyncAltIcon />} onClick={onStatusClick} disabled={terminal}>
          Durum Değiştir
        </Button>
        <Button size="small" variant="outlined" startIcon={<BuildIcon />} onClick={onWorkOrderClick} disabled={terminal}>
          İş Emri
        </Button>
        <Button size="small" variant="outlined" color="error" startIcon={<DeleteForeverIcon />} onClick={onDeleteClick}>
          Sil
        </Button>
      </Stack>

      <Divider sx={{ my: 1 }} />

      <Typography>
        <b>Müşteri:</b> {request.customer?.name ?? "-"} {request.customer?.phone ? `(${request.customer.phone})` : ""}
      </Typography>
      <Typography>
        <b>Sistem Tipi:</b> {systemTypeLabel(request.systemType)}
      </Typography>
      <Typography>
        <b>İş Tipi:</b> {jobTypeLabel(request.jobType)}
      </Typography>
      <Typography>
        <b>Öncelik:</b> {requestPriorityLabel(request.priority)}
      </Typography>
      <Typography>
        <b>Kaynak:</b> {requestSourceLabel(request.source)}
      </Typography>
      {request.deviceType != null && (
        <Typography>
          <b>Cihaz:</b> {objectTypeLabel(request.deviceType)}
          {request.deviceIdentifier ? ` • ${request.deviceIdentifier}` : ""}
        </Typography>
      )}
      <Typography>
        <b>Talepçi:</b> {request.requesterName ?? "-"}
        {request.requesterPhone ? ` • ${request.requesterPhone}` : ""}
      </Typography>
      <Typography>
        <b>Atanan:</b> {request.assignedUserName ?? "-"}
        {request.assignedAtUtc ? ` (${toLocalDateTime(request.assignedAtUtc)})` : ""}
      </Typography>
      <Typography>
        <b>Adres:</b> {request.addressText ?? "-"}
      </Typography>
      {request.latitude != null && request.longitude != null && (
        <Typography>
          <b>Konum:</b> {request.latitude.toFixed(6)}, {request.longitude.toFixed(6)}
          {request.locationSource != null ? ` (${locationSourceLabel(request.locationSource)})` : ""}
        </Typography>
      )}
      <Typography>
        <b>Oluşturulma:</b> {toLocalDateTime(request.createdAtUtc)}
      </Typography>
      <Typography>
        <b>Güncellenme:</b> {toLocalDateTime(request.updatedAtUtc)}
      </Typography>
      <Typography>
        <b>SLA Bitiş:</b> {request.slaDueAtUtc ? toLocalDateTime(request.slaDueAtUtc) : "-"}
      </Typography>
      {request.completedAtUtc && (
        <Typography>
          <b>Tamamlanma:</b> {toLocalDateTime(request.completedAtUtc)}
        </Typography>
      )}
      {request.resolutionNote && (
        <Typography>
          <b>Sonuç Notu:</b> {request.resolutionNote}
        </Typography>
      )}
      {request.rawPayload && (
        <Typography sx={{ wordBreak: "break-word" }}>
          <b>Ham Veri:</b> {request.rawPayload}
        </Typography>
      )}

      <Divider sx={{ my: 1.5 }} />

      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography fontWeight={900}>Medya</Typography>
        <Button
          size="small"
          startIcon={<AddPhotoAlternateIcon />}
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadPending}
        >
          {uploadPending ? "Yükleniyor..." : "Fotoğraf Ekle"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.webp,.heic,.heif"
          hidden
          onChange={handleFilesSelected}
        />
      </Stack>

      {request.media.length === 0 ? (
        <Typography sx={{ color: "#667085" }}>Medya yok</Typography>
      ) : (
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          {request.media.map((m) => (
            <Box key={m.id} sx={{ position: "relative" }}>
              <Box
                component="img"
                src={m.url}
                alt={m.originalFileName || m.fileName}
                onClick={() => onPhotoClick(m.url)}
                sx={{
                  width: 84,
                  height: 84,
                  objectFit: "cover",
                  borderRadius: 2,
                  border: "1px solid #E5E7EB",
                  cursor: "pointer",
                }}
              />
              <IconButton
                size="small"
                onClick={() => onDeleteMedia(m.id)}
                disabled={deleteMediaPending}
                sx={{
                  position: "absolute",
                  top: -8,
                  right: -8,
                  bgcolor: "white",
                  boxShadow: 1,
                  "&:hover": { bgcolor: "#fee2e2" },
                }}
              >
                <DeleteOutlineIcon fontSize="small" color="error" />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}

      <Divider sx={{ my: 1.5 }} />

      <Typography fontWeight={900}>İş Emirleri</Typography>
      {request.workOrders.length === 0 ? (
        <Typography sx={{ color: "#667085" }}>Bu talepten henüz iş emri üretilmedi</Typography>
      ) : (
        <Box sx={{ display: "grid", gap: 1 }}>
          {request.workOrders.map((w) => (
            <Box
              key={w.id}
              role="button"
              title="İş detayını aç"
              onClick={() => onOpenWorkOrder(w.id)}
              sx={{
                p: 1,
                border: "1px solid #E5E7EB",
                borderRadius: 2,
                cursor: "pointer",
                transition: "background-color 0.15s",
                "&:hover": { bgcolor: "#F3F4F6" },
              }}
            >
              <Typography fontSize={13}>
                {systemTypeLabel(w.systemType)} • {jobTypeLabel(w.jobType)} •{" "}
                {toLocalDateTime(w.createdAt)}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
