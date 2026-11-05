import { Component } from "react";
import type { ReactNode, ErrorInfo } from "react";
import { Box, Button, Typography } from "@mui/material";

type Props = { children: ReactNode };
type State = { hasError: boolean };

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="h5" fontWeight={700} mb={1}>
              Bir hata oluştu
            </Typography>
            <Typography color="text.secondary" mb={2}>
              Sayfa beklenmeyen bir hatayla karşılaştı.
            </Typography>
            <Button
              variant="contained"
              onClick={() => window.location.assign("/")}
            >
              Ana Sayfaya Dön
            </Button>
          </Box>
        </Box>
      );
    }

    return this.props.children;
  }
}