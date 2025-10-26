// src/layouts/ProfessorLayout.jsx
import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header"; // 👈 1. Importa el nuevo Header

export default function ProfessorLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

let currentPageTitle;
switch (location.pathname) {
  case "/app/dashboard":
    currentPageTitle = "Dashboard";
    break;
  case "/app/historial":
    currentPageTitle = "Historial de Reservas";
    break;
  default:
    currentPageTitle = "UNIMAR Proyecta";
}

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isCollapsed={isCollapsed} />

      <div className="flex flex-col flex-1 overflow-hidden">
        
        <Header isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} title={currentPageTitle} />
        <main className="flex-1 overflow-y-auto">
          {/* Área de contenido principal */}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
