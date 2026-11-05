import {
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
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import type { CustomerDto } from "../../../api/customers";
import StatusChip from "../../../components/StatusChip";
import { toLocalDateTime } from "../../../utils/format";

interface CustomersTableProps {
  rows: CustomerDto[];
  onEdit: (c: CustomerDto) => void;
  onToggleActivation: (c: CustomerDto) => void;
  onSoftDelete: (c: CustomerDto) => void;
  activationPending: boolean;
  deletePending: boolean;
}

export default function CustomersTable({
  rows,
  onEdit,
  onToggleActivation,
  onSoftDelete,
  activationPending,
  deletePending,
}: CustomersTableProps) {
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Ad</TableCell>
          <TableCell>Telefon</TableCell>
          <TableCell>Bilgi</TableCell>
          <TableCell>Durum</TableCell>
          <TableCell>Oluşturma</TableCell>
          <TableCell align="right">İşlemler</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6}>
              <Typography variant="body2" sx={{ py: 2 }}>
                Kayıt bulunamadı.
              </Typography>
            </TableCell>
          </TableRow>
        ) : (
          rows.map((c) => (
            <TableRow key={c.id} hover>
              <TableCell sx={{ fontWeight: 600 }}>{c.name ?? "-"}</TableCell>
              <TableCell>{c.phone ?? "-"}</TableCell>
              <TableCell sx={{ maxWidth: 420 }}>
                <Typography variant="body2" noWrap title={c.info ?? ""}>
                  {c.info ?? "-"}
                </Typography>
              </TableCell>
              <TableCell>
                <StatusChip active={c.isActive} />
              </TableCell>
              <TableCell>{toLocalDateTime(c.createdAtUtc)}</TableCell>
              <TableCell align="right">
                <Tooltip title="Düzenle">
                  <IconButton onClick={() => onEdit(c)}>
                    <EditIcon />
                  </IconButton>
                </Tooltip>

                <Tooltip title={c.isActive ? "Pasif Yap" : "Aktif Yap"}>
                  <span>
                    <IconButton
                      onClick={() => onToggleActivation(c)}
                      disabled={activationPending}
                      color="warning"
                    >
                      {c.isActive ? <BlockIcon /> : <CheckCircleIcon />}
                    </IconButton>
                  </span>
                </Tooltip>

                <Tooltip
                  title={c.isActive ? "Silmek için önce pasif yapın" : "Sil"}
                >
                  <span>
                    <IconButton
                      onClick={() => onSoftDelete(c)}
                      disabled={c.isActive || deletePending}
                      color="error"
                    >
                      <DeleteOutlineIcon />
                    </IconButton>
                  </span>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
