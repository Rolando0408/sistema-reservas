// src/layouts/ProfessorLayout.jsx
import React, { useEffect, useState } from "react";
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
    case "/app/disponibilidad":
      currentPageTitle = "Disponibilidad";
      break;
    default:
      currentPageTitle = "UNIMAR Proyecta";
  }

  // Evita scroll del body cuando el sidebar móvil está abierto
  useEffect(() => {
    if (!isCollapsed) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    return () => document.body.classList.remove("overflow-hidden");
  }, [isCollapsed]);

  // Actualiza el título del documento según la sección del profesor
  useEffect(() => {
    const brand = "UNIMAR Proyecta";
    const prefix =
      currentPageTitle && currentPageTitle !== brand
        ? `${currentPageTitle} | Profesor`
        : brand;
    document.title = prefix;
  }, [currentPageTitle]);

  return (
    <div className="relative flex h-screen bg-background">
      {/* Overlay oscuro para móvil cuando el sidebar está abierto */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-[2px] md:hidden"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}

      <Sidebar isCollapsed={isCollapsed} />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Header
          isCollapsed={isCollapsed}
          toggleSidebar={toggleSidebar}
          title={currentPageTitle}
        />
        <main className="flex-1 overflow-y-auto">
          {/* Área de contenido principal */}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
