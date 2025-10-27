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
  equipmentMaps = {},
  showCancelButton = true,
}) {
  const [globalFilter, setGlobalFilter] = useState("");
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
  const columns = useMemo(
    () => [
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
        accessorFn: (row) => row.aula || "",
        id: "aula",
        header: "Aula",
      },
      {
        accessorFn: (row) => row.estado,
        id: "estado",
        header: "Estado",
        cell: (info) => {
          const v = info.getValue();
          return (
            <span className={`estado-badge ${estadoToClass(v)}`}>
              {estadoToText(v)}
            </span>
          );
        },
      },
      {
        accessorFn: (row) => row.id,
        id: "acciones",
        header: "Acciones",
        cell: (info) => {
          const id = info.getValue();
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
          return showCancelButton ? (
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
          ) : null;
        },
      },
    ],
    [equipmentMaps, showCancelButton, onCancel]
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
            placeholder="Buscar..."
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

            return (
              <div key={row.id} className="rounded-md border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="font-medium">
                      {formatDate(r.fecha_hora_inicio)}
                    </div>
                    <div className="text-xs text-gray-600">
                      {formatTime(r.fecha_hora_inicio)} -{" "}
                      {formatTime(r.fecha_hora_fin)}
                    </div>
                    {r.aula ? (
                      <div className="text-xs text-gray-700">
                        Aula: {r.aula}
                      </div>
                    ) : null}
                  </div>
                  <span className={`estado-badge ${estadoToClass(r.estado)}`}>
                    {estadoToText(r.estado)}
                  </span>
                </div>
                {pills.length > 0 ? (
                  <div className="equip-container mt-3 flex flex-wrap gap-2">
                    {pills}
                  </div>
                ) : null}
                {showCancelButton ? (
                <div className="mt-3 flex justify-end">
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
                </div>
                ): null}
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
