import { Chip } from "@mui/material";
import { requestStatusLabel } from "../../../api/serviceRequests";
import { statusColor } from "../utils";

interface ServiceRequestStatusChipProps {
  status: number;
}

/**
 * Talep durumu için renkli chip (6 durum).
 * components/StatusChip.tsx yalnızca aktif/pasif ikili durumu biliyor,
 * bu yüzden domain'e özgü ayrı bir chip.
 */
export default function ServiceRequestStatusChip({
  status,
}: ServiceRequestStatusChipProps) {
  return (
    <Chip
      size="small"
      label={requestStatusLabel(status)}
      color={statusColor(status)}
      sx={{ fontWeight: 800 }}
    />
  );
}
