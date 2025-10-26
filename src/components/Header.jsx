// src/components/Header.jsx
import React from "react";
import { Button } from "@/components/ui/button";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

// Recibe las props del Layout
export default function Header({ isCollapsed, toggleSidebar, title }) {
  return (
    <header className="h-16 border-b bg-[#0D4D98] flex items-center px-6 shrink-0">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 mr-4 text-white" // Margen a la derecha
        onClick={toggleSidebar}
        title={isCollapsed ? "Expandir Sidebar" : "Minimizar Sidebar"}
      >
        {isCollapsed ? (
          <PanelLeftOpen className="h-4 w-4" />
        ) : (
          <PanelLeftClose className="h-4 w-4" />
        )}
      </Button>

      <h1 className="text-lg font-semibold text-white">{title}</h1>
      {/* Aquí puedes añadir otros elementos del header */}
      {/* Ejemplo: Título de la página (podrías obtenerlo del router) */}
      {/* <h1 className="text-lg font-semibold">Dashboard</h1> */}
      {/* Ejemplo: Menú de usuario (a la derecha) */}
      {/* <div className="ml-auto"> ... Avatar/Dropdown ... </div> */}
    </header>
  );
}
