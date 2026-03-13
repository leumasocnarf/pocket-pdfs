import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import Login from "./pages/Login.tsx";
import { getToken } from "./stores/token.store.ts";

interface PrivateRouteProps {
  children: React.ReactNode;
}

export function PrivateRoute({ children }: PrivateRouteProps) {
  return getToken() ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <div className="dashboard-placeholder">
                <h1>Welcome to Pockets PDF</h1>
                <p>
                  This is a placeholder for the dashboard. More features coming
                  soon!
                </p>
              </div>
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
