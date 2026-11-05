import { useState, useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Layout from "./layout/Layout";
import DashboardPage from "./pages/DashboardPage";
import TechniciansPage from "./pages/technicians/TechniciansPage";
import CustomersPage from "./pages/customers/CustomersPage";
import ServiceRequestsPage from "./pages/servicerequests/ServiceRequestsPage";
import WorkOrdersPage from "./pages/WorkOrdersPage";
import {MapPage} from "./pages/MapPage";
import LoginPage from "./pages/LoginPage";
import type { ReactNode } from "react";
import { isAuthenticated, clearSession, setToken } from "./api/session";
import ErrorBoundary from "./components/ErrorBoundary";
import NotFoundPage from "./pages/NotFoundPage";
import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5290";

function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation();

  if (!isAuthenticated()) {
    clearSession();
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}

export default function App() {
  const [queryClient] = useState(() => new QueryClient());
  const [ready, setReady] = useState(false);

  // Sayfa yenilenince memory'deki token kaybolur.
  // HttpOnly cookie hâlâ var mı diye silent refresh dene.
  useEffect(() => {
    // Zaten token varsa (login sonrası navigation) → direkt ready
    if (isAuthenticated()) {
      setReady(true);
      return;
    }

    let cancelled = false;

    async function tryRefresh() {
      try {
        const res = await axios.post<{ accessToken: string }>(
          `${API_BASE_URL}/api/Auth/refresh`,
          {},
          { withCredentials: true }
        );
        if (!cancelled && res.data.accessToken) {
          setToken(res.data.accessToken);
        }
      } catch {
        // Cookie yoksa veya geçersizse → login'e düşecek
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    tryRefresh();
    return () => { cancelled = true; };
  }, []);

  // Refresh denemesi bitene kadar beyaz ekran (çok kısa, ~100ms)
  if (!ready) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ErrorBoundary>
            <Routes>
              <Route path="/login" element={<LoginPage />} />

            <Route
              element={
                <RequireAuth>
                  <Layout />
                </RequireAuth>
              }
            >
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/technicians" element={<TechniciansPage />} />
              <Route path="/technicians/manage" element={<Navigate to="/technicians" replace />} />
              <Route path="/customers" element={<CustomersPage />} />
              <Route path="/service-requests" element={<ServiceRequestsPage />} />
              <Route path="/workorders" element={<WorkOrdersPage />} />
              <Route path="/map" element={<MapPage />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </ErrorBoundary>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
