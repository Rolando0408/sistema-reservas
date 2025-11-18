import React, { useEffect, useState } from "react";
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
} from "@/lib/reservas";
import ReservationsTable from "@/components/ReservationsTable";
import { Loader2 } from "lucide-react";

export default function AdminHistorial() {
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapEquipos, setMapEquipos] = useState({});
  const [mapLaptops, setMapLaptops] = useState({});
  const [mapExtensiones, setMapExtensiones] = useState({});
  const [mapAulas, setMapAulas] = useState({});
  const [mapUsuarios, setMapUsuarios] = useState({});

  useEffect(() => {
    document.title = "Historial | Admin";
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [eqsAll, lapsAll, extsAll, aulasData, profs, allRes] =
          await Promise.all([
            getEquipos({ onlyDisponibles: false }),
            getLaptops({ onlyDisponibles: false }),
            getExtensiones({ onlyDisponibles: false }),
            getAulas(),
            listProfesores(),
            listReservasAll({ futuras: false }),
          ]);

        const historicas = (allRes || []).filter((r) =>
          [
            ESTADOS_RESERVA.CANCELADA,
            ESTADOS_RESERVA.CANCELADA_USUARIO,
            ESTADOS_RESERVA.CANCELADA_ADMIN,
            ESTADOS_RESERVA.NO_SHOW,
            ESTADOS_RESERVA.COMPLETADA,
          ].includes(r.estado)
        );
        setReservas(historicas);

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

        // Construir mapa de usuarios desde ids presentes; fallback a lista de profesores
        const idsPresentes = Array.from(
          new Set((historicas || []).map((r) => r.id_usuario).filter(Boolean))
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
          err.message || "No se pudo cargar el historial",
          "error"
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="p-4 sm:p-6">
      <h2 className="font-bold text-xl mb-4">Historial de Reservas</h2>
      {loading ? (
        <div className="flex items-center justify-center p-4">
          <Loader2 className="mr-2 h-6 w-6 animate-spin" />
          <span>Cargando historial...</span>
        </div>
      ) : reservas.length === 0 ? (
        <p>No hay reservas canceladas o completadas.</p>
      ) : (
        <ReservationsTable
          data={reservas}
          equipmentMaps={{
            equipos: mapEquipos,
            laptops: mapLaptops,
            extensiones: mapExtensiones,
            aulas: mapAulas,
          }}
          showUsuario={true}
          usuariosMap={mapUsuarios}
          showCancelButton={false}
          showEditButton={false}
        />
      )}
    </div>
  );
}
