// src/components/AdminSidebar.jsx
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, LogOut, History, Calendar } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import Swal from "sweetalert2";
import logo from "../assets/logo-3.png";
import logo2 from "../assets/logo-4.png";

export default function AdminSidebar({ isCollapsed }) {
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
    }
  };

  return (
    <aside
      aria-label="Barra lateral de navegación"
      className={`shadow-sidebar-light bg-[#0D4D98] text-white flex flex-col z-40
        transition-all duration-300 ease-in-out
        fixed inset-y-0 left-0
        ${isCollapsed ? "-translate-x-full" : "translate-x-0"}
        md:relative md:translate-x-0
        ${isCollapsed ? "md:w-16 md:px-2 md:py-4" : "md:w-22 md:p-2"}`}
    >
      <div
        className={`mb-6 flex items-center ${
          isCollapsed ? "justify-center" : "justify-between"
        }`}
      >
        {isCollapsed ? (
          <img src={logo} alt="UNIMAR" className="h-8 w-auto" />
        ) : (
          <img
            src={logo2}
            alt="UNIMAR Proyecta"
            className="h-12 w-auto px-10 mt-5"
          />
        )}
      </div>

      <nav className="flex flex-col space-y-2">
        <Button
          asChild
          variant={isActive("/admin/dashboard") ? "secondary" : "ghost"}
          className={`w-full ${
            isCollapsed ? "justify-center" : "justify-start"
          }`}
          title="Dashboard"
        >
          <Link to="/admin/dashboard">
            <Home className={`h-4 w-4 ${!isCollapsed && "mr-2"}`} />
            {!isCollapsed && <span>Dashboard</span>}
          </Link>
        </Button>

        <Button
          asChild
          variant={isActive("/admin/disponibilidad") ? "secondary" : "ghost"}
          className={`w-full ${
            isCollapsed ? "justify-center" : "justify-start"
          }`}
          title="Disponibilidad"
        >
          <Link to="/admin/disponibilidad">
            <Calendar className={`h-4 w-4 ${!isCollapsed && "mr-2"}`} />
            {!isCollapsed && <span>Disponibilidad</span>}
          </Link>
        </Button>

        <Button
          asChild
          variant={isActive("/admin/historial") ? "secondary" : "ghost"}
          className={`w-full ${
            isCollapsed ? "justify-center" : "justify-start"
          }`}
          title="Historial"
        >
          <Link to="/admin/historial">
            <History className={`h-4 w-4 ${!isCollapsed && "mr-2"}`} />
            {!isCollapsed && <span>Historial</span>}
          </Link>
        </Button>
      </nav>

      <div className="mt-auto">
        <Button
          variant="ghost"
          className={`w-full mb-2 ${
            isCollapsed ? "justify-center" : "justify-start"
          }`}
          onClick={onSignOut}
          title="Cerrar Sesión"
        >
          <LogOut className={`h-4 w-4 ${!isCollapsed && "mr-2"}`} />
          {!isCollapsed && <span>Cerrar Sesión</span>}
        </Button>
      </div>
    </aside>
  );
}
