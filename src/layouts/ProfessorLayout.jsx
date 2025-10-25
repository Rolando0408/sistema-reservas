import React, {useState} from "react";
import { Outlet } from "react-router-dom"; // Para mostrar el contenido de la ruta hija
import Sidebar from "@/components/Sidebar"; // Importaremos la Sidebar que crearemos

export default function ProfessorLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    // Ajusta las clases dinámicamente
    <div className="flex h-screen bg-background">
      <Sidebar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />

      {/* El 'main' puede necesitar ajustar su margen izquierdo si la sidebar se encoge */}
      {/* Por ahora, lo dejamos simple */}
      <main className="flex-1 overflow-y-auto transition-all duration-300 ease-in-out">
        <Outlet />
      </main>
    </div>
  );
}
