import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import * as Sentry from "@sentry/react";
import Login from "./pages/Login.tsx";
import { getToken } from "./stores/token.store.ts";
import Dashboard from "./pages/Dashboard.tsx";

interface PrivateRouteProps {
  children: React.ReactNode;
}

export function PrivateRoute({ children }: PrivateRouteProps) {
  return getToken() ? <>{children}</> : <Navigate to="/login" replace />;
}

function ErrorFallback() {
  return (
    <div>
      <h2>Something went wrong.</h2>
      <button onClick={() => window.location.reload()}>Refresh page</button>
    </div>
  );
}

export default function App() {
  return (
    <Sentry.ErrorBoundary fallback={ErrorFallback}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </Sentry.ErrorBoundary>
  );
}
