import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary.tsx";
import { ToastProvider } from "./context/ToastContext.tsx";
import { AuthProvider } from "./context/AuthContext.tsx";
import { SyncProvider } from "./context/SyncContext.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <SyncProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </SyncProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  </StrictMode>,
);
