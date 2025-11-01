import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import AuthCallback from "./pages/AuthCallback.jsx";
import VerifyEmail from "./pages/VerifyEmail.jsx";
import DashboardProfessor from "./pages/DashboardProfessor.jsx";
import HistorialReservas from "./pages/HistorialReservas.jsx";
import ProtectedRoute from "./lib/ProtectedRoute.jsx";
import ProfessorLayout from "./layouts/ProfessorLayout.jsx";
import Disponibilidad from "./pages/Disponibilidad.jsx"; // <-- Importado
import AdminLayout from "./layouts/AdminLayout.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AdminHistorial from "./pages/AdminHistorial.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Rutas Protegidas (dentro del Layout) */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <ProfessorLayout />
            </ProtectedRoute>
          }
        >
          {/* La ruta índice (si solo pones /app, te lleva al dashboard) */}
          <Route index element={<Navigate to="/app/dashboard" replace />} />

          {/* Las páginas hijas que se mostrarán dentro del Layout */}
          <Route path="dashboard" element={<DashboardProfessor />} />
          <Route path="historial" element={<HistorialReservas />} />

          <Route path="disponibilidad" element={<Disponibilidad />} />
        </Route>

        {/* Rutas de Admin */}
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
        </Route>

        {/* Fallback (atrapa cualquier ruta no definida y la envía al inicio) */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
