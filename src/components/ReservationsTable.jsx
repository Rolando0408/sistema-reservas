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
}) {
  const [globalFilter, setGlobalFilter] = useState("");

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
          return (
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
          );
        },
      },
    ],
    [equipmentMaps]
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
    <div className="reservations-table">
      <div className="table-controls">
        <div className="pagination-controls">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            ‹
          </button>
          <span>
            Página {table.getState().pagination.pageIndex + 1} de{" "}
            {table.getPageCount() || 1}
          </span>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            ›
          </button>
        </div>
      </div>

      <table>
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((h) => (
                <th key={h.id}>
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
                  <td key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
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
