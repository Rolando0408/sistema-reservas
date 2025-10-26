// src/components/Sidebar.jsx
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Home,
  History,
  LogOut,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import Swal from "sweetalert2";
import logo from "../assets/logo-3.png";
import logo2 from "../assets/logo-4.png";

export default function Sidebar({ isCollapsed}) {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;
  const navigate = useNavigate();

    const onSignOut = async () => {
      try {
        const result = await Swal.fire({
          title: "¿Cerrar sesión?",
          text: "Se cerrará tu sesión actual.",
          icon: "question",
          showCancelButton: true,
          confirmButtonText: "Sí, cerrar sesión",
          cancelButtonText: "Cancelar",
          reverseButtons: true,
          focusCancel: true,
        });
        if (!result.isConfirmed) return;
        await supabase.auth.signOut();
        navigate("/");
      } catch (err) {
        Swal.fire("Error", err.message || "No se pudo cerrar sesión", "error");
      } finally {
      }
    };

  return (
    <aside
      className={` z-10 shadow-sidebar-light bg-[#0D4D98] text-white flex flex-col transition-all duration-500 ease-in-out${
        isCollapsed ? "w-16 px-2 py-4" : "w-63.5 p-4"
      }`}
    >
      {/* --- ENCABEZADO MODIFICADO --- */}
      <div
        className={`mb-6 flex items-center ${
          isCollapsed ? "justify-center" : "justify-between"
        }`}
      >
        {isCollapsed ? (
          // Muestra logo simple si está colapsado
          <img src={logo} alt="UNIMAR" className="h-8 w-auto transition-all duration-500 ease-in-out" /> // Ajusta tamaño h-8
        ) : (
          // Muestra logo largo si está expandido
          <img src={logo2} alt="UNIMAR Proyecta" className="h-12 w-auto transition-all duration-500 ease-in-out" /> // Ajusta tamaño h-10
        )}
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
      <div className="mt-auto">
        <Button
          variant="ghost" // Mismo 'variant' que los otros botones
          className={`w-full ${
            isCollapsed ? "justify-center" : "justify-start"
          }`} // Mismo ajuste de justificación
          onClick={onSignOut}
          title="Cerrar Sesión"
        >
          <LogOut className={`h-4 w-4 ${!isCollapsed && "mr-2"}`} />{" "}
          {/* Icono LogOut */}
          {!isCollapsed && <span>Cerrar Sesión</span>}{" "}
          {/* Muestra/oculta texto */}
        </Button>
      </div>
    </aside>
  );
}
