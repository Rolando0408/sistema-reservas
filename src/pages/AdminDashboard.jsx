import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import {
  ESTADOS_RESERVA,
  getHorarios,
  getDecanatos,
  getEquipos,
  getLaptops,
  getExtensiones,
  getAulas,
  listReservasAll,
  listEquiposDisponibles,
  listLaptopsDisponibles,
  listExtensionesDisponibles,
  listAulasDisponibles,
  createReservaForUser,
  cancelReserva,
  updateReserva,
  listProfesores,
  completeReserva,
  getUsuariosByIds,
} from "@/lib/reservas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format, startOfDay, isToday } from "date-fns";
import { es } from "date-fns/locale";
import ReservationsTable from "@/components/ReservationsTable";

export default function AdminDashboard() {
  const [reservas, setReservas] = useState([]);
  const [reservasLoading, setReservasLoading] = useState(true);

  const [horarios, setHorarios] = useState([]);
  const [decanatos, setDecanatos] = useState([]);
  const [aulas, setAulas] = useState([]);
  const [profesores, setProfesores] = useState([]);

  const [mapEquipos, setMapEquipos] = useState({});
  const [mapLaptops, setMapLaptops] = useState({});
  const [mapExtensiones, setMapExtensiones] = useState({});
  const [mapAulas, setMapAulas] = useState({});
  const [mapUsuarios, setMapUsuarios] = useState({});

  const [openModal, setOpenModal] = useState(false);
  const [blockDialogClose, setBlockDialogClose] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingReservaId, setEditingReservaId] = useState(null);

  // form state
  const [fecha, setFecha] = useState();
  const [horaInicioId, setHoraInicioId] = useState("");
  const [horaFinId, setHoraFinId] = useState("");
  const [connectionType, setConnectionType] = useState("");
  const [equipoId, setEquipoId] = useState("");
  const [laptopId, setLaptopId] = useState("none");
  const [extensionId, setExtensionId] = useState("none");
  const [decanatoId, setDecanatoId] = useState("none");
  const [aulaId, setAulaId] = useState("");
  const [fechaPopoverOpen, setFechaPopoverOpen] = useState(false);
  const [aulaOpen, setAulaOpen] = useState(false);
  const [aulaSearch, setAulaSearch] = useState("");
  const [profesorId, setProfesorId] = useState("");
  const [profesorOpen, setProfesorOpen] = useState(false);
  const [profesorSearch, setProfesorSearch] = useState("");

  const [equiposDisponibles, setEquiposDisponibles] = useState([]);
  const [laptopsDisponibles, setLaptopsDisponibles] = useState([]);
  const [extensionesDisponibles, setExtensionesDisponibles] = useState([]);
  const [aulasDisponibles, setAulasDisponibles] = useState([]);
  const [warningTarget, setWarningTarget] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setReservasLoading(true);
        const [hs, decs, aulasData, eqsAll, lapsAll, extsAll, profs, allRes] =
          await Promise.all([
            getHorarios(),
            getDecanatos(),
            getAulas(),
            getEquipos({ onlyDisponibles: false }),
            getLaptops({ onlyDisponibles: false }),
            getExtensiones({ onlyDisponibles: false }),
            listProfesores(),
            listReservasAll({ futuras: false }),
          ]);
        setHorarios(hs || []);
        setDecanatos(decs || []);
        setAulas(aulasData || []);
        setProfesores(profs || []);
        setReservas(
          (allRes || []).filter(
            (r) =>
              r.estado !== ESTADOS_RESERVA.CANCELADA &&
              r.estado !== ESTADOS_RESERVA.COMPLETADA
          )
        );

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
        // Construye el mapa de usuarios para mostrar nombres en la tabla.
        // Preferimos derivarlo de las reservas actuales (ids presentes),
        // con fallback a la lista completa de profesores si está disponible.
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
            // Fallback a profesores si falla
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
        Swal.fire("Error", err.message || "No se pudo cargar datos", "error");
      } finally {
        setReservasLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const refreshDisponibles = async () => {
      try {
        if (!fecha || !horaInicioId || !horaFinId || !connectionType) {
          setEquiposDisponibles([]);
          setLaptopsDisponibles([]);
          setExtensionesDisponibles([]);
          setAulasDisponibles([]);
          return;
        }
        const fechaFormateada = format(fecha, "yyyy-MM-dd");
        const inicioIdNum = Number(horaInicioId);
        const finIdNum = Number(horaFinId);
        const needHdmi = connectionType === "HDMI";
        const needVga = connectionType === "VGA";
        const [eqs, laps, exts, aulasDisp] = await Promise.all([
          listEquiposDisponibles({
            dateYYYYMMDD: fechaFormateada,
            startHorarioId: inicioIdNum,
            endHorarioId: finIdNum,
            requireHdmi: needHdmi,
            requireVga: needVga,
            excludeReservaId: isEditMode ? editingReservaId : null,
          }),
          listLaptopsDisponibles({
            dateYYYYMMDD: fechaFormateada,
            startHorarioId: inicioIdNum,
            endHorarioId: finIdNum,
            excludeReservaId: isEditMode ? editingReservaId : null,
          }),
          listExtensionesDisponibles({
            dateYYYYMMDD: fechaFormateada,
            startHorarioId: inicioIdNum,
            endHorarioId: finIdNum,
            excludeReservaId: isEditMode ? editingReservaId : null,
          }),
          listAulasDisponibles({
            dateYYYYMMDD: fechaFormateada,
            startHorarioId: inicioIdNum,
            endHorarioId: finIdNum,
            excludeReservaId: isEditMode ? editingReservaId : null,
          }),
        ]);
        setEquiposDisponibles(eqs || []);
        setLaptopsDisponibles(laps || []);
        setExtensionesDisponibles(exts || []);
        setAulasDisponibles(aulasDisp || []);

        const equipoIdActualNum = equipoId ? Number(equipoId) : null;
        if (
          equipoIdActualNum &&
          !(eqs || []).find((e) => e.id === equipoIdActualNum)
        )
          setEquipoId("");
        const laptopIdActualNum =
          laptopId && laptopId !== "none" ? Number(laptopId) : null;
        if (
          laptopIdActualNum &&
          !(laps || []).find((l) => l.id === laptopIdActualNum)
        )
          setLaptopId("none");
        const extensionIdActualNum =
          extensionId && extensionId !== "none" ? Number(extensionId) : null;
        if (
          extensionIdActualNum &&
          !(exts || []).find((x) => x.id === extensionIdActualNum)
        )
          setExtensionId("none");
        const aulaIdActualNum = aulaId ? Number(aulaId) : null;
        if (
          aulaIdActualNum &&
          !(aulasDisp || []).find((a) => a.id === aulaIdActualNum)
        )
          setAulaId("");
      } catch (err) {
        console.error(err);
        setEquiposDisponibles([]);
        setLaptopsDisponibles([]);
        setExtensionesDisponibles([]);
        setAulasDisponibles([]);
        Swal.fire(
          "Error",
          err.message || "No se pudo cargar disponibilidad",
          "error"
        );
      }
    };
    refreshDisponibles();
  }, [
    fecha,
    horaInicioId,
    horaFinId,
    connectionType,
    equipoId,
    laptopId,
    extensionId,
    isEditMode,
    editingReservaId,
  ]);

  const getHorariosNoPasados = () => {
    if (!fecha || !isToday(fecha)) return horarios;
    const ahora = new Date();
    return horarios.filter((h) => {
      const [hStr, mStr] = h.hora.split(":");
      const horarioHoy = new Date();
      horarioHoy.setHours(parseInt(hStr, 10), parseInt(mStr, 10), 0, 0);
      return horarioHoy > ahora;
    });
  };
  const horariosInicioFiltrados = getHorariosNoPasados();
  const getHorariosFinFiltrados = () => {
    const listaBase = horariosInicioFiltrados;
    if (!horaInicioId) return listaBase;
    const hIniSel = horarios.find((h) => String(h.id) === horaInicioId);
    if (!hIniSel) return listaBase;
    return listaBase.filter((h) => h.hora > hIniSel.hora);
  };
  const horariosFinFiltrados = getHorariosFinFiltrados();
  useEffect(() => {
    if (
      horaFinId &&
      !horariosFinFiltrados.find((h) => String(h.id) === horaFinId)
    ) {
      setHoraFinId("");
    }
  }, [horaInicioId, horariosFinFiltrados, horaFinId]);

  const requisitosCompletos =
    fecha && horaInicioId && horaFinId && connectionType;

  const handleDisabledClick = (targetName) => {
    if (!requisitosCompletos) {
      setWarningTarget(targetName);
      setTimeout(() => setWarningTarget(null), 3000);
    } else {
      setWarningTarget(null);
    }
  };

  const resetFormulario = () => {
    setFecha(undefined);
    setHoraInicioId("");
    setHoraFinId("");
    setConnectionType("");
    setEquipoId("");
    setLaptopId("none");
    setExtensionId("none");
    setDecanatoId("none");
    setAulaId("");
    setProfesorId("");
    setEquiposDisponibles([]);
    setLaptopsDisponibles([]);
    setExtensionesDisponibles([]);
    setIsEditMode(false);
    setEditingReservaId(null);
  };

  const onCreate = async () => {
    setIsCreating(true);
    try {
      const missing = [];
      if (!profesorId) missing.push("profesor");
      if (!fecha) missing.push("fecha");
      if (!horaInicioId) missing.push("hora de inicio");
      if (!horaFinId) missing.push("hora de fin");
      if (!connectionType) missing.push("tipo de conexión");
      if (!equipoId) missing.push("proyector");
      if (!decanatoId || decanatoId === "none") missing.push("decanato");
      if (!aulaId || !aulaId.trim()) missing.push("aula");
      if (missing.length > 0) {
        setBlockDialogClose(true);
        await Swal.fire({
          title: "Faltan datos",
          html: `Debes completar: <b>${missing.join(", ")}</b>.`,
          icon: "warning",
          allowOutsideClick: false,
          allowEscapeKey: false,
          confirmButtonText: "Entendido",
        });
        setTimeout(() => setBlockDialogClose(false), 120);
        return false;
      }
      await createReservaForUser({
        userId: profesorId,
        dateYYYYMMDD: format(fecha, "yyyy-MM-dd"),
        startHorarioId: Number(horaInicioId),
        endHorarioId: Number(horaFinId),
        id_equipo: Number(equipoId),
        id_laptop: laptopId && laptopId !== "none" ? Number(laptopId) : null,
        id_extension:
          extensionId && extensionId !== "none" ? Number(extensionId) : null,
        id_decanato:
          decanatoId && decanatoId !== "none" ? Number(decanatoId) : null,
        id_aula: aulaId ? Number(aulaId) : null,
      });
      setBlockDialogClose(true);
      await Swal.fire({
        title: "Reserva creada",
        text: "La reservación fue creada con éxito",
        icon: "success",
        allowOutsideClick: false,
      });
      setTimeout(() => setBlockDialogClose(false), 120);
      const all = await listReservasAll({ futuras: false });
      setReservas(
        (all || []).filter(
          (r) =>
            r.estado !== ESTADOS_RESERVA.CANCELADA &&
            r.estado !== ESTADOS_RESERVA.COMPLETADA
        )
      );
      return true;
    } catch (err) {
      setBlockDialogClose(true);
      await Swal.fire({
        title: "Error",
        text: err.message || "No se pudo crear la reserva",
        icon: "error",
        allowOutsideClick: false,
        allowEscapeKey: false,
      });
      setTimeout(() => setBlockDialogClose(false), 120);
      return false;
    } finally {
      setIsCreating(false);
    }
  };

  const onCancelRes = async (id) => {
    try {
      await cancelReserva({ reservaId: id });
      await Swal.fire("Cancelada", "La reserva fue cancelada", "success");
      const all = await listReservasAll({ futuras: false });
      setReservas(
        (all || []).filter(
          (r) =>
            r.estado !== ESTADOS_RESERVA.CANCELADA &&
            r.estado !== ESTADOS_RESERVA.COMPLETADA
        )
      );
    } catch (err) {
      await Swal.fire(
        "No se pudo cancelar",
        err.message || "Intenta nuevamente",
        "error"
      );
    }
  };

  const onCompleteRes = async (row) => {
    try {
      await completeReserva({ reservaId: row.id });
      await Swal.fire(
        "Completada",
        "La reserva fue marcada como Completada",
        "success"
      );
      const all = await listReservasAll({ futuras: false });
      setReservas(
        (all || []).filter(
          (r) =>
            r.estado !== ESTADOS_RESERVA.CANCELADA &&
            r.estado !== ESTADOS_RESERVA.COMPLETADA
        )
      );
    } catch (err) {
      await Swal.fire(
        "No se pudo marcar",
        err.message || "Intenta nuevamente",
        "error"
      );
    }
  };

  const isoToCaracasParts = (iso) => {
    const d = new Date(iso);
    const parts = new Intl.DateTimeFormat("es-VE", {
      timeZone: "America/Caracas",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(d);
    const get = (type) => parts.find((p) => p.type === type)?.value || "";
    return {
      y: Number(get("year")),
      m: Number(get("month")),
      d: Number(get("day")),
      hh: get("hour"),
      mm: get("minute"),
    };
  };

  const startEdit = (row) => {
    try {
      setIsEditMode(true);
      setEditingReservaId(row.id);
      const sp = isoToCaracasParts(row.fecha_hora_inicio);
      const fechaLocal = new Date(sp.y, sp.m - 1, sp.d);
      setFecha(fechaLocal);
      const endParts = isoToCaracasParts(row.fecha_hora_fin);
      const startHHMMSS = `${sp.hh}:${sp.mm}:00`;
      const endHHMMSS = `${endParts.hh}:${endParts.mm}:00`;
      const hIni = horarios.find((h) => h.hora === startHHMMSS);
      const hFin = horarios.find((h) => h.hora === endHHMMSS);
      setHoraInicioId(hIni ? String(hIni.id) : "");
      setHoraFinId(hFin ? String(hFin.id) : "");
      const spec = row.id_equipo ? mapEquipos[row.id_equipo] : null;
      if (spec?.hdmi) setConnectionType("HDMI");
      else if (spec?.vga) setConnectionType("VGA");
      else setConnectionType("");
      setEquipoId(row.id_equipo != null ? String(row.id_equipo) : "");
      setLaptopId(row.id_laptop != null ? String(row.id_laptop) : "none");
      setExtensionId(
        row.id_extension != null ? String(row.id_extension) : "none"
      );
      setDecanatoId(row.id_decanato != null ? String(row.id_decanato) : "none");
      setAulaId(row.id_aula != null ? String(row.id_aula) : "");
      setOpenModal(true);
    } catch (e) {
      console.error(e);
      Swal.fire("Error", "No se pudo abrir la edición", "error");
    }
  };

  const onUpdate = async () => {
    setIsCreating(true);
    try {
      const missing = [];
      if (!fecha) missing.push("fecha");
      if (!horaInicioId) missing.push("hora de inicio");
      if (!horaFinId) missing.push("hora de fin");
      if (!connectionType) missing.push("tipo de conexión");
      if (!equipoId) missing.push("proyector");
      if (!decanatoId || decanatoId === "none") missing.push("decanato");
      if (!aulaId || !aulaId.trim()) missing.push("aula");
      if (missing.length > 0) {
        setBlockDialogClose(true);
        await Swal.fire({
          title: "Faltan datos",
          html: `Debes completar: <b>${missing.join(", ")}</b>.`,
          icon: "warning",
          allowOutsideClick: false,
          allowEscapeKey: false,
          confirmButtonText: "Entendido",
        });
        setTimeout(() => setBlockDialogClose(false), 120);
        return false;
      }
      await updateReserva({
        reservaId: editingReservaId,
        dateYYYYMMDD: format(fecha, "yyyy-MM-dd"),
        startHorarioId: Number(horaInicioId),
        endHorarioId: Number(horaFinId),
        id_equipo: Number(equipoId),
        id_laptop: laptopId && laptopId !== "none" ? Number(laptopId) : null,
        id_extension:
          extensionId && extensionId !== "none" ? Number(extensionId) : null,
        id_decanato:
          decanatoId && decanatoId !== "none" ? Number(decanatoId) : null,
        id_aula: aulaId ? Number(aulaId) : null,
      });
      setBlockDialogClose(true);
      await Swal.fire({
        title: "Reserva actualizada",
        text: "Los cambios se guardaron correctamente",
        icon: "success",
        allowOutsideClick: false,
      });
      setTimeout(() => setBlockDialogClose(false), 120);
      const all = await listReservasAll({ futuras: false });
      setReservas(
        (all || []).filter(
          (r) =>
            r.estado !== ESTADOS_RESERVA.CANCELADA &&
            r.estado !== ESTADOS_RESERVA.COMPLETADA
        )
      );
      return true;
    } catch (err) {
      setBlockDialogClose(true);
      await Swal.fire({
        title: "Error",
        text: err.message || "No se pudo actualizar la reserva",
        icon: "error",
        allowOutsideClick: false,
        allowEscapeKey: false,
      });
      setTimeout(() => setBlockDialogClose(false), 120);
      return false;
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <Dialog
        open={openModal}
        onOpenChange={(isOpen) => {
          if (!isOpen && blockDialogClose) return;
          setOpenModal(isOpen);
          if (!isOpen) resetFormulario();
        }}
      >
        <DialogContent
          onInteractOutside={(e) => {
            if (blockDialogClose) e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            if (blockDialogClose) e.preventDefault();
          }}
          className="p-0 h-[100dvh] w-full rounded-none sm:h-auto sm:w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl sm:rounded-lg sm:p-6 flex flex-col"
        >
          <DialogHeader className="sticky top-0 border-b px-4 py-3 sm:px-6 sm:py-4">
            <DialogTitle>
              {isEditMode ? "Editar reservación" : "Nueva Reservación (Admin)"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? "Modifica los campos y guarda los cambios."
                : "Completa todos los campos, asigna un profesor y crea la reserva."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Profesor */}
              {!isEditMode ? (
                <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                  <Label htmlFor="profesor" className="text-left sm:text-right">
                    Profesor
                  </Label>
                  <Popover open={profesorOpen} onOpenChange={setProfesorOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-expanded={profesorOpen}
                        className={`col-span-1 sm:col-span-3 h-10 w-full justify-between ${
                          profesorId ? "text-black" : "text-muted-foreground"
                        }`}
                        id="profesor"
                      >
                        {(() => {
                          const sel = profesores.find(
                            (x) => String(x.id) === profesorId
                          );
                          return sel
                            ? sel.nombre_completo || sel.email
                            : "Seleccione un profesor";
                        })()}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="ml-2 size-4 opacity-60"
                          aria-hidden="true"
                        >
                          <path d="M7 10l5 5 5-5H7z" />
                        </svg>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="p-2 w-[--radix-popover-trigger-width] min-w-[260px] max-h-80 overflow-auto overscroll-contain touch-pan-y"
                      data-scroll-lock-scrollable
                      onWheelCapture={(e) => e.stopPropagation()}
                      onWheel={(e) => e.stopPropagation()}
                      onTouchStartCapture={(e) => e.stopPropagation()}
                      onTouchMoveCapture={(e) => e.stopPropagation()}
                      style={{ WebkitOverflowScrolling: "touch" }}
                    >
                      <div className="space-y-2">
                        <Input
                          placeholder="Buscar profesor..."
                          value={profesorSearch}
                          onChange={(e) => setProfesorSearch(e.target.value)}
                          autoFocus
                          className="text-black"
                        />
                        <div
                          className="max-h-60 overflow-y-auto rounded-md border overscroll-contain touch-pan-y"
                          data-scroll-lock-scrollable
                          tabIndex={0}
                          onWheelCapture={(e) => e.stopPropagation()}
                          onWheel={(e) => e.stopPropagation()}
                          onTouchStartCapture={(e) => e.stopPropagation()}
                          onTouchMoveCapture={(e) => e.stopPropagation()}
                          style={{ WebkitOverflowScrolling: "touch" }}
                        >
                          {(() => {
                            const term = profesorSearch.trim().toLowerCase();
                            const base = profesores || [];
                            const list = base.filter((p) =>
                              (p.nombre_completo || p.email || "")
                                .toLowerCase()
                                .includes(term)
                            );
                            if (base.length === 0) {
                              return (
                                <div className="px-3 py-2 text-sm text-muted-foreground">
                                  No hay profesores disponibles.
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
                            return list.map((p) => {
                              const selected = String(p.id) === profesorId;
                              return (
                                <button
                                  key={p.id}
                                  type="button"
                                  className={
                                    "w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground flex items-center justify-between text-black" +
                                    (selected ? " bg-accent/60" : "")
                                  }
                                  onClick={() => {
                                    setProfesorId(String(p.id));
                                    setProfesorOpen(false);
                                  }}
                                >
                                  <span>{p.nombre_completo || p.email}</span>
                                  {selected ? (
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      viewBox="0 0 24 24"
                                      fill="currentColor"
                                      className="size-4 opacity-80"
                                    >
                                      <path d="M9 16.2l-3.5-3.5 1.4-1.4L9 13.4l7.1-7.1 1.4 1.4z" />
                                    </svg>
                                  ) : null}
                                </button>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              ) : null}

              {/* Fecha */}
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                <Label htmlFor="fecha" className="text-left sm:text-right">
                  Fecha
                </Label>
                <Popover
                  open={fechaPopoverOpen}
                  onOpenChange={setFechaPopoverOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={`col-span-1 sm:col-span-3 justify-start text-left font-normal ${
                        !fecha && "text-muted-foreground"
                      }`}
                    >
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {fecha ? (
                        format(fecha, "PP", { locale: es })
                      ) : (
                        <span>Selecciona una fecha</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={fecha}
                      onSelect={(d) => {
                        setFecha(d);
                        setFechaPopoverOpen(false);
                      }}
                      initialFocus
                      disabled={(date) => {
                        const isPast = date < startOfDay(new Date());
                        const dow = date.getDay();
                        const isWeekend = dow === 0 || dow === 6;
                        return isPast || isWeekend;
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Hora Inicio */}
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                <Label
                  htmlFor="hora-inicio"
                  className="text-left sm:text-right"
                >
                  Hora Inicio
                </Label>
                <Select value={horaInicioId} onValueChange={setHoraInicioId}>
                  <SelectTrigger
                    id="hora-inicio"
                    className="col-span-1 sm:col-span-3 text-black"
                  >
                    <SelectValue placeholder="Seleccione" />
                  </SelectTrigger>
                  <SelectContent>
                    {horariosInicioFiltrados.map((h) => (
                      <SelectItem key={h.id} value={String(h.id)}>
                        {h.descripcion}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Hora Fin */}
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                <Label htmlFor="hora-fin" className="text-left sm:text-right">
                  Hora Fin
                </Label>
                <Select value={horaFinId} onValueChange={setHoraFinId}>
                  <SelectTrigger
                    id="hora-fin"
                    className="col-span-1 sm:col-span-3"
                  >
                    <SelectValue placeholder="Seleccione" />
                  </SelectTrigger>
                  <SelectContent>
                    {horariosFinFiltrados.map((h) => (
                      <SelectItem key={h.id} value={String(h.id)}>
                        {h.descripcion}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tipo Conexión */}
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                <Label htmlFor="conexion" className="text-left sm:text-right">
                  Tipo de Conexión
                </Label>
                <Select
                  value={connectionType}
                  onValueChange={setConnectionType}
                >
                  <SelectTrigger
                    id="conexion"
                    className="col-span-1 sm:col-span-3"
                  >
                    <SelectValue placeholder="Seleccione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HDMI">HDMI</SelectItem>
                    <SelectItem value="VGA">VGA</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Proyector */}
              <div
                className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4"
                onClick={() => handleDisabledClick("equipo")}
              >
                <Label htmlFor="equipo" className="text-left sm:text-right">
                  Proyector
                </Label>
                <div className="col-span-1 sm:col-span-3 relative">
                  <Select
                    value={equipoId}
                    onValueChange={setEquipoId}
                    disabled={!requisitosCompletos}
                  >
                    <SelectTrigger
                      id="equipo"
                      className="col-span-1 sm:col-span-3"
                    >
                      <SelectValue placeholder="Seleccione" />
                    </SelectTrigger>
                    <SelectContent>
                      {equiposDisponibles.length === 0 ? (
                        <div className="px-4 py-2 text-sm text-muted-foreground">
                          No hay equipos disponibles para este horario/conexión.
                        </div>
                      ) : (
                        equiposDisponibles.map((e) => (
                          <SelectItem key={e.id} value={String(e.id)}>
                            {e.nombre_equipo}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {!requisitosCompletos && (
                    <div
                      className="absolute inset-0 z-10 cursor-not-allowed"
                      onClick={() => handleDisabledClick("equipo")}
                      title="Selecciona fecha, horas y conexión primero"
                    />
                  )}
                  {!requisitosCompletos && warningTarget === "equipo" && (
                    <p className="text-xs text-red-500 mt-1">
                      Selecciona fecha, horas y conexión.
                    </p>
                  )}
                </div>
              </div>

              {/* Laptop */}
              <div
                className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4"
                onClick={() => handleDisabledClick("laptop")}
              >
                <Label htmlFor="laptop" className="text-left sm:text-right">
                  Laptop
                </Label>
                <div className="col-span-1 sm:col-span-3 relative">
                  <Select
                    value={laptopId}
                    onValueChange={setLaptopId}
                    disabled={!requisitosCompletos}
                  >
                    <SelectTrigger
                      id="laptop"
                      className="col-span-1 sm:col-span-3"
                    >
                      <SelectValue placeholder="Ninguna" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Ninguna (Opcional)</SelectItem>
                      {laptopsDisponibles.length === 0 ? (
                        <div className="px-4 py-2 text-sm text-muted-foreground">
                          No hay laptops disponibles para este horario.
                        </div>
                      ) : (
                        laptopsDisponibles.map((l) => (
                          <SelectItem key={l.id} value={String(l.id)}>
                            {l.nombre_laptop}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {!requisitosCompletos && (
                    <div
                      className="absolute inset-0 z-10 cursor-not-allowed"
                      onClick={() => handleDisabledClick("laptop")}
                      title="Selecciona fecha, horas y conexión primero"
                    />
                  )}
                  {!requisitosCompletos && warningTarget === "laptop" && (
                    <p className="text-xs text-red-500 mt-1">
                      Selecciona fecha, horas y conexión.
                    </p>
                  )}
                </div>
              </div>

              {/* Extensión */}
              <div
                className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4"
                onClick={() => handleDisabledClick("extension")}
              >
                <Label htmlFor="extension" className="text-left sm:text-right">
                  Extensión
                </Label>
                <div className="col-span-1 sm:col-span-3 relative">
                  <Select
                    value={extensionId}
                    onValueChange={setExtensionId}
                    disabled={!requisitosCompletos}
                  >
                    <SelectTrigger
                      id="extension"
                      className="col-span-1 sm:col-span-3"
                    >
                      <SelectValue placeholder="Ninguna" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Ninguna (Opcional)</SelectItem>
                      {extensionesDisponibles.length === 0 ? (
                        <div className="px-4 py-2 text-sm text-muted-foreground">
                          No hay extensiones disponibles para este horario.
                        </div>
                      ) : (
                        extensionesDisponibles.map((x) => (
                          <SelectItem key={x.id} value={String(x.id)}>
                            {x.nombre_extension}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {!requisitosCompletos && (
                    <div
                      className="absolute inset-0 z-10 cursor-not-allowed"
                      onClick={() => handleDisabledClick("extension")}
                      title="Selecciona fecha, horas y conexión primero"
                    />
                  )}
                  {!requisitosCompletos && warningTarget === "extension" && (
                    <p className="text-xs text-red-500 mt-1">
                      Selecciona fecha, horas y conexión.
                    </p>
                  )}
                </div>
              </div>

              {/* Decanato */}
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                <Label htmlFor="decanato" className="text-left sm:text-right">
                  Decanato
                </Label>
                <Select value={decanatoId} onValueChange={setDecanatoId}>
                  <SelectTrigger
                    id="decanato"
                    className="col-span-1 sm:col-span-3"
                  >
                    <SelectValue placeholder="Seleccione" />
                  </SelectTrigger>
                  <SelectContent>
                    {decanatos.map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        {d.nombre_decanato}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Aula */}
              <div
                className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4"
                onClick={() => handleDisabledClick("aula")}
              >
                <Label htmlFor="aula" className="text-left sm:text-right">
                  Aula
                </Label>
                <div className="col-span-1 sm:col-span-3 relative">
                  <Popover open={aulaOpen} onOpenChange={setAulaOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-expanded={aulaOpen}
                        className={`h-10 w-full justify-between ${
                          aulaId ? "text-black" : "text-muted-foreground"
                        }`}
                        id="aula"
                        disabled={!requisitosCompletos}
                      >
                        {(() => {
                          const sel = aulas.find(
                            (x) => String(x.id) === aulaId
                          );
                          return sel ? sel.nombre_aula : "Seleccione un aula";
                        })()}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="ml-2 size-4 opacity-60"
                          aria-hidden="true"
                        >
                          <path d="M7 10l5 5 5-5H7z" />
                        </svg>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="p-2 w-[--radix-popover-trigger-width] min-w-[260px] max-h-80 overflow-auto overscroll-contain touch-pan-y"
                      data-scroll-lock-scrollable
                      onWheelCapture={(e) => e.stopPropagation()}
                      onWheel={(e) => e.stopPropagation()}
                      onTouchStartCapture={(e) => e.stopPropagation()}
                      onTouchMoveCapture={(e) => e.stopPropagation()}
                      style={{ WebkitOverflowScrolling: "touch" }}
                    >
                      <div className="space-y-2">
                        <Input
                          placeholder="Buscar aula..."
                          value={aulaSearch}
                          onChange={(e) => setAulaSearch(e.target.value)}
                          autoFocus
                          className="text-black"
                          disabled={!requisitosCompletos}
                        />
                        <div
                          className="max-h-60 overflow-y-auto rounded-md border overscroll-contain touch-pan-y"
                          data-scroll-lock-scrollable
                          tabIndex={0}
                          onWheelCapture={(e) => e.stopPropagation()}
                          onWheel={(e) => e.stopPropagation()}
                          onTouchStartCapture={(e) => e.stopPropagation()}
                          onTouchMoveCapture={(e) => e.stopPropagation()}
                          style={{ WebkitOverflowScrolling: "touch" }}
                        >
                          {(() => {
                            if (!requisitosCompletos) {
                              return (
                                <div className="px-3 py-2 text-sm text-muted-foreground">
                                  Selecciona fecha, horas y conexión primero.
                                </div>
                              );
                            }
                            const term = aulaSearch.trim().toLowerCase();
                            const base = aulasDisponibles || [];
                            const list = base.filter((a) =>
                              a.nombre_aula.toLowerCase().includes(term)
                            );
                            if (list.length === 0) {
                              return (
                                <div className="px-3 py-2 text-sm text-muted-foreground">
                                  {base.length === 0
                                    ? "No hay aulas disponibles para este horario."
                                    : "Sin resultados."}
                                </div>
                              );
                            }
                            return list.map((a) => {
                              const selected = String(a.id) === aulaId;
                              return (
                                <button
                                  key={a.id}
                                  type="button"
                                  className={
                                    "w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground flex items-center justify-between text-black" +
                                    (selected ? " bg-accent/60" : "")
                                  }
                                  onClick={() => {
                                    setAulaId(String(a.id));
                                    setAulaOpen(false);
                                  }}
                                >
                                  <span>{a.nombre_aula}</span>
                                  {selected ? (
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      viewBox="0 0 24 24"
                                      fill="currentColor"
                                      className="size-4 opacity-80"
                                    >
                                      <path d="M9 16.2l-3.5-3.5 1.4-1.4L9 13.4l7.1-7.1 1.4 1.4z" />
                                    </svg>
                                  ) : null}
                                </button>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                  {!requisitosCompletos && (
                    <div
                      className="absolute inset-0 z-10 cursor-not-allowed"
                      onClick={() => handleDisabledClick("aula")}
                      title="Selecciona fecha, horas y conexión primero"
                    />
                  )}
                  {!requisitosCompletos && warningTarget === "aula" && (
                    <p className="text-xs text-red-500 mt-1">
                      Selecciona fecha, horas y conexión.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="bottom-0 border-t bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-3 sm:px-6 sm:py-4">
            <Button
              variant="outline"
              onClick={() => {
                resetFormulario();
                setOpenModal(false);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                const success = isEditMode
                  ? await onUpdate()
                  : await onCreate();
                if (success) {
                  resetFormulario();
                  setOpenModal(false);
                }
              }}
              className="bg-[#0D4D98]"
              disabled={isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>{isEditMode ? "Guardando..." : "Creando..."}</span>
                </>
              ) : (
                <span>
                  {isEditMode ? "Guardar cambios" : "Crear Reservación"}
                </span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
        <h2 className="font-bold text-xl">Reservas</h2>
        <Button
          className="bg-[#0D4D98] w-full sm:w-auto"
          onClick={() => setOpenModal(true)}
        >
          + Crear Reservación
        </Button>
      </div>

      {reservasLoading ? (
        <div className="flex items-center justify-center p-4">
          <Loader2 className="mr-2 h-6 w-6 animate-spin" />
          <span>Cargando reservas...</span>
        </div>
      ) : reservas.length === 0 ? (
        <p>No hay reservas activas.</p>
      ) : (
        <ReservationsTable
          data={reservas}
          onCancel={(id) => onCancelRes(id)}
          onEdit={(row) => startEdit(row)}
          onComplete={(row) => onCompleteRes(row)}
          equipmentMaps={{
            equipos: mapEquipos,
            laptops: mapLaptops,
            extensiones: mapExtensiones,
            aulas: mapAulas,
          }}
          showUsuario={true}
          usuariosMap={mapUsuarios}
        />
      )}
    </div>
  );
}
