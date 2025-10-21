import React, { useEffect, useRef } from "react";
import "datatables.net-dt/css/dataTables.dataTables.css";
import DataTable from "datatables.net-dt";
import Swal from "sweetalert2";
import "./ReservationsTable.css";

export default function ReservationsTable({ data, onCancel, equipmentMaps }) {
  const tableRef = useRef(null);
  const dtRef = useRef(null);

  const formatDate = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    const parts = new Intl.DateTimeFormat("es-VE", {
      timeZone: "America/Caracas",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).formatToParts(d);
    const get = (type) => parts.find((p) => p.type === type)?.value || "";
    const dd = get("day");
    const mm = get("month");
    const yyyy = get("year");
    return `${dd}-${mm}-${yyyy}`;
  };

  const formatTime = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    const parts = new Intl.DateTimeFormat("es-VE", {
      timeZone: "America/Caracas",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(d);
    const get = (type) => parts.find((p) => p.type === type)?.value || "";
    const hh = get("hour");
    const min = get("minute");
    return `${hh}:${min}`;
  };

  const estadoToText = (estado) => {
    switch (estado) {
      case 1:
        return "Activa";
      case 0:
        return "Pendiente";
      case 2:
        return "Cancelada";
      case 3:
        return "Finalizada";
      default:
        return String(estado ?? "");
    }
  };

  const estadoToClass = (estado) => {
    switch (estado) {
      case 1:
        return "estado-activa";
      case 0:
        return "estado-pendiente";
      case 2:
        return "estado-cancelada";
      case 3:
        return "estado-finalizada";
      default:
        return "estado-desconocido";
    }
  };

  useEffect(() => {
    if (!tableRef.current) return;
    // Destroy previous instance
    if (dtRef.current) {
      dtRef.current.destroy();
      dtRef.current = null;
    }

    const rows = data.map((r) => {
      const fecha = formatDate(r.fecha_hora_inicio);
      const horario = `${formatTime(r.fecha_hora_inicio)} - ${formatTime(
        r.fecha_hora_fin
      )}`;
      const estadoHtml = `<span class="estado-badge ${estadoToClass(
        r.estado
      )}">${estadoToText(r.estado)}</span>`;
      const pills = [];
      const added = new Set();
      // Proyector (equipo) + puertos
      if (r.id_equipo != null) {
        pills.push(`
          <span class="equip-badge equip-equipo">
            <svg class="icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="16" height="16" aria-hidden="true">
              <path d="M3 5h18v10H3V5Zm2 2v6h14V7H5Zm-2 12h18v2H3v-2Z" />
            </svg>
            Proyector
          </span>`);
        added.add("proyector");
        const spec = equipmentMaps?.equipos?.[r.id_equipo];
        if (spec?.hdmi && !added.has("hdmi")) {
          pills.push(`
            <span class="equip-badge equip-extension">
              <svg class="icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="16" height="16" aria-hidden="true">
                <path d="M7 3h10v2H7V3Zm10 4H7l-2 4h14l-2-4Zm-9 6h8v8H8v-8Z" />
              </svg>
              HDMI
            </span>`);
          added.add("hdmi");
        }
        if (spec?.vga && !added.has("vga")) {
          pills.push(`
            <span class="equip-badge equip-extension">
              <svg class="icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="16" height="16" aria-hidden="true">
                <path d="M7 3h10v2H7V3Zm10 4H7l-2 4h14l-2-4Zm-9 6h8v8H8v-8Z" />
              </svg>
              VGA
            </span>`);
          added.add("vga");
        }
      }
      // Computadora (laptop)
      if (r.id_laptop != null) {
        pills.push(`
          <span class="equip-badge equip-laptop">
            <svg class="icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="16" height="16" aria-hidden="true">
              <path d="M4 6h16a2 2 0 0 1 2 2v8h-2V8H4v8H2V8a2 2 0 0 1 2-2Zm-2 12h20v2H2v-2Z" />
            </svg>
            Computadora
          </span>`);
      }
      // Extensión seleccionada explícitamente: decidir HDMI o VGA por el nombre original si está disponible
      if (r.id_extension != null) {
        const extSource = equipmentMaps?.extensiones?.[r.id_extension] || "";
        pills.push(`
          <span class="equip-badge equip-extension">
            <svg class="icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="16" height="16" aria-hidden="true">
              <path d="M7 3h10v2H7V3Zm10 4H7l-2 4h14l-2-4Zm-9 6h8v8H8v-8Z" />
            </svg>
            Extensión eléctrica
          </span>`);
      }
      const equipHtml = pills.length ? pills.join("\n") : "";
      return [
        fecha,
        horario,
        equipHtml,
        r.aula || "",
        estadoHtml,
        r.estado === 2
          ? ""
          : `<button class="dt-icon-btn dt-icon-btn--danger dt-cancel" data-id="${r.id}" aria-label="Cancelar" title="Cancelar">
               <svg class="icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="22" height="22" aria-hidden="true">
                 <path d="M9 3h6a1 1 0 0 1 1 1v2h4v2h-1v11a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V8H4V6h4V4a1 1 0 0 1 1-1Zm1 3h4V5h-4v1Zm-3 2v11a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V8H7Zm3 2h2v7h-2v-7Zm4 0h2v7h-2v-7Z"/>
               </svg>
             </button>`,
      ];
    });

    dtRef.current = new DataTable(tableRef.current, {
      data: rows,
      columns: [
        { title: "Fecha" },
        { title: "Horario" },
        { title: "Equipamiento" },
        { title: "Aula" },
        { title: "Estado" },
        { title: "Acciones", orderable: false, searchable: false },
      ],
      columnDefs: [{ className: "dt-center", targets: "_all" }],
      pageLength: 5,
      lengthChange: false,
      searching: true,
      destroy: true,
    });

    // Delegated click handler for cancel buttons
    const clickHandler = async (e) => {
      const btn = e.target.closest(".dt-cancel");
      if (!btn) return;
      const id = btn.getAttribute("data-id");
      if (!id || typeof onCancel !== "function") return;

      const result = await Swal.fire({
        title: "¿Cancelar reservación?",
        text: "Esta acción no se puede deshacer.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, cancelar",
        cancelButtonText: "No",
        confirmButtonColor: "#d33",
        reverseButtons: true,
        focusCancel: true,
      });
      if (!result.isConfirmed) return;
      onCancel(id);
    };
    tableRef.current.addEventListener("click", clickHandler);

    return () => {
      if (tableRef.current) {
        tableRef.current.removeEventListener("click", clickHandler);
      }
      if (dtRef.current) {
        dtRef.current.destroy();
        dtRef.current = null;
      }
    };
  }, [data]);

  return (
    <div className="reservations-table">
      <table ref={tableRef} style={{ width: "100%" }} />
    </div>
  );
}
