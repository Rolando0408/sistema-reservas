import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import "./DashboardProfessor.css"; // Se mantiene para el layout general del dashboard
import {
  ESTADOS_RESERVA,
  getHorarios,
  getDecanatos,
  getEquipos,
  getLaptops,
  getExtensiones,
  getAulas,
  listMisReservas,
  listEquiposDisponibles,
  listLaptopsDisponibles,
  listExtensionesDisponibles,
  createReserva,
  cancelReserva,
  updateReserva,
} from "../lib/reservas";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate, Link } from "react-router-dom";
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
// import { Input } from "@/components/ui/input"; // No longer used
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
import { CalendarIcon } from "lucide-react";
import { format, startOfDay, isToday, set } from "date-fns"; // 'parse' ya no es necesario aquí
import { es } from "date-fns/locale";
import ReservationsTable from "../components/ReservationsTable";
import { Loader2 } from "lucide-react";

export default function DashboardProfessor() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [reservas, setReservas] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [decanatos, setDecanatos] = useState([]);
  const [reservasLoading, setReservasLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Form crear reserva (Estado ajustado a strings para Select)
  const [fecha, setFecha] = useState(); // Objeto Date
  const [horaInicioId, setHoraInicioId] = useState("");
  const [horaFinId, setHoraFinId] = useState("");
  const [connectionType, setConnectionType] = useState("");
  const [equipoId, setEquipoId] = useState("");
  const [laptopId, setLaptopId] = useState("none"); // Usa 'none' para opcional
  const [extensionId, setExtensionId] = useState("none");
  const [decanatoId, setDecanatoId] = useState("none");
  const [aulas, setAulas] = useState([]);
  const [aulaId, setAulaId] = useState("");
  const [aulaOpen, setAulaOpen] = useState(false);
  const [aulaSearch, setAulaSearch] = useState("");
  // Controla el Popover del calendario de fecha en el diálogo para cerrar al seleccionar
  const [fechaPopoverOpen, setFechaPopoverOpen] = useState(false);

  const [equiposDisponibles, setEquiposDisponibles] = useState([]);
  const [laptopsDisponibles, setLaptopsDisponibles] = useState([]);
  const [extensionesDisponibles, setExtensionesDisponibles] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [blockDialogClose, setBlockDialogClose] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingReservaId, setEditingReservaId] = useState(null);

  const [mapEquipos, setMapEquipos] = useState({});
  const [mapLaptops, setMapLaptops] = useState({});
  const [mapExtensiones, setMapExtensiones] = useState({});
  const [mapAulas, setMapAulas] = useState({});
  const [warningTarget, setWarningTarget] = useState(null);

  // Guard de ruta (Sin cambios)
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
      if (error || perfil?.id_rol_fk !== 2) {
        navigate("/");
        return;
      }
    };
    guard();
  }, [navigate]);

  // Cargar catálogos y mis reservas (Sin cambios significativos)
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setReservasLoading(true);

        const [hs, decs, aulasData, mis, eqsAll, lapsAll, extsAll] =
          await Promise.all([
            getHorarios(),
            getDecanatos(),
            getAulas(),
            listMisReservas({ futuras: true }),
            getEquipos({ onlyDisponibles: false }),
            getLaptops({ onlyDisponibles: false }),
            getExtensiones({ onlyDisponibles: false }),
          ]);
        setHorarios(hs || []);
        setDecanatos(decs || []);
        setAulas(aulasData || []);
        // Excluir canceladas de "Mis reservas" (próximas)
        setReservas(
          (mis || []).filter((r) => r.estado !== ESTADOS_RESERVA.CANCELADA)
        );
        // Construir mapas (lógica reducida para concisión, se asume correcta)
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
      } catch (err) {
        console.error(err);
        Swal.fire("Error", err.message || "No se pudo cargar datos", "error");
        setReservas([]);
        setReservasLoading(false);
      } finally {
        setLoading(false);
        if (reservasLoading) setReservasLoading(false);
      }
    };
    load();
  }, []);

  // Actualizar recursos disponibles (FIX: Formateo de fecha y conversión de ID)
  useEffect(() => {
    const refreshDisponibles = async () => {
      try {
        // --- VALIDACIÓN Y PREPARACIÓN ---
        if (!fecha || !horaInicioId || !horaFinId || !connectionType) {
          setEquiposDisponibles([]);
          setLaptopsDisponibles([]);
          setExtensionesDisponibles([]);
          return;
        }

        const fechaFormateada = format(fecha, "yyyy-MM-dd"); // ✅ Convierte Date a "YYYY-MM-DD"
        const inicioIdNum = Number(horaInicioId); // ✅ Convierte string a number
        const finIdNum = Number(horaFinId); // ✅ Convierte string a number
        const needHdmi = connectionType === "HDMI";
        const needVga = connectionType === "VGA";

        // --- LLAMADAS A LA API CON DATOS CORRECTOS ---
        const [eqs, laps, exts] = await Promise.all([
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
        ]);

        setEquiposDisponibles(eqs || []);
        setLaptopsDisponibles(laps || []);
        setExtensionesDisponibles(exts || []);

        // --- RESET DE SELECCIÓN (Ajustado a strings y 'none') ---
        const equipoIdActualNum = equipoId ? Number(equipoId) : null;
        if (
          equipoIdActualNum &&
          !(eqs || []).find((e) => e.id === equipoIdActualNum)
        ) {
          setEquipoId("");
        }
        const laptopIdActualNum =
          laptopId && laptopId !== "none" ? Number(laptopId) : null;
        if (
          laptopIdActualNum &&
          !(laps || []).find((l) => l.id === laptopIdActualNum)
        ) {
          setLaptopId("none");
        }
        const extensionIdActualNum =
          extensionId && extensionId !== "none" ? Number(extensionId) : null;
        if (
          extensionIdActualNum &&
          !(exts || []).find((x) => x.id === extensionIdActualNum)
        ) {
          setExtensionId("none");
        }
      } catch (err) {
        console.error("Error al refrescar disponibles:", err);
        setEquiposDisponibles([]);
        setLaptopsDisponibles([]);
        setExtensionesDisponibles([]);
        Swal.fire(
          "Error",
          "No se pudieron cargar los equipos disponibles: " + err.message,
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

  // --- LÓGICA DEL FILTRO DE HORARIOS PASADOS ---
  const getAvailableHorariosParaSelect = () => {
    if (!fecha || !isToday(fecha)) {
      return horarios;
    }

    const ahora = new Date();

    return horarios.filter((h) => {
      const timeString = h.hora;
      const [hStr, mStr] = timeString.split(":"); // Solo necesitamos hora y minuto
      const horarioHoy = new Date();

      // Seteamos la hora y minuto del horario en el objeto Date de hoy
      horarioHoy.setHours(parseInt(hStr, 10), parseInt(mStr, 10), 0, 0); // Forzamos segundos/milisegundos a 0

      // Compara si la hora del horario es estrictamente posterior a la hora actual
      return horarioHoy > ahora;
    });
  };
  const horariosFiltrados = getAvailableHorariosParaSelect();

  const getHorariosNoPasados = () => {
    if (!fecha || !isToday(fecha)) {
      return horarios; // Muestra todos si no hay fecha o no es hoy
    }

    const ahora = new Date();

    return horarios.filter((h) => {
      const timeString = h.hora;
      const [hStr, mStr] = timeString.split(":");
      const horarioHoy = new Date();

      // Seteamos la hora y minuto del horario en el objeto Date de hoy
      horarioHoy.setHours(parseInt(hStr, 10), parseInt(mStr, 10), 0, 0);
      horarioHoy.setSeconds(0);
      horarioHoy.setMilliseconds(0);

      return horarioHoy > ahora; // Compara si la hora es posterior a la hora actual
    });
  };

  // 1. Horarios para el SELECT DE INICIO (Filtrado de horas pasadas HOY)
  const horariosInicioFiltrados = getHorariosNoPasados();

  // 2. Horarios para el SELECT DE FIN (Filtrado después de la hora de inicio)
  const getHorariosFinFiltrados = () => {
    const listaBase = horariosInicioFiltrados;

    if (!horaInicioId) {
      return listaBase;
    }

    // 1. Encuentra el objeto horario de la hora de inicio seleccionada
    const horarioInicioSeleccionado = horarios.find(
      (h) => String(h.id) === horaInicioId
    );

    if (!horarioInicioSeleccionado) {
      return listaBase;
    }

    // 2. Obtiene el string de la hora de inicio (ej: "10:20:00")
    const horaInicioString = horarioInicioSeleccionado.hora;

    // 3. Filtra la lista base para devolver solo los elementos cuya hora es estrictamente mayor (>)
    //    Esto funciona porque los strings "HH:mm:ss" se comparan alfabéticamente
    return listaBase.filter((h) => h.hora > horaInicioString);
  };

  const horariosFinFiltrados = getHorariosFinFiltrados();

  useEffect(() => {
    if (
      horaFinId &&
      !horariosFinFiltrados.find((h) => String(h.id) === horaFinId)
    ) {
      // La hora de fin seleccionada ya no está disponible en la lista filtrada
      setHoraFinId("");
    }
  }, [horaInicioId, horariosFinFiltrados, horaFinId]);

  // Función onCreate con guard para evitar cierre del diálogo durante SweetAlert
  const onCreate = async () => {
    setIsCreating(true);
    try {
      // Validación de campos requeridos
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
        return false; // Sale sin intentar crear
      }

      // La conversión de IDs a Number se hace en createReserva
      await createReserva({
        dateYYYYMMDD: format(fecha, "yyyy-MM-dd"), // ✅ Convierte Date a String
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
        text: "Tu reservación fue creada con éxito",
        icon: "success",
        allowOutsideClick: false,
      });
      setTimeout(() => setBlockDialogClose(false), 120);

      const mis = await listMisReservas({ futuras: true });
      // Excluir canceladas de "Mis reservas" inmediatamente tras crear
      setReservas(
        (mis || []).filter((r) => r.estado !== ESTADOS_RESERVA.CANCELADA)
      );
      return true; // Indica éxito para que el footer cierre el modal
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

  const onCancel = async (id) => {
    // ... (Tu función onCancel, se asume correcta) ...
    try {
      await cancelReserva({ reservaId: id });
      Swal.fire("Cancelada", "La reserva fue cancelada", "success");
      // Refrescar y excluir canceladas de la lista de próximas
      const mis = await listMisReservas({ futuras: true });
      setReservas(
        (mis || []).filter((r) => r.estado !== ESTADOS_RESERVA.CANCELADA)
      );
    } catch (err) {
      Swal.fire(
        "No se pudo cancelar",
        err.message || "Intenta nuevamente",
        "error"
      );
    }
  };

  const resetFormulario = () => {
    console.log("INTENTANDO LIMPIAR FORMULARIO...");
    setFecha(undefined);
    setHoraInicioId("");
    setHoraFinId("");
    setConnectionType("");
    setEquipoId("");
    setLaptopId("none");
    setExtensionId("none");
    setDecanatoId("none");
    setAulaId("");
    setEquiposDisponibles([]);
    setLaptopsDisponibles([]);
    setExtensionesDisponibles([]);
    setIsEditMode(false);
    setEditingReservaId(null);
  };

  const requisitosCompletos =
    fecha && horaInicioId && horaFinId && connectionType;

  const handleDisabledClick = (targetName) => {
    // Si los requisitos NO están completos, muestra el aviso
    if (!requisitosCompletos) {
      setWarningTarget(targetName);
      // Opcional: Ocultar el aviso después de unos segundos
      setTimeout(() => {
        setWarningTarget(null);
      }, 3000); // Se oculta después de 3 segundos
    } else {
      // Si los requisitos SÍ están completos (aunque no debería llamarse aquí), oculta el aviso
      setWarningTarget(null);
    }
  };

  // Helpers para obtener fecha y hora local Caracas desde ISO
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

      // Fecha desde ISO (Caracas)
      const sp = isoToCaracasParts(row.fecha_hora_inicio);
      const fechaLocal = new Date(sp.y, sp.m - 1, sp.d);
      setFecha(fechaLocal);

      // Derivar HH:mm:ss en Caracas y mapear a IDs de horarios
      const startHHMMSS = `${sp.hh}:${sp.mm}:00`;
      const endParts = isoToCaracasParts(row.fecha_hora_fin);
      const endHHMMSS = `${endParts.hh}:${endParts.mm}:00`;
      const hIni = horarios.find((h) => h.hora === startHHMMSS);
      const hFin = horarios.find((h) => h.hora === endHHMMSS);
      setHoraInicioId(hIni ? String(hIni.id) : "");
      setHoraFinId(hFin ? String(hFin.id) : "");

      // Tipo de conexión a partir del equipo actual
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
      console.error("Error al preparar edición:", e);
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

      const mis = await listMisReservas({ futuras: true });
      setReservas(
        (mis || []).filter((r) => r.estado !== ESTADOS_RESERVA.CANCELADA)
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
    <div className="prof-dashboard">
      <Dialog
        open={openModal}
        onOpenChange={(isOpen) => {
          console.log("onOpenChange disparado. isOpen:", isOpen);
          // Evita que el diálogo se cierre mientras se muestra un SweetAlert bloqueante
          if (!isOpen && blockDialogClose) {
            console.log("Cierre del diálogo bloqueado por alerta activa");
            return;
          }
          setOpenModal(isOpen);
          if (!isOpen) {
            resetFormulario();
          }
        }}
      >
        <DialogContent
          onInteractOutside={(e) => {
            if (blockDialogClose) {
              e.preventDefault();
            }
          }}
          onEscapeKeyDown={(e) => {
            if (blockDialogClose) {
              e.preventDefault();
            }
          }}
          className="p-0 h-[100dvh] w-full rounded-none sm:h-auto sm:w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl sm:rounded-lg sm:p-6 flex flex-col"
        >
          <DialogHeader className="sticky top-0 border-b px-4 py-3 sm:px-6 sm:py-4">
            <DialogTitle>
              {isEditMode ? "Editar reservación" : "Nueva Reservación"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? "Modifica los campos y guarda los cambios."
                : "Completa todos los campos para crear tu reserva."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* --- FILA DE INICIO --- */}
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
                    {horariosFiltrados.map((h) => (
                      <SelectItem key={h.id} value={String(h.id)}>
                        {h.descripcion}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* --- FILA DE FIN --- */}
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
              {/* --- FILA DE FECHA --- */}
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
                      <CalendarIcon className="h-4 w-4 mr-2" />{" "}
                      {/* Ajuste de icono */}
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
                        // Cierra el popover al seleccionar una fecha (como en Disponibilidad)
                        setFechaPopoverOpen(false);
                      }}
                      initialFocus
                      // Deshabilita fechas pasadas y fines de semana (sábado y domingo)
                      disabled={(date) => {
                        const isPast = date < startOfDay(new Date());
                        const dow = date.getDay();
                        const isWeekend = dow === 0 || dow === 6;
                        return isPast || isWeekend;
                      }}
                      className={""}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              {/* --- FILA DE CONEXIÓN --- */}
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
              {/* --- FILA DE EQUIPO --- */}
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
                        // Si no hay equipos, muestra este mensaje
                        <div className="px-4 py-2 text-sm text-muted-foreground">
                          No hay equipos disponibles para este horario/conexión.
                        </div>
                      ) : (
                        // Si SÍ hay equipos, muestra las opciones
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
                      className="absolute inset-0 z-10 cursor-not-allowed" // Cubre todo el select, cursor indica deshabilitado
                      onClick={() => handleDisabledClick("equipo")} // Llama a la función al hacer clic en la trampa
                      title="Selecciona fecha, horas y conexión primero" // Tooltip opcional
                    />
                  )}

                  {!requisitosCompletos && warningTarget === "equipo" && (
                    <p className="text-xs text-red-500 mt-1">
                      Selecciona fecha, horas y conexión.
                    </p>
                  )}
                </div>
              </div>
              {/* --- FILA DE LAPTOP --- */}
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
                        // Muestra mensaje si no hay laptops, además de la opción "Ninguna"
                        <div className="px-4 py-2 text-sm text-muted-foreground">
                          No hay laptops disponibles para este horario.
                        </div>
                      ) : (
                        // Muestra las laptops disponibles
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
                      className="absolute inset-0 z-10 cursor-not-allowed" // Cubre todo el select, cursor indica deshabilitado
                      onClick={() => handleDisabledClick("laptop")} // Llama a la función al hacer clic en la trampa
                      title="Selecciona fecha, horas y conexión primero" // Tooltip opcional
                    />
                  )}
                  {!requisitosCompletos && warningTarget === "laptop" && (
                    <p className="text-xs text-red-500 mt-1">
                      Selecciona fecha, horas y conexión.
                    </p>
                  )}
                </div>
              </div>
              {/* --- FILA DE EXTENSIÓN --- */}
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
                      className="absolute inset-0 z-10 cursor-not-allowed" // Cubre todo el select, cursor indica deshabilitado
                      onClick={() => handleDisabledClick("extension")} // Llama a la función al hacer clic en la trampa
                      title="Selecciona fecha, horas y conexión primero" // Tooltip opcional
                    />
                  )}
                  {!requisitosCompletos && warningTarget === "extension" && (
                    <p className="text-xs text-red-500 mt-1">
                      Selecciona fecha, horas y conexión.
                    </p>
                  )}
                </div>
              </div>
              {/* --- FILA DE DECANATO --- */}
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
              {/* --- FILA DE AULA (MODIFICADA) --- */}
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                <Label htmlFor="aula" className="text-left sm:text-right">
                  Aula
                </Label>
                {/* Combobox de aulas (buscable) */}
                <div className="col-span-1 sm:col-span-3">
                  <Popover open={aulaOpen} onOpenChange={setAulaOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-expanded={aulaOpen}
                        className={`w-full justify-between ${
                          aulaId ? "text-black" : "text-muted-foreground"
                        }`}
                        id="aula"
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
                      className="p-2 w-[--radix-popover-trigger-width] min-w-[260px] max-h-80 overflow-auto overscroll-contain"
                      data-scroll-lock-scrollable
                      onWheelCapture={(e) => e.stopPropagation()}
                      onWheel={(e) => e.stopPropagation()}
                    >
                      <div className="space-y-2">
                        <Input
                          placeholder="Buscar aula..."
                          value={aulaSearch}
                          onChange={(e) => setAulaSearch(e.target.value)}
                          autoFocus
                          className="text-black"
                        />
                        <div
                          className="max-h-60 overflow-y-auto rounded-md border overscroll-contain"
                          data-scroll-lock-scrollable
                          tabIndex={0}
                          onWheelCapture={(e) => e.stopPropagation()}
                          onWheel={(e) => e.stopPropagation()}
                        >
                          {(() => {
                            const term = aulaSearch.trim().toLowerCase();
                            const list = (aulas || []).filter((a) =>
                              a.nombre_aula.toLowerCase().includes(term)
                            );
                            if (list.length === 0) {
                              return (
                                <div className="px-3 py-2 text-sm text-muted-foreground">
                                  {aulas.length === 0
                                    ? "No hay aulas disponibles."
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
                </div>
              </div>
              {/* --- FIN FILA DE AULA --- */}
            </div>
          </div>
          {/* Fin del contenido del formulario */}

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
              disabled={isCreating} // 👈 Deshabilita mientras carga
            >
              {/* 👇 Contenido condicional 👇 */}
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

      {/* Listado de reservas y encabezado con botón */}
      <div className="lista-reservas">
        <div className="reservas-header flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
          <div className="flex items-center gap-4">
            <h2 className="titleReservas font-bold text-xl">Mis reservas</h2>
            <Link
              to="/app/disponibilidad" // Ruta a la nueva página
              className="text-sm text-blue-500 hover:underline hover:text-purple-700 ml-[-9px]"
            >
              (Ver disponibilidad general)
            </Link>
          </div>
          <Button
            className="btnCreateReserva bg-[#0D4D98] w-full sm:w-auto"
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
          <p>No tienes reservas próximas.</p>
        ) : (
          <ReservationsTable
            data={reservas}
            onCancel={(id) => onCancel(id)}
            onEdit={(row) => startEdit(row)}
            equipmentMaps={{
              equipos: mapEquipos,
              laptops: mapLaptops,
              extensiones: mapExtensiones,
              aulas: mapAulas,
            }}
          />
        )}
      </div>
    </div>
  );
}
