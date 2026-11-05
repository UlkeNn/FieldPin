import { Box, Typography, CircularProgress } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { getTechnicians } from "../api/technicians";
import { adminListCustomers } from "../api/customers";
import GlassPaper from "../components/GlassPaper";
import PageHeader from "../components/PageHeader";

export default function DashboardPage() {
  const techs = useQuery({
    queryKey: ["technicians"],
    queryFn: () => getTechnicians(),
  });
  const customers = useQuery({
    queryKey: ["customers"],
    queryFn: () => adminListCustomers(),
  });

  const cards = [
    {
      title: "Aktif Çalışanlar",
      value: techs.data?.filter((t) => t.isActive).length ?? "–",
      total: techs.data?.length,
      loading: techs.isLoading,
    },
    {
      title: "Aktif Müşteriler",
      value: customers.data?.filter((c) => c.isActive).length ?? "–",
      total: customers.data?.length,
      loading: customers.isLoading,
    },
  ];

  return (
    <Box sx={{ p: 2 }}>
      <PageHeader>Gösterge Paneli</PageHeader>

      <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
        {cards.map((card) => (
          <GlassPaper
            key={card.title}
            glassVariant="strong"
            sx={{ p: 3, minWidth: 220 }}
          >
            <Typography variant="body2" sx={{ color: "white" }} mb={1}>
              {card.title}
            </Typography>

            {card.loading ? (
              <CircularProgress size={24} sx={{ color: "white" }} />
            ) : (
              <Typography variant="h4" fontWeight={700} sx={{ color: "white" }}>
                {card.value}
                {card.total !== undefined && (
                  <Typography
                    component="span"
                    variant="body2"
                    sx={{ color: "rgba(255,255,255,0.90)" }}
                    ml={1}
                  >
                    / {card.total} toplam
                  </Typography>
                )}
              </Typography>
            )}
          </GlassPaper>
        ))}
      </Box>
    </Box>
  );
}
