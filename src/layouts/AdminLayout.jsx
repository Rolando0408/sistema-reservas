// src/layouts/AdminLayout.jsx
import React, { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import AdminSidebar from "@/components/AdminSidebar";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabaseClient";
import { useIsMobile } from "@/hooks/use-mobile";

export default function AdminLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  // Guard: solo rol 1 (admin)
  useEffect(() => {
    const guard = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        navigate("/");
        return;
      }
      const userId = sessionData.session.user.id;
      const { data: perfil, error } = await supabase
        .from("usuarios")
        .select("id, id_rol_fk")
        .eq("id", userId)
        .single();
      if (error || perfil?.id_rol_fk !== 1) {
        navigate("/");
        return;
      }
    };
    guard();
  }, [navigate]);

  let currentPageTitle;
  switch (location.pathname) {
    case "/admin/dashboard":
      currentPageTitle = "Dashboard";
      break;
    case "/admin/historial":
      currentPageTitle = "Historial de Reservas";
      break;
    case "/admin/disponibilidad":
      currentPageTitle = "Disponibilidad";
      break;
    case "/admin/inventario": {
      const sp = new URLSearchParams(location.search);
      const tab = sp.get("tab") || "equipos";
      const label =
        tab === "laptops"
          ? "Laptops"
          : tab === "extensiones"
          ? "Extensiones"
          : "Proyectores";
      currentPageTitle = `Inventario - ${label}`;
      break;
    }
    default:
      currentPageTitle = "Administración";
  }

  useEffect(() => {
    if (!isCollapsed) document.body.classList.add("overflow-hidden");
    else document.body.classList.remove("overflow-hidden");
    return () => document.body.classList.remove("overflow-hidden");
  }, [isCollapsed]);

  // Actualiza el título del documento según la sección del admin
  useEffect(() => {
    const brand = "UNIMAR Proyecta";
    const prefix =
      currentPageTitle && currentPageTitle !== "Administración"
        ? `${currentPageTitle} | Admin`
        : `${brand} | Admin`;
    document.title = prefix;
  }, [currentPageTitle]);

  // Cierra automáticamente el sidebar en móvil cuando cambia la ruta
  useEffect(() => {
    if (isMobile && !isCollapsed) {
      setIsCollapsed(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search, isMobile]);

  return (
    <div className="relative flex h-screen bg-background">
      {!isCollapsed && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-[2px] md:hidden"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}

      <AdminSidebar isCollapsed={isCollapsed} />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Header
          isCollapsed={isCollapsed}
          toggleSidebar={toggleSidebar}
          title={currentPageTitle}
        />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
