// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css"; // ✅ Importa el CSS de Tailwind/shadcn

import { AuthProvider } from "./lib/AuthContext.jsx"; // ✅ Importa el gestor de sesión
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import DashboardProfesor from "./pages/DashboardProfessor.jsx";
import ProtectedRoute from "./lib/ProtectedRoute.jsx";

// Define las rutas de tu aplicación
const router = createBrowserRouter([
  { path: "/", element: <Login /> },
  { path: "/register", element: <Register /> },
  {
    path: "/dashboard",
    element: <ProtectedRoute />, // Ruta protegida
    children: [
      { path: "", element: <DashboardProfesor /> }, // Dashboard del profesor
    ],
  },
]);

// Renderiza la aplicación
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      {" "}
      {/* ✅ Envuelve con el proveedor de autenticación */}
      <RouterProvider router={router} /> {/* ✅ Usa el router */}
    </AuthProvider>
  </React.StrictMode>
);
