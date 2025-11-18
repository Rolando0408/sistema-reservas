import React from "react";
import { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
} from "@tanstack/react-table";
import Swal from "sweetalert2";
import "./ReservationsTable.css";

export default function ReservationsTable({
  data = [],
  onCancel,
  onEdit,
  equipmentMaps = {},
  showCancelButton = true,
  showEditButton = true,
  onComplete,
  showUsuario = false,
  usuariosMap = {},
}) {
  const [globalFilter, setGlobalFilter] = useState("");
  const showDetails = (row) => {
    try {
      const aulaNombre =
        (equipmentMaps?.aulas && row.id_aula != null
          ? equipmentMaps.aulas[row.id_aula]
          : undefined) ||
        row.aula ||
        "—";
      const equipoSpec =
        row.id_equipo != null ? equipmentMaps?.equipos?.[row.id_equipo] : null;
      const equipoNombre = equipoSpec?.nombre || "—";
      const laptopNombre =
        row.id_laptop != null
          ? equipmentMaps?.laptops?.[row.id_laptop] || "—"
          : "Ninguna";
      const extensionNombre =
        row.id_extension != null
          ? equipmentMaps?.extensiones?.[row.id_extension] || "—"
          : "Ninguna";
      const connTypes = [];
      if (equipoSpec?.hdmi) connTypes.push("HDMI");
      if (equipoSpec?.vga) connTypes.push("VGA");
      const connLabel = connTypes.length ? connTypes.join(" / ") : "—";
      const { label: estadoLabel } = deriveEstado(row);
      const profesorNombre = showUsuario
        ? usuariosMap && row.id_usuario
          ? usuariosMap[row.id_usuario]
          : ""
        : "";

      const html = `
        <div style="text-align:left;display:grid;grid-template-columns:140px 1fr;gap:8px 12px;align-items:center;">
          ${
            showUsuario
              ? `<div style='color:#6b7280'>Profesor</div><div>${
                  profesorNombre || "—"
                }</div>`
              : ""
          }
          <div style='color:#6b7280'>Fecha</div><div>${formatDate(
            row.fecha_hora_inicio
          )}</div>
          <div style='color:#6b7280'>Horario</div><div>${formatTime(
            row.fecha_hora_inicio
          )} - ${formatTime(row.fecha_hora_fin)}</div>
          <div style='color:#6b7280'>Estado</div><div>${estadoLabel}</div>
          <div style='color:#6b7280'>Aula</div><div>${aulaNombre}</div>
          <div style='grid-column:1/-1;height:1px;background:#e5e7eb;margin:4px 0 2px'></div>
          <div style='color:#6b7280'>Proyector</div><div>${equipoNombre}</div>
          <div style='color:#6b7280'>Conexión</div><div>${connLabel}</div>
          <div style='color:#6b7280'>Laptop</div><div>${laptopNombre}</div>
          <div style='color:#6b7280'>Extensión</div><div>${extensionNombre}</div>
        </div>`;
      Swal.fire({
        title: "Detalles de reservación",
        html,
        icon: "info",
        confirmButtonText: "Cerrar",
        focusConfirm: true,
        width: 560,
      });
    } catch (e) {
      Swal.fire("Detalles", "No se pudieron mostrar los detalles", "error");
    }
  };
  const headerClass = (id) => {
    if (id === "equipamiento" || id === "aula") return "hidden md:table-cell";
    return "";
  };
  const cellClass = (id) => {
    if (id === "equipamiento" || id === "aula") return "hidden md:table-cell";
    return "";
  };

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

  // Deriva el estado visible según tiempo y estado guardado
  const deriveEstado = (row) => {
    const now = new Date();
    const start = new Date(row.fecha_hora_inicio);
    const end = new Date(row.fecha_hora_fin);
    const stored = row.estado;
    // Estados persistidos (códigos de ESTADOS_RESERVA)
    if (stored === 2)
      return { label: "Cancelada", className: "estado-cancelada" };
    if (stored === 3)
      return { label: "Completada", className: "estado-finalizada" };
    if (stored === 4)
      return { label: "Cancelada (usuario)", className: "estado-cancelada" };
    if (stored === 5)
      return { label: "Cancelada (admin)", className: "estado-cancelada" };
    if (stored === 6)
      return { label: "No-Show", className: "estado-cancelada" };
    if (stored === 7)
      return { label: "Expirada", className: "estado-pendiente" };
    if (stored === 8)
      return { label: "Pend. retiro", className: "estado-pendiente" };
    if (stored === 9)
      return { label: "Entregado", className: "estado-activa" };
    if (stored === 10)
      return { label: "Pend. entrega", className: "estado-pendiente" };
    // Dinámico por tiempo, fallback
    if (now < start)
      return { label: "Reservado", className: "estado-reservado" };
    if (now >= start && now <= end)
      return { label: "Activa", className: "estado-activa" };
    return { label: "Pendiente", className: "estado-pendiente" };
  };
  const columns = useMemo(
    () => [
      ...(showUsuario
        ? [
            {
              accessorFn: (row) =>
                (usuariosMap && row.id_usuario
                  ? usuariosMap[row.id_usuario]
                  : "") || "",
              id: "usuario",
              header: "Profesor",
              cell: (info) => info.getValue(),
            },
          ]
        : []),
      {
        accessorFn: (row) => formatDate(row.fecha_hora_inicio),
        id: "fecha",
        header: "Fecha",
        cell: (info) => info.getValue(),
      },
      {
        accessorFn: (row) =>
          `${formatTime(row.fecha_hora_inicio)} - ${formatTime(
            row.fecha_hora_fin
          )}`,
        id: "horario",
        header: "Horario",
        cell: (info) => info.getValue(),
      },
      {
        accessorFn: (row) => row,
        id: "equipamiento",
        header: "Equipamiento",
        cell: (info) => {
          const row = info.getValue();
          const pills = [];
          const added = new Set();
          if (row.id_equipo != null) {
            pills.push(
              <span key="proj" className="equip-badge equip-equipo">
                <svg
                  className="icon"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  aria-hidden="true"
                >
                  <path d="M3 5h18v10H3V5Zm2 2v6h14V7H5Zm-2 12h18v2H3v-2Z" />
                </svg>
                Proyector
              </span>
            );
            added.add("proyector");
            const spec = equipmentMaps?.equipos?.[row.id_equipo];
            if (spec?.hdmi && !added.has("hdmi")) {
              pills.push(
                <span key="hdmi" className="equip-badge equip-extension">
                  <svg
                    className="icon"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    aria-hidden="true"
                  >
                    <path d="M7 3h10v2H7V3Zm10 4H7l-2 4h14l-2-4Zm-9 6h8v8H8v-8Z" />
                  </svg>
                  HDMI
                </span>
              );
              added.add("hdmi");
            }
            if (spec?.vga && !added.has("vga")) {
              pills.push(
                <span key="vga" className="equip-badge equip-extension">
                  <svg
                    className="icon"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    aria-hidden="true"
                  >
                    <path d="M7 3h10v2H7V3Zm10 4H7l-2 4h14l-2-4Zm-9 6h8v8H8v-8Z" />
                  </svg>
                  VGA
                </span>
              );
              added.add("vga");
            }
          }
          if (row.id_laptop != null)
            pills.push(
              <span key="lap" className="equip-badge equip-laptop">
                <svg
                  className="icon"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  aria-hidden="true"
                >
                  <path d="M4 6h16a2 2 0 0 1 2 2v8h-2V8H4v8H2V8a2 2 0 0 1 2-2Zm-2 12h20v2H2v-2Z" />
                </svg>
                Computadora
              </span>
            );
          if (row.id_extension != null)
            pills.push(
              <span key="ext" className="equip-badge equip-extension">
                <svg
                  className="icon"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  aria-hidden="true"
                >
                  <path d="M7 3h10v2H7V3Zm10 4H7l-2 4h14l-2-4Zm-9 6h8v8H8v-8Z" />
                </svg>
                Extensión eléctrica
              </span>
            );
          return <div className="equip-container">{pills}</div>;
        },
      },
      {
        accessorFn: (row) =>
          (equipmentMaps?.aulas && row.id_aula != null
            ? equipmentMaps.aulas[row.id_aula]
            : undefined) ??
          row.aula ??
          "",
        id: "aula",
        header: "Aula",
      },
      {
        accessorFn: (row) => row,
        id: "estado",
        header: "Estado",
        cell: (info) => {
          const row = info.getValue();
          const { label, className } = deriveEstado(row);
          return <span className={`estado-badge ${className}`}>{label}</span>;
        },
      },
      {
        accessorFn: (row) => row.id,
        id: "acciones",
        header: "Acciones",
        cell: (info) => {
          const id = info.getValue();
          const row = info.row?.original;
          const handleClick = async () => {
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
            if (typeof onCancel === "function") onCancel(id);
          };
          return (
            <div className="flex gap-2 justify-center">
              <button
                className="dt-icon-btn dt-icon-btn--danger"
                onClick={() => showDetails(row || { id })}
                aria-label="Detalles"
                title="Ver detalles"
              >
                <svg
                  className="icon"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  aria-hidden="true"
                >
                  <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2Zm0 5a1.25 1.25 0 1 1 0 2.5A1.25 1.25 0 0 1 12 7Zm1 11h-2v-8h2v8Z" />
                </svg>
              </button>
              {showEditButton ? (
                <button
                  className="dt-icon-btn dt-icon-btn--danger"
                  onClick={() => {
                    if (typeof onEdit === "function") onEdit(row || { id });
                  }}
                  aria-label="Editar"
                  title="Editar"
                >
                  <svg
                    className="icon"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                    width="22"
                    height="22"
                    aria-hidden="true"
                  >
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25Zm18-11.5a1 1 0 0 0 0-1.41l-1.59-1.59a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.08-1.08Z" />
                  </svg>
                </button>
              ) : null}
              {typeof onComplete === "function" &&
              row?.estado !== 2 &&
              row?.estado !== 3 ? (
                <button
                  className="dt-icon-btn dt-icon-btn--danger"
                  onClick={async () => {
                    let nextMsg = "Se intentará actualizar el estado.";
                    if (row?.estado === 0) nextMsg = "La reserva pasará a Pendiente de Retiro.";
                    else if (row?.estado === 8 || row?.estado === 1) nextMsg = "La reserva pasará a Entregado.";
                    else if (row?.estado === 9 || row?.estado === 10) nextMsg = "La reserva pasará a Completada.";
                    const result = await Swal.fire({
                      title: "¿Confirmar cambio de estado?",
                      text: nextMsg,
                      icon: "question",
                      showCancelButton: true,
                      confirmButtonText: "Sí, marcar",
                      cancelButtonText: "No",
                      reverseButtons: true,
                      focusCancel: true,
                    });
                    if (!result.isConfirmed) return;
                    onComplete(row || { id });
                  }}
                  aria-label="Completar"
                  title="Marcar como Completada"
                >
                  <svg
                    className="icon"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                    width="22"
                    height="22"
                    aria-hidden="true"
                  >
                    <path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
                  </svg>
                </button>
              ) : null}
              {showCancelButton ? (
                <button
                  className="dt-icon-btn dt-icon-btn--danger"
                  onClick={handleClick}
                  aria-label="Cancelar"
                  title="Cancelar"
                >
                  <svg
                    className="icon"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                    width="22"
                    height="22"
                    aria-hidden="true"
                  >
                    <path d="M9 3h6a1 1 0 0 1 1 1v2h4v2h-1v11a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V8H4V6h4V4a1 1 0 0 1 1-1Zm1 3h4V5h-4v1Zm-3 2v11a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V8H7Zm3 2h2v7h-2v-7Zm4 0h2v7h-2v-7Z" />
                  </svg>
                </button>
              ) : null}
            </div>
          );
        },
      },
    ],
    [
      equipmentMaps,
      showCancelButton,
      showEditButton,
      onCancel,
      onEdit,
      onComplete,
      showUsuario,
      usuariosMap,
    ]
  );

  const table = useReactTable({
    data: data || [],
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="reservations-table text-sm space-y-3">
      <div className="table-controls flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="search flex items-center gap-2">
          <input
            type="text"
            placeholder="Buscar reservas..."
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="block w-full sm:w-64 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0D4D98] focus:border-[#0D4D98]"
            aria-label="Buscar en reservas"
          />
        </div>
        <div className="pagination-controls flex items-center gap-3">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="rounded border px-2 py-1 disabled:opacity-50"
          >
            ‹
          </button>
          <span className="text-xs sm:text-sm">
            Página {table.getState().pagination.pageIndex + 1} de{" "}
            {table.getPageCount() || 1}
          </span>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="rounded border px-2 py-1 disabled:opacity-50"
          >
            ›
          </button>
        </div>
      </div>

      {/* Vista de tarjetas para móviles */}
      <div className="block sm:hidden space-y-3">
        {table.getRowModel().rows.length === 0 ? (
          <div className="rounded-md border p-4 text-center text-gray-500">
            No hay reservas.
          </div>
        ) : (
          table.getRowModel().rows.map((row) => {
            const r = row.original;
            // Construye pills de equipamiento (similar a la celda de tabla)
            const pills = [];
            const added = new Set();
            if (r.id_equipo != null) {
              pills.push(
                <span key="proj" className="equip-badge equip-equipo">
                  <svg
                    className="icon"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    aria-hidden="true"
                  >
                    <path d="M3 5h18v10H3V5Zm2 2v6h14V7H5Zm-2 12h18v2H3v-2Z" />
                  </svg>
                  Proyector
                </span>
              );
              added.add("proyector");
              const spec = equipmentMaps?.equipos?.[r.id_equipo];
              if (spec?.hdmi && !added.has("hdmi")) {
                pills.push(
                  <span key="hdmi" className="equip-badge equip-extension">
                    <svg
                      className="icon"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      aria-hidden="true"
                    >
                      <path d="M7 3h10v2H7V3Zm10 4H7l-2 4h14l-2-4Zm-9 6h8v8H8v-8Z" />
                    </svg>
                    HDMI
                  </span>
                );
                added.add("hdmi");
              }
              if (spec?.vga && !added.has("vga")) {
                pills.push(
                  <span key="vga" className="equip-badge equip-extension">
                    <svg
                      className="icon"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      aria-hidden="true"
                    >
                      <path d="M7 3h10v2H7V3Zm10 4H7l-2 4h14l-2-4Zm-9 6h8v8H8v-8Z" />
                    </svg>
                    VGA
                  </span>
                );
                added.add("vga");
              }
            }
            if (r.id_laptop != null)
              pills.push(
                <span key="lap" className="equip-badge equip-laptop">
                  <svg
                    className="icon"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    aria-hidden="true"
                  >
                    <path d="M4 6h16a2 2 0 0 1 2 2v8h-2V8H4v8H2V8a2 2 0 0 1 2-2Zm-2 12h20v2H2v-2Z" />
                  </svg>
                  Computadora
                </span>
              );
            if (r.id_extension != null)
              pills.push(
                <span key="ext" className="equip-badge equip-extension">
                  <svg
                    className="icon"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    aria-hidden="true"
                  >
                    <path d="M7 3h10v2H7V3Zm10 4H7l-2 4h14l-2-4Zm-9 6h8v8H8v-8Z" />
                  </svg>
                  Extensión eléctrica
                </span>
              );

            const aulaNombre =
              (equipmentMaps?.aulas && r.id_aula != null
                ? equipmentMaps.aulas[r.id_aula]
                : undefined) || r.aula;
            return (
              <div key={row.id} className="rounded-md border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    {showUsuario ? (
                      <div className="text-xs font-medium text-gray-800">
                        {(usuariosMap && r.id_usuario
                          ? usuariosMap[r.id_usuario]
                          : "") || ""}
                      </div>
                    ) : null}
                    <div className="font-medium">
                      {formatDate(r.fecha_hora_inicio)}
                    </div>
                    <div className="text-xs text-gray-600">
                      {formatTime(r.fecha_hora_inicio)} -{" "}
                      {formatTime(r.fecha_hora_fin)}
                    </div>
                    {aulaNombre ? (
                      <div className="text-xs text-gray-700">
                        Aula: {aulaNombre}
                      </div>
                    ) : null}
                  </div>
                  {(() => {
                    const { label, className } = deriveEstado(r);
                    return (
                      <span className={`estado-badge ${className}`}>
                        {label}
                      </span>
                    );
                  })()}
                </div>
                {pills.length > 0 ? (
                  <div className="equip-container mt-3 flex flex-wrap gap-2">
                    {pills}
                  </div>
                ) : null}
                {showEditButton ||
                showCancelButton ||
                typeof onComplete === "function" ? (
                  <div className="mt-3 flex justify-end gap-2">
                    {showEditButton ? (
                      <button
                        className="dt-icon-btn dt-icon-btn--danger"
                        onClick={() => {
                          if (typeof onEdit === "function") onEdit(r);
                        }}
                        aria-label="Editar"
                        title="Editar"
                      >
                        <svg
                          className="icon"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          xmlns="http://www.w3.org/2000/svg"
                          width="22"
                          height="22"
                          aria-hidden="true"
                        >
                          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25Zm18-11.5a1 1 0 0 0 0-1.41l-1.59-1.59a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.08-1.08Z" />
                        </svg>
                      </button>
                    ) : null}
                    <button
                      className="dt-icon-btn dt-icon-btn--danger"
                      onClick={() => showDetails(r)}
                      aria-label="Detalles"
                      title="Ver detalles"
                    >
                      <svg
                        className="icon"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        xmlns="http://www.w3.org/2000/svg"
                        width="22"
                        height="22"
                        aria-hidden="true"
                      >
                        <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2Zm0 5a1.25 1.25 0 1 1 0 2.5A1.25 1.25 0 0 1 12 7Zm1 11h-2v-8h2v8Z" />
                      </svg>
                    </button>
                    {typeof onComplete === "function" &&
                    r?.estado !== 2 &&
                    r?.estado !== 3 ? (
                      <button
                        className="dt-icon-btn dt-icon-btn--danger"
                        onClick={async () => {
                          let nextMsg = "Se intentará actualizar el estado.";
                          if (r?.estado === 0) nextMsg = "La reserva pasará a Pendiente de Retiro.";
                          else if (r?.estado === 8 || r?.estado === 1) nextMsg = "La reserva pasará a Entregado.";
                          else if (r?.estado === 9 || r?.estado === 10) nextMsg = "La reserva pasará a Completada.";
                          const result = await Swal.fire({
                            title: "¿Confirmar cambio de estado?",
                            text: nextMsg,
                            icon: "question",
                            showCancelButton: true,
                            confirmButtonText: "Sí, marcar",
                            cancelButtonText: "No",
                            reverseButtons: true,
                            focusCancel: true,
                          });
                          if (!result.isConfirmed) return;
                          onComplete(r);
                        }}
                        aria-label="Completar"
                        title="Marcar como Completada"
                      >
                        <svg
                          className="icon"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          xmlns="http://www.w3.org/2000/svg"
                          width="22"
                          height="22"
                          aria-hidden="true"
                        >
                          <path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
                        </svg>
                      </button>
                    ) : null}
                    {showCancelButton ? (
                      <button
                        className="dt-icon-btn dt-icon-btn--danger"
                        onClick={async () => {
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
                          if (typeof onCancel === "function") onCancel(r.id);
                        }}
                        aria-label="Cancelar"
                        title="Cancelar"
                      >
                        <svg
                          className="icon"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          xmlns="http://www.w3.org/2000/svg"
                          width="22"
                          height="22"
                          aria-hidden="true"
                        >
                          <path d="M9 3h6a1 1 0 0 1 1 1v2h4v2h-1v11a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V8H4V6h4V4a1 1 0 0 1 1-1Zm1 3h4V5h-4v1Zm-3 2v11a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V8H7Zm3 2h2v7h-2v-7Zm4 0h2v7h-2v-7Z" />
                        </svg>
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>

      <div className="overflow-x-auto -mx-4 sm:mx-0 px-4">
        <table className="min-w-full hidden sm:table">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th key={h.id} className={headerClass(h.column.id)}>
                    {h.isPlaceholder ? null : (
                      <div
                        className="th-content"
                        onClick={h.column.getToggleSortingHandler()}
                        style={{
                          cursor: h.column.getCanSort() ? "pointer" : "default",
                        }}
                      >
                        {flexRender(h.column.columnDef.header, h.getContext())}
                        <span className="sort-indicator">
                          {h.column.getIsSorted()
                            ? h.column.getIsSorted() === "asc"
                              ? " ▲"
                              : " ▼"
                            : ""}
                        </span>
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>No hay reservas.</td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className={cellClass(cell.column.id)}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="table-footer">
        <div className="page-size">
          <label>Mostrar</label>
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
          >
            {[5, 10, 20].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
