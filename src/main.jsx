// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import "./index.css";
import "@fontsource/montserrat/400.css";
import "@fontsource/montserrat/500.css";
import "@fontsource/montserrat/700.css";
import "@fontsource/montserrat/900.css";
import { AuthProvider } from "@/lib/AuthContext.jsx"; // Using alias
import Login from "@/pages/Login.jsx"; // Using alias
import Register from "@/pages/Register.jsx"; // Using alias
import DashboardProfessor from "@/pages/DashboardProfessor.jsx"; // Using alias
import ProtectedRoute from "@/lib/ProtectedRoute.jsx"; // Using alias
import ProfessorLayout from "@/layouts/ProfessorLayout.jsx"; // Using alias
import HistorialReservas from "@/pages/HistorialReservas.jsx"; // Using alias

const router = createBrowserRouter([
  // Public Routes
  { path: "/", element: <Login /> },
  { path: "/register", element: <Register /> }, // Changed from /register for consistency

  // Protected Routes under /app prefix
  {
    path: "/app",
    element: <ProtectedRoute />,
    children: [
      {
        // Esta ruta hija coincide con /app y renderiza el layout
        // Outlet en ProtectedRoute mostrará ProfessorLayout
        path: "", // Coincide con /app
        element: <ProfessorLayout />,
        children: [
          // Los hijos DEL LAYOUT
          {
            path: "dashboard", // Ruta completa: /app/dashboard
            element: <DashboardProfessor />,
          },
          {
            path: "historial", // Ruta completa: /app/historial
            element: <HistorialReservas />,
          },
          {
            index: true,
            element: <Navigate to="/app/dashboard" replace />,
          },
        ],
      },
    ],
  },

  // Auth Callback Route
  {
    path: "/auth/callback",
    // Redirects to the protected dashboard after auth
    element: <Navigate to="/app/dashboard" replace />, // <-- Changed redirect path
  },
]);

// Renderiza la aplicación
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);
