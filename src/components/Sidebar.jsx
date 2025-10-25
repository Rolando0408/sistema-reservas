// src/components/Sidebar.jsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Home,
  History,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
} from "lucide-react";

export default function Sidebar({ isCollapsed, toggleSidebar }) {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <aside
      className={` bg-[#24243e] text-white flex flex-col transition-all duration-300 ease-in-out ${
        isCollapsed ? "w-16 px-2 py-4" : "w-64 p-4"
      }`}
    >
      {/* --- ENCABEZADO MODIFICADO --- */}
      <div
        className={`mb-6 flex items-center ${
          isCollapsed ? "justify-center" : "justify-between"
        }`}
      >
        {" "}
        {/* ✅ Usa justify-between si no está colapsado */}
        {/* Logo (opcional) */}
        {/* <img src={logo} alt="Logo" className={`h-10 w-auto ${isCollapsed ? '' : 'mr-2'}`} /> */}
        {/* Título (solo si no está colapsado) */}
        {!isCollapsed && <h2 className="text-xl font-bold">UNIMAR Proyecta</h2>}
        <Button
          variant="ghost"
          size="icon" // Hace el botón más pequeño, solo icono
          className="h-8 w-8" // Tamaño específico para el botón de icono
          onClick={toggleSidebar}
          title={isCollapsed ? "Expandir" : "Minimizar"}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </Button>
      </div>
      {/* --- FIN ENCABEZADO MODIFICADO --- */}

      {/* Navegación (sin cambios) */}
      <nav className="flex flex-col space-y-2">
        {/* ... (Tus botones Link/Button) ... */}
        <Button
          asChild
          variant={isActive("/app/dashboard") ? "secondary" : "ghost"}
          className={`w-full ${
            isCollapsed ? "justify-center" : "justify-start"
          }`}
          title="Dashboard"
        >
          <Link to="/app/dashboard">
            <Home className={`h-4 w-4 ${!isCollapsed && "mr-2"}`} />
            {!isCollapsed && <span>Dashboard</span>}
          </Link>
        </Button>
        <Button
          asChild
          variant={isActive("/app/historial") ? "secondary" : "ghost"}
          className={`w-full ${
            isCollapsed ? "justify-center" : "justify-start"
          }`}
          title="Historial"
        >
          <Link to="/app/historial">
            <History className={`h-4 w-4 ${!isCollapsed && "mr-2"}`} />
            {!isCollapsed && <span>Historial</span>}
          </Link>
        </Button>
      </nav>

      {/* ⛔️ El div mt-auto ahora está vacío o lo puedes borrar */}
      <div className="mt-auto">{/* El botón de toggle ya no está aquí */}</div>
    </aside>
  );
}
