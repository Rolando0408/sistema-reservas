// src/pages/Disponibilidad.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  getHorarios,
  getEquipos,
  getReservationsForDay,
} from "../lib/reservas";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Loader2, ArrowLeft } from "lucide-react";
import { format, startOfDay, set, isAfter, isBefore } from "date-fns";
import { es } from "date-fns/locale";
import { toZonedTime } from "date-fns-tz"; // Para convertir UTC a Local
import { Link } from "react-router-dom";

const TIME_ZONE = "America/Caracas";

export default function Disponibilidad() {
  const [fecha, setFecha] = useState(startOfDay(new Date())); // Inicia con hoy
  const [loading, setLoading] = useState(true);
  const [equipos, setEquipos] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [reservasDelDia, setReservasDelDia] = useState([]);

  // Carga todos los datos necesarios
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const fechaFormateada = format(fecha, "yyyy-MM-dd");

        const [equiposData, horariosData, reservasData] = await Promise.all([
          getEquipos({ onlyDisponibles: true }), // Solo equipos activos
          getHorarios(),
          getReservationsForDay({ dateYYYYMMDD: fechaFormateada }),
        ]);

        setEquipos(equiposData || []);
        setHorarios(horariosData || []);
        setReservasDelDia(reservasData || []);
      } catch (error) {
        console.error("Error al cargar datos de disponibilidad:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [fecha]); // Se ejecuta cada vez que 'fecha' cambia

  // --- Lógica de Disponibilidad ---
  // Memoiza el mapa de disponibilidad para no recalcular en cada render
  const availabilityMap = useMemo(() => {
    const map = new Map(); // Key: "equipoID-horarioID", Value: true (ocupado)

    // Convierte las horas de reserva (UTC) a la zona local (Caracas)
    const localReservas = reservasDelDia.map((res) => ({
      id_equipo: res.id_equipo,
      start: toZonedTime(new Date(res.fecha_hora_inicio), TIME_ZONE),
      end: toZonedTime(new Date(res.fecha_hora_fin), TIME_ZONE),
    }));

    // Itera sobre cada equipo y cada horario para construir el mapa
    for (const equipo of equipos) {
      for (const [index, horario] of horarios.entries()) {
        const [hH, mM] = horario.hora.split(":");
        // Calcula el inicio de este bloque de horario
        const blockStart = set(fecha, {
          hours: parseInt(hH),
          minutes: parseInt(mM),
          seconds: 0,
          milliseconds: 0,
        });

        // Calcula el fin de este bloque (asume que es el inicio del siguiente bloque)
        let blockEnd;
        if (horarios[index + 1]) {
          const [nextHH, nextMM] = horarios[index + 1].hora.split(":");
          blockEnd = set(fecha, {
            hours: parseInt(nextHH),
            minutes: parseInt(nextMM),
            seconds: 0,
            milliseconds: 0,
          });
        } else {
          // Último bloque del día
          blockEnd = set(fecha, { hours: 23, minutes: 59, seconds: 59 });
        }

        // Comprueba si este bloque (blockStart - blockEnd) está ocupado
        let ocupado = false;
        for (const res of localReservas) {
          if (res.id_equipo === equipo.id) {
            // Lógica de solapamiento: (InicioA < FinB) y (FinA > InicioB)
            if (blockStart < res.end && blockEnd > res.start) {
              ocupado = true;
              break; // El bloque está ocupado, no sigas buscando
            }
          }
        }

        map.set(`${equipo.id}-${horario.id}`, ocupado);
      }
    }
    return map;
  }, [equipos, horarios, reservasDelDia, fecha]);
  // ---------------------------------

  return (
    <div className="disponibilidad-page space-y-4 px-4 py-4 sm:px-8 sm:py-6 md:px-20 md:py-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        {/* Boton de volver */}
        <div className="flex flex-row items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link to="/app/dashboard" title="Volver al Dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h2 className="text-xl font-bold tracking-tight">
            Disponibilidad General de Equipos
          </h2>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className="w-full sm:w-[280px] justify-start text-left font-normal"
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              {format(fecha, "PP", { locale: es })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={fecha}
              onSelect={setFecha}
              initialFocus
              disabled={{ before: startOfDay(new Date()) }} // Opcional: deshabilita días pasados
            />
          </PopoverContent>
        </Popover>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-10">
          <Loader2 className="mr-2 h-8 w-8 animate-spin text-primary" />
          <span>Cargando disponibilidad...</span>
        </div>
      ) : (
        <>
          {/* Vista móvil: tarjetas apiladas con chips desplazables */}
          <div className="block sm:hidden space-y-3">
            {equipos.length === 0 ? (
              <div className="rounded-md border p-4 text-center text-muted-foreground">
                No hay equipos disponibles.
              </div>
            ) : (
              equipos.map((equipo) => (
                <div key={equipo.id} className="rounded-md border p-4">
                  <div className="mb-2 font-semibold">
                    {equipo.nombre_equipo}
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {horarios.map((horario) => {
                      const isOccupied = availabilityMap.get(
                        `${equipo.id}-${horario.id}`
                      );
                      return (
                        <span
                          key={horario.id}
                          className={`px-2 py-1 rounded border text-xs whitespace-nowrap ${
                            isOccupied
                              ? "bg-red-100 text-red-700 border-red-300"
                              : "bg-green-100 text-green-700 border-green-300"
                          }`}
                          title={`${horario.descripcion} · ${
                            isOccupied ? "Ocupado" : "Libre"
                          }`}
                        >
                          {horario.descripcion}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Vista escritorio: tabla completa */}
          <div className="hidden sm:block rounded-md border overflow-x-auto">
            <Table className="min-w-max">
              {/* min-w-max para forzar scroll si no cabe */}
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-background font-semibold z-10 w-[150px]">
                    Equipo
                  </TableHead>
                  {/* Columnas de Horarios */}
                  {horarios.map((h) => (
                    <TableHead key={h.id} className="text-center min-w-[120px]">
                      {h.descripcion}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {equipos.map((equipo) => (
                  <TableRow key={equipo.id}>
                    {/* Fila de Equipo (pegajosa) */}
                    <TableCell className="sticky left-0 bg-background font-medium z-10 w-[150px]">
                      {equipo.nombre_equipo}
                    </TableCell>

                    {/* Celdas de Disponibilidad */}
                    {horarios.map((horario) => {
                      const isOccupied = availabilityMap.get(
                        `${equipo.id}-${horario.id}`
                      );
                      return (
                        <TableCell key={horario.id} className="text-center">
                          {isOccupied ? (
                            <Badge variant="destructive">Ocupado</Badge>
                          ) : (
                            <Badge variant="outline">Libre</Badge>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
