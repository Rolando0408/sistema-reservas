// src/lib/ProtectedRoute.jsx
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext"; // Importa el hook para revisar la sesión

export default function ProtectedRoute() {
  const { session } = useAuth(); // Revisa si hay una sesión activa

  if (!session) {
    // Si NO hay sesión, redirige al usuario a la página de Login ("/")
    return <Navigate to="/" replace />;
  }

  // Si SÍ hay sesión, usa <Outlet /> para mostrar el componente hijo
  // (el DashboardProfessor)
  return <Outlet />;
}
