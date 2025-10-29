import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import AuthCallback from "./pages/AuthCallback.jsx";
import DashboardProfessor from "./pages/DashboardProfessor.jsx";
import HistorialReservas from "./pages/HistorialReservas.jsx";
import ProtectedRoute from "./lib/ProtectedRoute.jsx";
import ProfessorLayout from "./layouts/ProfessorLayout.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Públicas */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Protegidas bajo layout */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <ProfessorLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardProfessor />} />
          <Route path="historial" element={<HistorialReservas />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
