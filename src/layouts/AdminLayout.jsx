// src/layouts/AdminLayout.jsx
import React, { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import AdminSidebar from "@/components/AdminSidebar";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabaseClient";

export default function AdminLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

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
    default:
      currentPageTitle = "Administración";
  }

  useEffect(() => {
    if (!isCollapsed) document.body.classList.add("overflow-hidden");
    else document.body.classList.remove("overflow-hidden");
    return () => document.body.classList.remove("overflow-hidden");
  }, [isCollapsed]);

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
