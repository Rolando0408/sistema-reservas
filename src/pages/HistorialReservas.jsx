import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import {
  listMisReservas,
  getEquipos,
  getLaptops,
  getExtensiones,
  getAulas,
  ESTADOS_RESERVA,
} from "../lib/reservas";
import ReservationsTable from "../components/ReservationsTable"; // Reutiliza tu tabla
import { Loader2 } from "lucide-react"; // Para el spinner

export default function HistorialReservas() {
  const [historialReservas, setHistorialReservas] = useState([]);
  const [historialLoading, setHistorialLoading] = useState(true);

  // Necesitamos los mapas para que ReservationsTable funcione
  const [mapEquipos, setMapEquipos] = useState({});
  const [mapLaptops, setMapLaptops] = useState({});
  const [mapExtensiones, setMapExtensiones] = useState({});
  const [mapAulas, setMapAulas] = useState({});

  // Carga el historial de reservas y los mapas al montar el componente
  useEffect(() => {
    const loadData = async () => {
      try {
        setHistorialLoading(true);

        const todasMisReservas = await listMisReservas({ futuras: false });

        // Historial: solo canceladas (cualquier tipo) o completadas
        const historial = (todasMisReservas || []).filter((r) =>
          [
            ESTADOS_RESERVA.CANCELADA,
            ESTADOS_RESERVA.CANCELADA_USUARIO,
            ESTADOS_RESERVA.CANCELADA_ADMIN,
            ESTADOS_RESERVA.NO_SHOW,
            ESTADOS_RESERVA.COMPLETADA,
          ].includes(r.estado)
        );

        setHistorialReservas(historial);

        // Carga los mapas necesarios para la tabla
        const [eqsAll, lapsAll, extsAll, aulasAll] = await Promise.all([
          getEquipos({ onlyDisponibles: false }),
          getLaptops({ onlyDisponibles: false }),
          getExtensiones({ onlyDisponibles: false }),
          getAulas(),
        ]);
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
          (aulasAll || []).reduce((acc, it) => {
            acc[it.id] = it.nombre_aula;
            return acc;
          }, {})
        );
      } catch (err) {
        console.error("Error al cargar historial:", err);
        Swal.fire(
          "Error",
          err.message || "No se pudo cargar el historial",
          "error"
        );
        setHistorialReservas([]); // Limpia en caso de error
      } finally {
        setHistorialLoading(false);
      }
    };
    loadData();
  }, []); // Carga solo una vez al montar

  return (
    <div className="historial-reservas my-8 mx-5 flex flex-col items-center justify-center">
      <h2 className="text-lg font-bold tracking-tight mb-3">
        Historial de Reservas
      </h2>
      {historialLoading ? (
        // Muestra spinner mientras carga
        <div className="flex items-center justify-center p-10">
          <Loader2 className="mr-2 h-8 w-8 animate-spin text-primary" />{" "}
          {/* Spinner más grande */}
          <span>Cargando historial...</span>
        </div>
      ) : historialReservas.length === 0 ? (
        // Mensaje si no hay historial
        <div className="rounded-md border border-dashed p-6 text-center text-muted-foreground">
          <p>No tienes reservas pasadas registradas.</p>
        </div>
      ) : (
        // Muestra la tabla con los datos del historial
        // Pasamos showCancelButton={false} para ocultar el botón de cancelar
        <ReservationsTable
          data={historialReservas}
          // onCancel={onCancel} // No necesitamos cancelar aquí
          equipmentMaps={{
            equipos: mapEquipos,
            laptops: mapLaptops,
            extensiones: mapExtensiones,
            aulas: mapAulas,
          }}
          showCancelButton={false} // 👈 Oculta cancelar en historial
          showEditButton={false} // 👈 Oculta editar en historial
        />
      )}
    </div>
  );
}
