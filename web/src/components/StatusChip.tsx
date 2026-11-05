import { Chip } from "@mui/material";

interface StatusChipProps {
  active: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
}

/**
 * Aktif/Pasif durumu için chip.
 * CustomersPage ve TechniciansPage'de aynı stil tekrar ediyordu, tek yere alındı.
 */
export default function StatusChip({
  active,
  activeLabel = "Aktif",
  inactiveLabel = "Pasif",
}: StatusChipProps) {
  return (
    <Chip
      size="small"
      label={active ? activeLabel : inactiveLabel}
      sx={{
        fontWeight: 800,
        ...(active
          ? { bgcolor: "rgba(0,128,0,0.08)", color: "green" }
          : { bgcolor: "rgba(0,0,0,0.06)", color: "gray" }),
      }}
    />
  );
}
