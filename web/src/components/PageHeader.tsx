import { Typography, type TypographyProps } from "@mui/material";
import { pageTitleSx } from "../theme/typography";

interface PageHeaderProps extends Omit<TypographyProps, "variant"> {
  children: React.ReactNode;
}

/**
 * Sayfa başlığı.
 * 5 sayfada aynı stil tekrar ediyordu, tek yere alındı.
 *
 * Kullanım:
 *   <PageHeader>Müşteriler</PageHeader>
 */
export default function PageHeader({ children, sx, ...rest }: PageHeaderProps) {
  return (
    <Typography
      variant="h5"
      fontWeight={900}
      mb={3}
      sx={[pageTitleSx, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
      {...rest}
    >
      {children}
    </Typography>
  );
}
