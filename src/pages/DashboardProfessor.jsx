import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import "./DashboardProfessor.css";
import {
  ESTADOS_RESERVA,
  getHorarios,
  getDecanatos,
  getEquipos,
  getLaptops,
  getExtensiones,
  listMisReservas,
  listMisReservasEnRango,
  listEquiposDisponibles,
  listLaptopsDisponibles,
  listExtensionesDisponibles,
  createReserva,
  cancelReserva,
  toCaracasISO,
} from "../lib/reservas";
import supabase from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import Modal from "../components/Modal";
import ReservationsTable from "../components/ReservationsTable";

export default function DashboardProfessor() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [reservas, setReservas] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [decanatos, setDecanatos] = useState([]);

  // Form crear reserva
  const [fecha, setFecha] = useState(""); // YYYY-MM-DD
  const [horaInicioId, setHoraInicioId] = useState(null);
  const [horaFinId, setHoraFinId] = useState(null);
  // Tipo de conexión requerido (obligatorio): 'HDMI' | 'VGA'
  const [connectionType, setConnectionType] = useState("");
  const [equipoId, setEquipoId] = useState(null);
  const [laptopId, setLaptopId] = useState(null);
  const [extensionId, setExtensionId] = useState(null);
  const [decanatoId, setDecanatoId] = useState(null);
  const [aula, setAula] = useState("");

  const [equiposDisponibles, setEquiposDisponibles] = useState([]);
  const [laptopsDisponibles, setLaptopsDisponibles] = useState([]);
  const [extensionesDisponibles, setExtensionesDisponibles] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  // Mapas para mostrar nombres en la tabla
  const [mapEquipos, setMapEquipos] = useState({});
  const [mapLaptops, setMapLaptops] = useState({});
  const [mapExtensiones, setMapExtensiones] = useState({});

  // Guard de ruta: requiere sesión y rol profesor (id_rol_fk === 2)
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
  }, []);

  // Cargar catálogos y mis reservas
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
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
        // construir mapas id->nombre
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
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Actualizar recursos disponibles cuando cambian fecha/horas o filtros
  useEffect(() => {
    const refreshDisponibles = async () => {
      try {
        if (!fecha || !horaInicioId || !horaFinId || !connectionType) return;
        const needHdmi = connectionType === "HDMI";
        const needVga = connectionType === "VGA";
        const [eqs, laps, exts] = await Promise.all([
          listEquiposDisponibles({
            dateYYYYMMDD: fecha,
            startHorarioId: horaInicioId,
            endHorarioId: horaFinId,
            requireHdmi: needHdmi,
            requireVga: needVga,
          }),
          listLaptopsDisponibles({
            dateYYYYMMDD: fecha,
            startHorarioId: horaInicioId,
            endHorarioId: horaFinId,
          }),
          listExtensionesDisponibles({
            dateYYYYMMDD: fecha,
            startHorarioId: horaInicioId,
            endHorarioId: horaFinId,
          }),
        ]);
        setEquiposDisponibles(eqs);
        setLaptopsDisponibles(laps);
        // Extensiones eléctricas no dependen del tipo de conexión de video
        setExtensionesDisponibles(exts || []);
        // Reset selección si ya no está disponible
        if (equipoId && !eqs.find((e) => e.id === equipoId)) setEquipoId(null);
        if (laptopId && !laps.find((l) => l.id === laptopId)) setLaptopId(null);
        if (extensionId && !(exts || []).find((x) => x.id === extensionId))
          setExtensionId(null);
      } catch (err) {
        console.error(err);
      }
    };
    refreshDisponibles();
  }, [fecha, horaInicioId, horaFinId, connectionType]);

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
        return;
      }
      await createReserva({
        dateYYYYMMDD: fecha,
        startHorarioId: horaInicioId,
        endHorarioId: horaFinId,
        id_equipo: equipoId,
        id_laptop: laptopId,
        id_extension: extensionId,
        id_decanato: decanatoId,
        aula,
      });
      Swal.fire(
        "Reserva creada",
        "Tu reservación fue creada con éxito",
        "success"
      );
      const mis = await listMisReservas({ futuras: true });
      setReservas(mis);
    } catch (err) {
      Swal.fire("Error", err.message || "No se pudo crear la reserva", "error");
    }
  };

  const onCancel = async (id) => {
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

  const onSignOut = async () => {
    try {
      const result = await Swal.fire({
        title: "¿Cerrar sesión?",
        text: "Se cerrará tu sesión actual.",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Sí, cerrar sesión",
        cancelButtonText: "Cancelar",
        reverseButtons: true,
        focusCancel: true,
      });
      if (!result.isConfirmed) return;

      setLoading(true);
      await supabase.auth.signOut();
      await Swal.fire(
        "Sesión cerrada",
        "Has cerrado sesión correctamente.",
        "success"
      );
      navigate("/");
    } catch (err) {
      Swal.fire("Error", err.message || "No se pudo cerrar sesión", "error");
    } finally {
      setLoading(false);
    }
  };

  const formatHora = (iso) =>
    new Date(iso).toLocaleTimeString("es-VE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  const formatFecha = (iso) => new Date(iso).toLocaleDateString("es-VE");

  return (
    <div className="prof-dashboard">
      <div className="DashboardHeader">
        <h1 className="titleDash">Mis Reservaciones</h1>
        {loading && <p>Cargando...</p>}
        <button className="btnLogOut" onClick={onSignOut}>
          Cerrar sesión
        </button>
      </div>
      {/* Botón de crear se mostrará al lado del título de Reservas más abajo */}

      <Modal
        open={openModal}
        onClose={() => setOpenModal(false)}
        title="Nueva Reservación"
        footer={
          <>
            <button onClick={() => setOpenModal(false)}>Cancelar</button>
            <button
              onClick={async () => {
                await onCreate();
                setOpenModal(false);
              }}
            >
              Crear Reservación
            </button>
          </>
        }
      >
        <div className="form-row">
          <label>Fecha</label>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
        </div>
        <div className="form-row">
          <label>Inicio</label>
          <select
            value={horaInicioId || ""}
            onChange={(e) => setHoraInicioId(Number(e.target.value) || null)}
          >
            <option value="">Seleccione</option>
            {horarios.map((h) => (
              <option key={h.id} value={h.id}>
                {h.descripcion}
              </option>
            ))}
          </select>
          <label>Fin</label>
          <select
            value={horaFinId || ""}
            onChange={(e) => setHoraFinId(Number(e.target.value) || null)}
          >
            <option value="">Seleccione</option>
            {horarios.map((h) => (
              <option key={h.id} value={h.id}>
                {h.descripcion}
              </option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <label>Tipo de conexión</label>
          <select
            value={connectionType}
            onChange={(e) => setConnectionType(e.target.value)}
          >
            <option value="">Seleccione</option>
            <option value="HDMI">HDMI</option>
            <option value="VGA">VGA</option>
          </select>
        </div>
        <div className="form-row">
          <label>Equipo</label>
          <select
            value={equipoId || ""}
            onChange={(e) => setEquipoId(Number(e.target.value) || null)}
          >
            <option value="">Seleccione</option>
            {equiposDisponibles.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre_equipo}
              </option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <label>Laptop (opcional)</label>
          <select
            value={laptopId || ""}
            onChange={(e) => setLaptopId(Number(e.target.value) || null)}
          >
            <option value="">Ninguna</option>
            {laptopsDisponibles.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nombre_laptop}
              </option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <label>Extensión (opcional)</label>
          <select
            value={extensionId || ""}
            onChange={(e) => setExtensionId(Number(e.target.value) || null)}
          >
            <option value="">Ninguna</option>
            {extensionesDisponibles.map((x) => (
              <option key={x.id} value={x.id}>
                {x.nombre_extension}
              </option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <label>Decanato</label>
          <select
            value={decanatoId || ""}
            onChange={(e) => setDecanatoId(Number(e.target.value) || null)}
          >
            <option value="">Seleccione</option>
            {decanatos.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nombre_decanato}
              </option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <label>Aula</label>
          <input
            type="text"
            value={aula}
            onChange={(e) => setAula(e.target.value)}
            placeholder="Ej: Aula 101"
          />
        </div>
      </Modal>

      {/* Listado de reservas y encabezado con botón */}
      <div className="lista-reservas">
        <div className="reservas-header">
          <h2 className="titleReservas">Reservas</h2>
          <button
            className="btnCreateReserva"
            onClick={() => setOpenModal(true)}
          >
            + Crear Reservación
          </button>
        </div>
        {reservas.length === 0 ? (
          <p>No tienes reservas futuras.</p>
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
