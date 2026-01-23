import React, { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import {
  ESTADOS_RESERVA,
  getEquipos,
  getLaptops,
  getExtensiones,
  getAulas,
  listReservasAll,
  listProfesores,
  getUsuariosByIds,
  getDecanatos,
} from "@/lib/reservas";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileDown, Loader2, CalendarIcon } from "lucide-react";
import { format, startOfDay, endOfDay } from "date-fns";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const ESTADOS_LABEL = {
  [ESTADOS_RESERVA.RESERVADO]: "Reservado",
  [ESTADOS_RESERVA.ACTIVA]: "Activa",
  [ESTADOS_RESERVA.CANCELADA]: "Cancelada",
  [ESTADOS_RESERVA.COMPLETADA]: "Completada",
  [ESTADOS_RESERVA.CANCELADA_USUARIO]: "Cancelada (usuario)",
  [ESTADOS_RESERVA.CANCELADA_ADMIN]: "Cancelada (admin)",
  [ESTADOS_RESERVA.NO_SHOW]: "No-Show",
  [ESTADOS_RESERVA.EXPIRADA]: "Expirada",
  [ESTADOS_RESERVA.PENDIENTE_RETIRO]: "Pend. retiro",
  [ESTADOS_RESERVA.ENTREGADO]: "Entregado",
  [ESTADOS_RESERVA.PENDIENTE_ENTREGA]: "Pend. entrega",
};

const ESTADOS_HISTORIAL = new Set([
  ESTADOS_RESERVA.CANCELADA,
  ESTADOS_RESERVA.CANCELADA_USUARIO,
  ESTADOS_RESERVA.CANCELADA_ADMIN,
  ESTADOS_RESERVA.NO_SHOW,
  ESTADOS_RESERVA.COMPLETADA,
]);

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
  return `${get("day")}-${get("month")}-${get("year")}`;
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
  return `${get("hour")}:${get("minute")}`;
};

const formatShortDate = (date) =>
  date ? format(date, "dd/MM/yyyy") : "";

const toCsvValue = (value) => {
  if (value == null) return "";
  const str = String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
};

const downloadCsv = (rows, filename) => {
  const csv = rows.map((r) => r.map(toCsvValue).join(",")).join("\n");
  const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export default function AdminReportes() {
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapEquipos, setMapEquipos] = useState({});
  const [mapLaptops, setMapLaptops] = useState({});
  const [mapExtensiones, setMapExtensiones] = useState({});
  const [mapAulas, setMapAulas] = useState({});
  const [mapUsuarios, setMapUsuarios] = useState({});
  const [mapDecanatos, setMapDecanatos] = useState({});

  const [rangoInicio, setRangoInicio] = useState(null);
  const [rangoFin, setRangoFin] = useState(null);
  const [estadoFiltro, setEstadoFiltro] = useState("historial");
  const [usuariosSeleccionados, setUsuariosSeleccionados] = useState([]);
  const [usuariosOpen, setUsuariosOpen] = useState(false);
  const [usuariosSearch, setUsuariosSearch] = useState("");
  const [includeResumen, setIncludeResumen] = useState(true);
  const [openInicio, setOpenInicio] = useState(false);
  const [openFin, setOpenFin] = useState(false);

  const [inventarioCounts, setInventarioCounts] = useState({
    equipos: 0,
    laptops: 0,
    extensiones: 0,
    aulas: 0,
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [eqsAll, lapsAll, extsAll, aulasData, profs, allRes, decs] =
          await Promise.all([
            getEquipos({ onlyDisponibles: false }),
            getLaptops({ onlyDisponibles: false }),
            getExtensiones({ onlyDisponibles: false }),
            getAulas(),
            listProfesores(),
            listReservasAll({ futuras: false }),
            getDecanatos(),
          ]);

        setReservas(allRes || []);
        setInventarioCounts({
          equipos: (eqsAll || []).length,
          laptops: (lapsAll || []).length,
          extensiones: (extsAll || []).length,
          aulas: (aulasData || []).length,
        });

        setMapEquipos(
          (eqsAll || []).reduce((acc, it) => {
            acc[it.id] = {
              nombre: it.nombre_equipo,
              hdmi: it.hdmi,
              vga: it.vga,
            };
            return acc;
          }, {})
        );
        setMapLaptops(
          (lapsAll || []).reduce((acc, it) => {
            acc[it.id] = it.nombre_laptop;
            return acc;
          }, {})
        );
        setMapExtensiones(
          (extsAll || []).reduce((acc, it) => {
            acc[it.id] = it.nombre_extension;
            return acc;
          }, {})
        );
        setMapAulas(
          (aulasData || []).reduce((acc, it) => {
            acc[it.id] = it.nombre_aula;
            return acc;
          }, {})
        );
        setMapDecanatos(
          (decs || []).reduce((acc, it) => {
            acc[it.id] = it.nombre_decanato;
            return acc;
          }, {})
        );

        const idsPresentes = Array.from(
          new Set((allRes || []).map((r) => r.id_usuario).filter(Boolean))
        );
        if (idsPresentes.length > 0) {
          try {
            const users = await getUsuariosByIds(idsPresentes);
            setMapUsuarios(
              (users || []).reduce((acc, u) => {
                acc[u.id] = u.nombre_completo || u.email;
                return acc;
              }, {})
            );
          } catch (e) {
            setMapUsuarios(
              (profs || []).reduce((acc, it) => {
                acc[it.id] = it.nombre_completo || it.email;
                return acc;
              }, {})
            );
          }
        } else {
          setMapUsuarios(
            (profs || []).reduce((acc, it) => {
              acc[it.id] = it.nombre_completo || it.email;
              return acc;
            }, {})
          );
        }
      } catch (err) {
        console.error(err);
        Swal.fire(
          "Error",
          err.message || "No se pudo cargar el reporte",
          "error"
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const reservasFiltradas = useMemo(() => {
    let rows = reservas || [];
    if (estadoFiltro === "historial") {
      rows = rows.filter((r) => ESTADOS_HISTORIAL.has(r.estado));
    } else if (estadoFiltro === "canceladas") {
      rows = rows.filter((r) =>
        [
          ESTADOS_RESERVA.CANCELADA,
          ESTADOS_RESERVA.CANCELADA_USUARIO,
          ESTADOS_RESERVA.CANCELADA_ADMIN,
        ].includes(r.estado)
      );
    } else if (estadoFiltro === "completadas") {
      rows = rows.filter((r) => r.estado === ESTADOS_RESERVA.COMPLETADA);
    } else if (estadoFiltro === "no_show") {
      rows = rows.filter((r) => r.estado === ESTADOS_RESERVA.NO_SHOW);
    } else if (estadoFiltro === "activas") {
      rows = rows.filter((r) =>
        [
          ESTADOS_RESERVA.ACTIVA,
          ESTADOS_RESERVA.ENTREGADO,
          ESTADOS_RESERVA.PENDIENTE_RETIRO,
          ESTADOS_RESERVA.PENDIENTE_ENTREGA,
        ].includes(r.estado)
      );
    }
    if (rangoInicio) {
      const start = startOfDay(rangoInicio);
      rows = rows.filter((r) => new Date(r.fecha_hora_inicio) >= start);
    }
    if (rangoFin) {
      const end = endOfDay(rangoFin);
      rows = rows.filter((r) => new Date(r.fecha_hora_inicio) <= end);
    }
    if (usuariosSeleccionados.length > 0) {
      const selected = new Set(usuariosSeleccionados);
      rows = rows.filter((r) => selected.has(String(r.id_usuario)));
    }
    return rows;
  }, [reservas, rangoInicio, rangoFin, estadoFiltro, usuariosSeleccionados]);

  useEffect(() => {
    if (rangoInicio && rangoFin && rangoInicio > rangoFin) {
      setRangoFin(null);
    }
  }, [rangoInicio, rangoFin]);

  const resumen = useMemo(() => {
    const total = reservasFiltradas.length;
    const byEstado = reservasFiltradas.reduce((acc, r) => {
      acc[r.estado] = (acc[r.estado] || 0) + 1;
      return acc;
    }, {});
    const usuariosUnicos = new Set(
      reservasFiltradas.map((r) => r.id_usuario).filter(Boolean)
    ).size;

    return {
      total,
      usuariosUnicos,
      completadas: byEstado[ESTADOS_RESERVA.COMPLETADA] || 0,
      canceladas:
        (byEstado[ESTADOS_RESERVA.CANCELADA] || 0) +
        (byEstado[ESTADOS_RESERVA.CANCELADA_USUARIO] || 0) +
        (byEstado[ESTADOS_RESERVA.CANCELADA_ADMIN] || 0),
      noShow: byEstado[ESTADOS_RESERVA.NO_SHOW] || 0,
      activas:
        (byEstado[ESTADOS_RESERVA.ACTIVA] || 0) +
        (byEstado[ESTADOS_RESERVA.ENTREGADO] || 0) +
        (byEstado[ESTADOS_RESERVA.PENDIENTE_RETIRO] || 0) +
        (byEstado[ESTADOS_RESERVA.PENDIENTE_ENTREGA] || 0),
    };
  }, [reservasFiltradas]);

  const handleExportHistorial = () => {
    if (!reservasFiltradas.length) {
      Swal.fire("Sin datos", "No hay registros para exportar", "info");
      return;
    }

    const rows = [
      [
        "ID",
        "Profesor",
        "Estado",
        "Fecha",
        "Hora inicio",
        "Hora fin",
        "Aula",
        "Proyector",
        "Conexión",
        "Laptop",
        "Extensión",
        "Decanato",
      ],
      ...reservasFiltradas.map((r) => {
        const equipoSpec = r.id_equipo != null ? mapEquipos[r.id_equipo] : null;
        const connTypes = [];
        if (equipoSpec?.hdmi) connTypes.push("HDMI");
        if (equipoSpec?.vga) connTypes.push("VGA");
        const connLabel = connTypes.length ? connTypes.join(" / ") : "—";
        return [
          r.id,
          r.id_usuario ? mapUsuarios[r.id_usuario] || "" : "",
          ESTADOS_LABEL[r.estado] || "",
          formatDate(r.fecha_hora_inicio),
          formatTime(r.fecha_hora_inicio),
          formatTime(r.fecha_hora_fin),
          r.id_aula != null ? mapAulas[r.id_aula] || "—" : "—",
          r.id_equipo != null ? mapEquipos[r.id_equipo]?.nombre || "—" : "—",
          connLabel,
          r.id_laptop != null ? mapLaptops[r.id_laptop] || "—" : "Ninguna",
          r.id_extension != null
            ? mapExtensiones[r.id_extension] || "—"
            : "Ninguna",
          r.id_decanato != null ? mapDecanatos[r.id_decanato] || "—" : "—",
        ];
      }),
    ];

    if (includeResumen) {
      rows.push(new Array(12).fill(""));
      rows.push([
        "RESUMEN",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
      ]);
      const resumenRows = [
        ["Total de reservas", resumen.total],
        ["Usuarios únicos", resumen.usuariosUnicos],
        ["Reservas completadas", resumen.completadas],
        ["Reservas canceladas", resumen.canceladas],
        ["Reservas No-Show", resumen.noShow],
        ["Reservas activas", resumen.activas],
        ["Proyectores en inventario", inventarioCounts.equipos],
        ["Laptops en inventario", inventarioCounts.laptops],
        ["Extensiones en inventario", inventarioCounts.extensiones],
        ["Aulas registradas", inventarioCounts.aulas],
      ];
      resumenRows.forEach(([label, value]) => {
        rows.push([label, value, "", "", "", "", "", "", "", "", "", ""]);
      });
    }

    const sufijo =
      estadoFiltro === "historial"
        ? "historial"
        : estadoFiltro === "canceladas"
        ? "canceladas"
        : estadoFiltro === "completadas"
        ? "completadas"
        : estadoFiltro === "no_show"
        ? "no_show"
        : estadoFiltro === "activas"
        ? "activas"
        : "todas";
    downloadCsv(rows, `reporte_${sufijo}.csv`);
  };

  const handleExportPdf = () => {
    if (!reservasFiltradas.length) {
      Swal.fire("Sin datos", "No hay registros para exportar", "info");
      return;
    }

    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const title = "Reporte de Reservas";
    doc.setFontSize(16);
    doc.text(title, pageWidth / 2, 40, { align: "center" });

    doc.setFontSize(10);
    const rangoText = `Rango: ${
      rangoInicio ? format(rangoInicio, "dd-MM-yyyy") : "—"
    } a ${rangoFin ? format(rangoFin, "dd-MM-yyyy") : "—"}`;
    const filtroLabel =
      estadoFiltro === "historial"
        ? "Solo historial"
        : estadoFiltro === "canceladas"
        ? "Canceladas"
        : estadoFiltro === "completadas"
        ? "Completadas"
        : estadoFiltro === "no_show"
        ? "No-Show"
        : estadoFiltro === "activas"
        ? "Activas"
        : "Todas";
    const filtroText = `Filtro: ${filtroLabel}`;
    const usuariosText = `Usuarios: ${
      usuariosSeleccionados.length
        ? usuariosSeleccionados
            .map((id) => mapUsuarios[id])
            .filter(Boolean)
            .join("; ")
        : "Todos"
    }`;
    doc.text(rangoText, 40, 65);
    doc.text(filtroText, 40, 80);
    doc.text(usuariosText, 40, 95);

    const body = reservasFiltradas.map((r) => {
      const equipoSpec = r.id_equipo != null ? mapEquipos[r.id_equipo] : null;
      const connTypes = [];
      if (equipoSpec?.hdmi) connTypes.push("HDMI");
      if (equipoSpec?.vga) connTypes.push("VGA");
      const connLabel = connTypes.length ? connTypes.join(" / ") : "—";
      return [
        r.id,
        r.id_usuario ? mapUsuarios[r.id_usuario] || "" : "",
        ESTADOS_LABEL[r.estado] || "",
        formatDate(r.fecha_hora_inicio),
        formatTime(r.fecha_hora_inicio),
        formatTime(r.fecha_hora_fin),
        r.id_aula != null ? mapAulas[r.id_aula] || "—" : "—",
        r.id_equipo != null ? mapEquipos[r.id_equipo]?.nombre || "—" : "—",
        connLabel,
        r.id_laptop != null ? mapLaptops[r.id_laptop] || "—" : "Ninguna",
        r.id_extension != null
          ? mapExtensiones[r.id_extension] || "—"
          : "Ninguna",
        r.id_decanato != null ? mapDecanatos[r.id_decanato] || "—" : "—",
      ];
    });

    autoTable(doc, {
      head: [
        [
          "ID",
          "Profesor",
          "Estado",
          "Fecha",
          "Inicio",
          "Fin",
          "Aula",
          "Proyector",
          "Conexión",
          "Laptop",
          "Extensión",
          "Decanato",
        ],
      ],
      body,
      startY: 115,
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: [13, 77, 152] },
      margin: { left: 40, right: 40 },
    });

    if (includeResumen) {
      const summaryRows = [
        ["Total de reservas", resumen.total],
        ["Usuarios únicos", resumen.usuariosUnicos],
        ["Reservas completadas", resumen.completadas],
        ["Reservas canceladas", resumen.canceladas],
        ["Reservas No-Show", resumen.noShow],
        ["Reservas activas", resumen.activas],
        ["Proyectores en inventario", inventarioCounts.equipos],
        ["Laptops en inventario", inventarioCounts.laptops],
        ["Extensiones en inventario", inventarioCounts.extensiones],
        ["Aulas registradas", inventarioCounts.aulas],
      ];

      const lastY = doc.lastAutoTable?.finalY || 140;
      autoTable(doc, {
        head: [["Métrica", "Valor"]],
        body: summaryRows,
        startY: lastY + 20,
        styles: { fontSize: 9, cellPadding: 4 },
        headStyles: { fillColor: [13, 77, 152] },
        margin: { left: 40, right: 40 },
      });
    }

    doc.save("reporte_reservas.pdf");
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="font-bold text-xl">Reportes</h2>
        <p className="text-sm text-muted-foreground">
          Genera reportes del historial de reservas y un resumen con métricas
          clave para administración.
        </p>
      </div>

      <section className="bg-white rounded-lg shadow-sm border p-4 sm:p-5">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rangoInicio">Desde</Label>
                <Popover open={openInicio} onOpenChange={setOpenInicio}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-full justify-between ${
                        rangoInicio ? "text-black" : "text-muted-foreground"
                      }`}
                      id="rangoInicio"
                    >
                      {rangoInicio ? formatShortDate(rangoInicio) : "Fecha"}
                      <CalendarIcon className="ml-2 h-4 w-4 opacity-60" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={rangoInicio}
                      disabled={rangoFin ? { after: rangoFin } : undefined}
                      onSelect={(date) => {
                        setRangoInicio(date || null);
                        if (date && rangoFin && date > rangoFin)
                          setRangoFin(null);
                        setOpenInicio(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rangoFin">Hasta</Label>
                <Popover open={openFin} onOpenChange={setOpenFin}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-full justify-between ${
                        rangoFin ? "text-black" : "text-muted-foreground"
                      }`}
                      id="rangoFin"
                    >
                      {rangoFin ? formatShortDate(rangoFin) : "Fecha"}
                      <CalendarIcon className="ml-2 h-4 w-4 opacity-60" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={rangoFin}
                      disabled={rangoInicio ? { before: rangoInicio } : undefined}
                      onSelect={(date) => {
                        if (date && rangoInicio && date < rangoInicio) {
                          Swal.fire(
                            "Rango inválido",
                            "La fecha 'Hasta' no puede ser menor que 'Desde'.",
                            "warning"
                          );
                          return;
                        }
                        setRangoFin(date || null);
                        setOpenFin(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={estadoFiltro} onValueChange={setEstadoFiltro}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccione estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los registros</SelectItem>
                    <SelectItem value="historial">Solo historial</SelectItem>
                    <SelectItem value="canceladas">Solo canceladas</SelectItem>
                    <SelectItem value="completadas">Solo completadas</SelectItem>
                    <SelectItem value="no_show">Solo No-Show</SelectItem>
                    <SelectItem value="activas">Solo activas</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Selecciona el estado para exportar.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Usuarios</Label>
                <Popover open={usuariosOpen} onOpenChange={setUsuariosOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      {usuariosSeleccionados.length > 0
                        ? `${usuariosSeleccionados.length} seleccionados`
                        : "Todos los usuarios"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-2 w-[--radix-popover-trigger-width] min-w-[260px]">
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={usuariosSearch}
                        onChange={(e) => setUsuariosSearch(e.target.value)}
                        placeholder="Buscar usuario..."
                        className="w-full rounded-md border px-3 py-2 text-sm"
                      />
                      <div className="max-h-56 overflow-y-auto rounded-md border">
                        {(() => {
                          const term = usuariosSearch.trim().toLowerCase();
                          const entries = Object.entries(mapUsuarios || {});
                          const list = entries.filter(([, name]) =>
                            (name || "").toLowerCase().includes(term)
                          );
                          if (entries.length === 0) {
                            return (
                              <div className="px-3 py-2 text-sm text-muted-foreground">
                                No hay usuarios.
                              </div>
                            );
                          }
                          if (list.length === 0) {
                            return (
                              <div className="px-3 py-2 text-sm text-muted-foreground">
                                Sin resultados.
                              </div>
                            );
                          }
                          return list.map(([id, name]) => {
                            const checked = usuariosSeleccionados.includes(
                              String(id)
                            );
                            return (
                              <label
                                key={id}
                                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/50"
                              >
                                <input
                                  type="checkbox"
                                  className="h-4 w-4"
                                  checked={checked}
                                  onChange={(e) => {
                                    setUsuariosSeleccionados((prev) => {
                                      const next = new Set(prev.map(String));
                                      if (e.target.checked)
                                        next.add(String(id));
                                      else next.delete(String(id));
                                      return Array.from(next);
                                    });
                                  }}
                                />
                                <span>{name}</span>
                              </label>
                            );
                          });
                        })()}
                      </div>
                      <div className="flex items-center justify-between">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setUsuariosSeleccionados([])}
                        >
                          Limpiar
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setUsuariosOpen(false)}
                        >
                          Listo
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 rounded-md px-3 py-2">
              <Label className="text-sm">Resumen</Label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  id="includeResumen"
                  type="checkbox"
                  className="h-4 w-4"
                  checked={includeResumen}
                  onChange={(e) => setIncludeResumen(e.target.checked)}
                />
                <span>Incluir resumen en exportación</span>
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-9">
            <Button
              onClick={handleExportHistorial}
              className="w-full mb-2 bg-[#0D4D98] text-white hover:bg-[#0B3E7A]"
            >
              <FileDown className="mr-2 h-4 w-4" />
              Exportar CSV
            </Button>
            <Button
              onClick={handleExportPdf}
              className="w-full bg-[#0D4D98] text-white hover:bg-[#0B3E7A]"
            >
              <FileDown className="mr-2 h-4 w-4" />
              Exportar PDF
            </Button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading ? (
          <div className="col-span-full flex items-center justify-center p-6 bg-white rounded-lg border">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            <span>Cargando reportes...</span>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Total reservas</p>
              <p className="text-2xl font-semibold">{resumen.total}</p>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Completadas</p>
              <p className="text-2xl font-semibold">{resumen.completadas}</p>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Canceladas</p>
              <p className="text-2xl font-semibold">{resumen.canceladas}</p>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">No-Show</p>
              <p className="text-2xl font-semibold">{resumen.noShow}</p>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Activas</p>
              <p className="text-2xl font-semibold">{resumen.activas}</p>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Usuarios únicos</p>
              <p className="text-2xl font-semibold">{resumen.usuariosUnicos}</p>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">
                Proyectores / Laptops
              </p>
              <p className="text-2xl font-semibold">
                {inventarioCounts.equipos} / {inventarioCounts.laptops}
              </p>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">
                Extensiones / Aulas
              </p>
              <p className="text-2xl font-semibold">
                {inventarioCounts.extensiones} / {inventarioCounts.aulas}
              </p>
            </div>
          </>
        )}
      </section>

      <section className="bg-white rounded-lg border p-4">
        <p className="text-sm text-muted-foreground">
          Registros seleccionados: {reservasFiltradas.length}
        </p>
      </section>
    </div>
  );
}
