import {
  Box,
  IconButton,
  Stack,
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
import type { Technician } from "../../../api/technicians";
import StatusChip from "../../../components/StatusChip";
import { TechnicianAvatar } from "./TechnicianAvatar";
import { ageFromBirthDate, toLocalDateTime } from "../../../utils/format";

interface TechniciansTableProps {
  rows: Technician[];
  onEdit: (t: Technician) => void;
  onToggleActivation: (t: Technician) => void;
  onSoftDelete: (t: Technician) => void;
  activationPending: boolean;
  deletePending: boolean;
}

function roleLabel(role?: string) {
  if (role === "Technician") return "Teknisyen";
  if (role === "Admin") return "Admin";
  return role ?? "-";
}

export default function TechniciansTable({
  rows,
  onEdit,
  onToggleActivation,
  onSoftDelete,
  activationPending,
  deletePending,
}: TechniciansTableProps) {
  if (rows.length === 0) {
    return <Typography sx={{ color: "#667085" }}>Kayıt yok.</Typography>;
  }

  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Çalışan</TableCell>
          <TableCell>İletişim</TableCell>
          <TableCell>Yaş</TableCell>
          <TableCell>Durum</TableCell>
          <TableCell>Oluşturma</TableCell>
          <TableCell align="right">İşlemler</TableCell>
        </TableRow>
      </TableHead>

      <TableBody>
        {rows.map((t) => (
          <TableRow key={t.id} hover>
            <TableCell>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <TechnicianAvatar
                  src={t.avatarUrl}
                  username={t.username}
                  size={36}
                  enablePreview
                />
                <Box>
                  <Typography fontWeight={800}>{t.username}</Typography>
                  <Typography fontSize={12} sx={{ color: "#667085" }}>
                    {roleLabel(t.role)} • {t.id}
                  </Typography>
                </Box>
              </Stack>
            </TableCell>

            <TableCell>
              <Typography fontSize={13}>
                {t.email || <span style={{ color: "#667085" }}>mail yok</span>}
              </Typography>
              <Typography fontSize={13}>
                {t.phone || <span style={{ color: "#667085" }}>telefon yok</span>}
              </Typography>
            </TableCell>

            <TableCell>{ageFromBirthDate(t.birthDate) ?? "-"}</TableCell>

            <TableCell>
              <StatusChip active={t.isActive} />
            </TableCell>

            <TableCell>{toLocalDateTime(t.createdAtUtc)}</TableCell>

            <TableCell align="right">
              <Tooltip title="Düzenle">
                <IconButton onClick={() => onEdit(t)}>
                  <EditIcon />
                </IconButton>
              </Tooltip>

              <Tooltip title={t.isActive ? "Pasif Yap" : "Aktif Yap"}>
                <span>
                  <IconButton
                    onClick={() => onToggleActivation(t)}
                    disabled={activationPending}
                    color="warning"
                  >
                    {t.isActive ? <BlockIcon /> : <CheckCircleIcon />}
                  </IconButton>
                </span>
              </Tooltip>

              <Tooltip
                title={t.isActive ? "Silmek için önce pasif yapın" : "Sil"}
              >
                <span>
                  <IconButton
                    onClick={() => onSoftDelete(t)}
                    disabled={t.isActive || deletePending}
                    color="error"
                  >
                    <DeleteOutlineIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
