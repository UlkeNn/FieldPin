import { Box, Divider, Typography } from "@mui/material";
import type { WorkOrderDetailDto } from "../../../api/workorders";
import {
  JOB_TYPE,
  WORK_ORDER_OBJECT_ROLE,
  jobTypeLabel,
  systemTypeLabel,
} from "../../../api/workorders";
import { WorkOrderLocationMap } from "../WorkOrderLocationMap";
import ObjectCard from "./ObjectCard";
import RoleSection from "./RoleSection";

interface WorkOrderDetailProps {
  wo: WorkOrderDetailDto;
  technicianName?: string;
  onPhotoClick: (url: string) => void;
}

/**
 * Sağdaki drawer'da gösterilen iş emri detay paneli.
 */
export default function WorkOrderDetail({
  wo,
  technicianName,
  onPhotoClick,
}: WorkOrderDetailProps) {
  const objects = wo.objects ?? [];

  const singleObjects = objects.filter(
    (x) => (x.role ?? WORK_ORDER_OBJECT_ROLE.Single) === WORK_ORDER_OBJECT_ROLE.Single
  );
  const oldObjects = objects.filter((x) => x.role === WORK_ORDER_OBJECT_ROLE.Old);
  const newObjects = objects.filter((x) => x.role === WORK_ORDER_OBJECT_ROLE.New);

  return (
    <Box sx={{ display: "grid", gap: 1.2 }}>
      <Typography>
        <b>Müşteri:</b> {wo.customer ? wo.customer.name ?? wo.customer.id : "-"}
      </Typography>

      <Typography>
        <b>Teknisyen:</b>{" "}
        {technicianName || "—"}
      </Typography>

      <Typography>
        <b>Oluşturulma Tarihi:</b> {new Date(wo.createdAt).toLocaleString()}
      </Typography>

      <Typography>
        <b>Sistem Tipi:</b> {systemTypeLabel(wo.systemType)}
      </Typography>

      <Typography>
        <b>İş Tipi:</b> {jobTypeLabel(wo.jobType)}
      </Typography>

      <Typography>
        <b>Teknisyen Notu:</b> {wo.notes || "-"}
      </Typography>

      <Divider sx={{ my: 1.5 }} />

      <Typography fontWeight={900}>Eklenen Girdi Bilgileri</Typography>

      {objects.length === 0 ? (
        <Typography sx={{ color: "#667085" }}>Girdi yok</Typography>
      ) : wo.jobType === JOB_TYPE.Replace ? (
        <Box sx={{ display: "grid", gap: 2 }}>
          <RoleSection
            title="Eski Nesneler"
            items={oldObjects}
            onPhotoClick={onPhotoClick}
          />
          <RoleSection
            title="Yeni Nesneler"
            items={newObjects}
            onPhotoClick={onPhotoClick}
          />
        </Box>
      ) : (
        <Box sx={{ display: "grid", gap: 1.2 }}>
          {singleObjects.map((o) => (
            <ObjectCard key={o.id} object={o} onPhotoClick={onPhotoClick} />
          ))}
        </Box>
      )}

      {/* ── KONUM ─────────────────────────────────────── */}
      {typeof wo.latitude === "number" && typeof wo.longitude === "number" ? (
        <Box sx={{ display: "grid", gap: 1, mt: 0.5 }}>
          <Typography fontWeight={900}>Konum</Typography>
          <WorkOrderLocationMap
            points={[
              {
                id: wo.id,
                latitude: wo.latitude,
                longitude: wo.longitude,
                systemType: wo.systemType,
                jobType: wo.jobType,
                technicianId: wo.technicianId,
                createdAt: wo.createdAt,
                customerName: wo.customer?.name ?? undefined,
              },
            ]}
          />
        </Box>
      ) : (
        <Typography sx={{ color: "#98A2B3" }} fontSize={13}>
          <b>Konum:</b> kaydedilmemiş
        </Typography>
      )}
    </Box>
  );
}
