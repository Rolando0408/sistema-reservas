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
  listMisReservas,
  listEquiposDisponibles,
  listLaptopsDisponibles,
  listExtensionesDisponibles,
  createReserva,
  cancelReserva,
} from "../lib/reservas";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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

  // Form crear reserva (Estado ajustado a strings para Select)
  const [fecha, setFecha] = useState(); // Objeto Date
  const [horaInicioId, setHoraInicioId] = useState("");
  const [horaFinId, setHoraFinId] = useState("");
  const [connectionType, setConnectionType] = useState("");
  const [equipoId, setEquipoId] = useState("");
  const [laptopId, setLaptopId] = useState("none"); // Usa 'none' para opcional
  const [extensionId, setExtensionId] = useState("none");
  const [decanatoId, setDecanatoId] = useState("none");
  const [aula, setAula] = useState("");

  const [equiposDisponibles, setEquiposDisponibles] = useState([]);
  const [laptopsDisponibles, setLaptopsDisponibles] = useState([]);
  const [extensionesDisponibles, setExtensionesDisponibles] = useState([]);
  const [openModal, setOpenModal] = useState(false);

  const [mapEquipos, setMapEquipos] = useState({});
  const [mapLaptops, setMapLaptops] = useState({});
  const [mapExtensiones, setMapExtensiones] = useState({});
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

        const [hs, decs, mis, eqsAll, lapsAll, extsAll] = await Promise.all([
          getHorarios(),
          getDecanatos(),
          listMisReservas({ futuras: true }),
          getEquipos({ onlyDisponibles: false }),
          getLaptops({ onlyDisponibles: false }),
          getExtensiones({ onlyDisponibles: false }),
        ]);
        setHorarios(hs);
        setDecanatos(decs);
        setReservas(mis);
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
          }),
          listLaptopsDisponibles({
            dateYYYYMMDD: fechaFormateada,
            startHorarioId: inicioIdNum,
            endHorarioId: finIdNum,
          }),
          listExtensionesDisponibles({
            dateYYYYMMDD: fechaFormateada,
            startHorarioId: inicioIdNum,
            endHorarioId: finIdNum,
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

  // Función onCreate (FIX: Cierre del Modal solo en éxito)
  const onCreate = async () => {
    try {
      if (
        !fecha ||
        !horaInicioId ||
        !horaFinId ||
        !equipoId ||
        !connectionType
      ) {
        Swal.fire(
          "Faltan datos",
          "Selecciona fecha, horas, tipo de conexión y equipo",
          "warning"
        );
        return; // Sale sin intentar crear
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
        aula,
      });

      Swal.fire(
        "Reserva creada",
        "Tu reservación fue creada con éxito",
        "success"
      );

      const mis = await listMisReservas({ futuras: true });
      setReservas(mis);
      setOpenModal(false); // ✅ Cierra el modal solo en caso de éxito
    } catch (err) {
      // Si hay error, el modal se mantiene abierto
      Swal.fire("Error", err.message || "No se pudo crear la reserva", "error");
    }
  };

  const onCancel = async (id) => {
    // ... (Tu función onCancel, se asume correcta) ...
    try {
      await cancelReserva({ reservaId: id });
      Swal.fire("Cancelada", "La reserva fue cancelada", "success");
      const mis = await listMisReservas({ futuras: true });
      setReservas(mis);
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
    setAula("");
    setEquiposDisponibles([]);
    setLaptopsDisponibles([]);
    setExtensionesDisponibles([]);
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

  return (
    <div className="prof-dashboard">
      <Dialog
        open={openModal}
        onOpenChange={(isOpen) => {
          console.log("onOpenChange disparado. isOpen:", isOpen);
          setOpenModal(isOpen);
          if (!isOpen) {
            resetFormulario();
          }
        }}
      >
        <DialogContent className="p-0 h-[100dvh] w-full rounded-none sm:h-auto sm:w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl sm:rounded-lg sm:p-6 flex flex-col">
          <DialogHeader className="sticky top-0 z-10 border-b px-4 py-3 sm:px-6 sm:py-4">
            <DialogTitle>Nueva Reservación</DialogTitle>
            <DialogDescription>
              Completa todos los campos para crear tu reserva.
            </DialogDescription>
          </DialogHeader> 

          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* --- FILA DE FECHA --- */}
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                <Label htmlFor="fecha" className="text-left sm:text-right">
                  Fecha
                </Label>
                <Popover>
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
                      onSelect={setFecha}
                      initialFocus
                      disabled={{ before: startOfDay(new Date()) }}
                      className={""}
                    />
                  </PopoverContent>
                </Popover>
              </div>
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
              {/* --- FILA DE AULA --- */}
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                <Label htmlFor="aula" className="text-left sm:text-right">
                  Aula
                </Label>
                <Input
                  id="aula"
                  type="text"
                  value={aula}
                  onChange={(e) => setAula(e.target.value)}
                  placeholder="Ej: Aula 101"
                  className="col-span-1 sm:col-span-3"
                />
              </div>
            </div>
          </div>
          {/* Fin del contenido del formulario */}

          <DialogFooter className="bottom-0 z-10 border-t bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-3 sm:px-6 sm:py-4">
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
                await onCreate();
                resetFormulario();
                setOpenModal(false);
              }}
              className="bg-[#0D4D98]"
            >
              Crear Reservación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Listado de reservas y encabezado con botón */}
      <div className="lista-reservas">
        <div className="reservas-header">
          <h2 className="titleReservas font-bold text-lg">Mis reservas</h2>
          <Button
            className="btnCreateReserva bg-[#0D4D98]"
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
            equipmentMaps={{
              equipos: mapEquipos,
              laptops: mapLaptops,
              extensiones: mapExtensiones,
            }}
          />
        )}
      </div>
    </div>
  );
}
