import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { getUserName } from "../lib/auth";
export default function Header({ isCollapsed, toggleSidebar, title }) {
  const [userName, setUserName] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const name = await getUserName();
      if (!cancelled) setUserName(name || "Usuario");
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  const displayName = userName || "";
  const firstName = displayName ? displayName.split(" ")[0] : "";

  return (
    <header className="h-16 border-b bg-[#0D4D98] flex items-center px-4 sm:px-6 shrink-0 gap-2">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 mr-4 text-white"
        onClick={toggleSidebar}
        title={isCollapsed ? "Expandir Sidebar" : "Minimizar Sidebar"}
      >
        {isCollapsed ? (
          <PanelLeftOpen className="h-4 w-4" />
        ) : (
          <PanelLeftClose className="h-4 w-4" />
        )}
      </Button>

      <h1 className="text-base sm:text-lg font-semibold text-white truncate min-w-0">
        {title}
      </h1>
      <div className="ml-auto flex items-center">
        <p className="hidden sm:block text-sm text-white truncate max-w-[45vw]">
          Bienvenid@, {displayName || "..."}!
        </p>
        <p className="sm:hidden text-sm text-white truncate max-w-[40vw]">
          {firstName ? `Hola, ${firstName}` : "Hola"}
        </p>
      </div>
    </header>
  );
}
