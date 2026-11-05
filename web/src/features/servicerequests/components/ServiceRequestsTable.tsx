import {
  Box,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import type { ServiceRequestListItemDto } from "../../../api/serviceRequests";
import { requestPriorityLabel } from "../../../api/serviceRequests";
import { jobTypeLabel } from "../../../api/workorders";
import { toLocalDateTime } from "../../../utils/format";
import ServiceRequestStatusChip from "./ServiceRequestStatusChip";

interface ServiceRequestsTableProps {
  rows: ServiceRequestListItemDto[];
  onSelect: (row: ServiceRequestListItemDto) => void;
  onEdit: (row: ServiceRequestListItemDto) => void;
  onSoftDelete: (row: ServiceRequestListItemDto) => void;
  deletePending: boolean;
}

/**
 * TechniciansTable.tsx / CustomersTable.tsx deseni: ilişkili alanlar
 * tek hücrede iki satır halinde birleştirilir (mobilde tablo dar kalsın
 * diye), sekmeli ayrı sütunlara bölünmez.
 */
export default function ServiceRequestsTable({
  rows,
  onSelect,
  onEdit,
  onSoftDelete,
  deletePending,
}: ServiceRequestsTableProps) {
  if (rows.length === 0) {
    return <Typography sx={{ color: "#667085" }}>Kayıt bulunamadı.</Typography>;
  }

  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Talep</TableCell>
          <TableCell>Müşteri / İş Tipi</TableCell>
          <TableCell>Öncelik</TableCell>
          <TableCell>Durum</TableCell>
          <TableCell>Atanan</TableCell>
          <TableCell>Oluşturma / SLA</TableCell>
          <TableCell align="right">İşlemler</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.id} hover onClick={() => onSelect(r)} sx={{ cursor: "pointer" }}>
            <TableCell sx={{ maxWidth: 220 }}>
              <Typography fontWeight={800} fontSize={13}>
                {r.requestNo}
              </Typography>
              <Typography fontSize={13} noWrap title={r.title}>
                {r.title}
              </Typography>
            </TableCell>

            <TableCell sx={{ maxWidth: 200 }}>
              <Typography fontSize={13} noWrap title={r.customer?.name ?? undefined}>
                {r.customer?.name ?? "-"}
              </Typography>
              <Typography fontSize={12} sx={{ color: "#667085" }} noWrap>
                {jobTypeLabel(r.jobType)}
              </Typography>
            </TableCell>

            <TableCell>{requestPriorityLabel(r.priority)}</TableCell>

            <TableCell>
              <ServiceRequestStatusChip status={r.status} />
            </TableCell>

            <TableCell>{r.assignedUserName ?? "-"}</TableCell>

            <TableCell>
              <Typography fontSize={13}>{toLocalDateTime(r.createdAtUtc)}</Typography>
              <Typography
                fontSize={12}
                sx={{ color: r.isOverdue ? "error.main" : "#667085", fontWeight: r.isOverdue ? 700 : 400 }}
              >
                {r.slaDueAtUtc ? `SLA: ${toLocalDateTime(r.slaDueAtUtc)}` : "SLA yok"}
                {r.isOverdue ? " (gecikti)" : ""}
              </Typography>
            </TableCell>

            <TableCell align="right" onClick={(e) => e.stopPropagation()}>
              <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <Tooltip title="Düzenle">
                  <IconButton onClick={() => onEdit(r)}>
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Sil">
                  <span>
                    <IconButton onClick={() => onSoftDelete(r)} disabled={deletePending} color="error">
                      <DeleteOutlineIcon />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
