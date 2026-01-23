import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute({ children }) {
  const { session } = useAuth();

  if (!session) {
    return <Navigate to="/" replace />;
  }

  return children ? children : <Outlet />;
}
