import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import AuthCallback from "./pages/AuthCallback.jsx";
import VerifyEmail from "./pages/VerifyEmail.jsx";
import DashboardProfessor from "./pages/DashboardProfessor.jsx";
import HistorialReservas from "./pages/HistorialReservas.jsx";
import ProtectedRoute from "./lib/ProtectedRoute.jsx";
import ProfessorLayout from "./layouts/ProfessorLayout.jsx";
import Disponibilidad from "./pages/Disponibilidad.jsx";
import AdminLayout from "./layouts/AdminLayout.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AdminHistorial from "./pages/AdminHistorial.jsx";
import AdminInventario from "./pages/AdminInventario.jsx";
import AdminReportes from "./pages/AdminReportes.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

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

          <Route path="disponibilidad" element={<Disponibilidad />} />
        </Route>

        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="disponibilidad" element={<Disponibilidad />} />
          <Route path="historial" element={<AdminHistorial />} />
          <Route path="inventario" element={<AdminInventario />} />
          <Route path="reportes" element={<AdminReportes />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
