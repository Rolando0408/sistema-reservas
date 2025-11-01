// src/lib/reservas.js
import { supabase } from "@/lib/supabaseClient";
import { parse } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
// Estados de reserva (persistidos en DB)
// 0 = RESERVADO (creada, aún no inicia)
// 1 = ACTIVA (en curso)
// 2 = CANCELADA
// 3 = COMPLETADA (entregada por admin)
export const ESTADOS_RESERVA = {
  RESERVADO: 0,
  ACTIVA: 1,
  CANCELADA: 2,
  COMPLETADA: 3,
};

// Estados que bloquean recursos mientras el rango horario se solapa
const ESTADOS_BLOQUEAN = [ESTADOS_RESERVA.RESERVADO, ESTADOS_RESERVA.ACTIVA];

// Zona horaria de Venezuela para las conversiones
const TIME_ZONE = "America/Caracas";

// No necesitamos toCaracasISO ni TZ_OFFSET
// export function toCaracasISO(dateYYYYMMDD, timeHHMMSS) { ... }

export function nowISO() {
  return new Date().toISOString(); // Siempre devuelve UTC
}

// Util: obtener usuario actual
async function getUserId() {
  const { data } = await supabase.auth.getUser();
  const id = data?.user?.id;
  if (!id) throw new Error("No hay sesión de usuario");
  return id;
}

// Catálogos (Sin cambios aquí)
export async function getEquipos({ onlyDisponibles = true } = {}) {
  let query = supabase
    .from("equipos")
    .select("id, nombre_equipo, estado, hdmi, vga")
    .order("nombre_equipo", { ascending: true });
  if (onlyDisponibles) query = query.eq("estado", 1);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getLaptops({ onlyDisponibles = true } = {}) {
  let query = supabase
    .from("laptops")
    .select("id, nombre_laptop, estado")
    .order("nombre_laptop", { ascending: true });
  if (onlyDisponibles) query = query.eq("estado", 1);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function getExtensiones({ onlyDisponibles = true } = {}) {
  let query = supabase
    .from("extensiones")
    .select("id, nombre_extension, estado")
    .order("nombre_extension", { ascending: true });
  if (onlyDisponibles) query = query.eq("estado", 1);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// ---- Inventario (CRUD básico) ----
// Equipos (Proyectores)
export async function createEquipo({
  nombre_equipo,
  hdmi = 0,
  vga = 0,
  estado = 1,
}) {
  if (!nombre_equipo || !nombre_equipo.trim())
    throw new Error("Nombre requerido");
  const { error } = await supabase.from("equipos").insert(
    [
      {
        nombre_equipo: nombre_equipo.trim(),
        hdmi: hdmi ? 1 : 0,
        vga: vga ? 1 : 0,
        estado: estado ? 1 : 0,
      },
    ],
    { returning: "minimal" }
  );
  if (error) throw error;
}

export async function updateEquipo({ id, nombre_equipo, hdmi, vga, estado }) {
  if (!id) throw new Error("ID requerido");
  const payload = {};
  if (nombre_equipo != null)
    payload.nombre_equipo = String(nombre_equipo).trim();
  if (hdmi != null) payload.hdmi = hdmi ? 1 : 0;
  if (vga != null) payload.vga = vga ? 1 : 0;
  if (estado != null) payload.estado = estado ? 1 : 0;
  const { data, error } = await supabase
    .from("equipos")
    .update(payload)
    .eq("id", id)
    .select("id, estado");
  if (error) throw error;
  if (!data || data.length === 0)
    throw new Error("No se pudo actualizar el equipo");
}

export async function deleteEquipo({ id }) {
  if (!id) throw new Error("ID requerido");
  const { error } = await supabase.from("equipos").delete().eq("id", id);
  if (error) throw error;
}

// Laptops
export async function createLaptop({ nombre_laptop, estado = 1 }) {
  if (!nombre_laptop || !nombre_laptop.trim())
    throw new Error("Nombre requerido");
  const { error } = await supabase
    .from("laptops")
    .insert([{ nombre_laptop: nombre_laptop.trim(), estado: estado ? 1 : 0 }], {
      returning: "minimal",
    });
  if (error) throw error;
}

export async function updateLaptop({ id, nombre_laptop, estado }) {
  if (!id) throw new Error("ID requerido");
  const payload = {};
  if (nombre_laptop != null)
    payload.nombre_laptop = String(nombre_laptop).trim();
  if (estado != null) payload.estado = estado ? 1 : 0;
  const { data, error } = await supabase
    .from("laptops")
    .update(payload)
    .eq("id", id)
    .select("id, estado");
  if (error) throw error;
  if (!data || data.length === 0)
    throw new Error("No se pudo actualizar la laptop");
}

export async function deleteLaptop({ id }) {
  if (!id) throw new Error("ID requerido");
  const { error } = await supabase.from("laptops").delete().eq("id", id);
  if (error) throw error;
}

// Extensiones
export async function createExtension({ nombre_extension, estado = 1 }) {
  if (!nombre_extension || !nombre_extension.trim())
    throw new Error("Nombre requerido");
  const { error } = await supabase
    .from("extensiones")
    .insert(
      [{ nombre_extension: nombre_extension.trim(), estado: estado ? 1 : 0 }],
      { returning: "minimal" }
    );
  if (error) throw error;
}

export async function updateExtension({ id, nombre_extension, estado }) {
  if (!id) throw new Error("ID requerido");
  const payload = {};
  if (nombre_extension != null)
    payload.nombre_extension = String(nombre_extension).trim();
  if (estado != null) payload.estado = estado ? 1 : 0;
  const { data, error } = await supabase
    .from("extensiones")
    .update(payload)
    .eq("id", id)
    .select("id, estado");
  if (error) throw error;
  if (!data || data.length === 0)
    throw new Error("No se pudo actualizar la extensión");
}

export async function deleteExtension({ id }) {
  if (!id) throw new Error("ID requerido");
  const { error } = await supabase.from("extensiones").delete().eq("id", id);
  if (error) throw error;
}

export async function getHorarios() {
  const { data, error } = await supabase
    .from("horarios")
    .select("id, descripcion, hora") // Asume que 'hora' es HH:mm:ss
    .order("hora", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getDecanatos() {
  const { data, error } = await supabase
    .from("decanatos")
    .select("id, nombre_decanato")
    .order("nombre_decanato", { ascending: true });
  if (error) throw error;
  return data || [];
}

// Lista de profesores (usuarios con rol 2)
export async function listProfesores() {
  const { data, error } = await supabase
    .from("usuarios")
    .select("id, nombre_completo, email, id_rol_fk")
    .eq("id_rol_fk", 2)
    .order("nombre_completo", { ascending: true });
  if (error) throw error;
  return data || [];
}

// Obtiene usuarios por IDs específicos (para mapear nombres en tablas)
export async function getUsuariosByIds(ids = []) {
  if (!Array.isArray(ids) || ids.length === 0) return [];
  const { data, error } = await supabase
    .from("usuarios")
    .select("id, nombre_completo, email")
    .in("id", ids);
  if (error) throw error;
  return data || [];
}

// Helpers horarios (Sin cambios)
export async function getHorarioById(id) {
  const { data, error } = await supabase
    .from("horarios")
    .select("id, hora") // Necesitamos la hora (HH:mm:ss)
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

// --- FUNCIONES MODIFICADAS PARA USAR UTC ---

// Convierte YYYY-MM-DD y HH:MM:SS a objeto Date UTC
function getUTCDateTime(dateYYYYMMDD, timeHHMMSS) {
  const localDateTime = parse(
    `${dateYYYYMMDD} ${timeHHMMSS}`,
    "yyyy-MM-dd HH:mm:ss",
    new Date()
  );
  return fromZonedTime(localDateTime, TIME_ZONE);
}

export async function getAulas() {
  const { data, error } = await supabase
    .from("aulas")
    .select("id, nombre_aula")
    .order("nombre_aula", { ascending: true });
  if (error) throw error;
  return data || [];
}

// Disponibilidad de aulas para un rango: devuelve solo las aulas disponibles
export async function listAulasDisponibles({
  dateYYYYMMDD,
  startHorarioId,
  endHorarioId,
  excludeReservaId = null,
}) {
  const [{ hora: horaInicio }, { hora: horaFin }] = await Promise.all([
    getHorarioById(startHorarioId),
    getHorarioById(endHorarioId),
  ]);

  // Convierte a UTC y obtiene ISO string
  const startUTC = getUTCDateTime(dateYYYYMMDD, horaInicio);
  const endUTC = getUTCDateTime(dateYYYYMMDD, horaFin);
  const startISO_UTC = startUTC.toISOString();
  const endISO_UTC = endUTC.toISOString();

  const aulas = await getAulas();
  if (!aulas?.length) return [];
  const aulaIds = aulas.map((a) => a.id);

  let resQuery = supabase
    .from("reservas")
    .select("id, id_aula")
    .in("id_aula", aulaIds)
    .lt("fecha_hora_inicio", endISO_UTC) // Compara con UTC
    .gt("fecha_hora_fin", startISO_UTC) // Compara con UTC
    .in("estado", ESTADOS_BLOQUEAN);
  if (excludeReservaId != null) resQuery = resQuery.neq("id", excludeReservaId);
  const { data: reservasSolape, error: resErr } = await resQuery;
  if (resErr) throw resErr;
  const ocupadas = new Set((reservasSolape || []).map((r) => r.id_aula));

  return aulas.filter((a) => !ocupadas.has(a.id));
}

// Disponibilidad de equipos para un rango: devuelve solo los equipos disponibles
export async function listEquiposDisponibles({
  dateYYYYMMDD,
  startHorarioId,
  endHorarioId,
  requireHdmi = false,
  requireVga = false,
  excludeReservaId = null,
}) {
  const [{ hora: horaInicio }, { hora: horaFin }] = await Promise.all([
    getHorarioById(startHorarioId),
    getHorarioById(endHorarioId),
  ]);

  // Convierte a UTC y obtiene ISO string
  const startUTC = getUTCDateTime(dateYYYYMMDD, horaInicio);
  const endUTC = getUTCDateTime(dateYYYYMMDD, horaFin);
  const startISO_UTC = startUTC.toISOString();
  const endISO_UTC = endUTC.toISOString();

  // Equipos activos/operativos
  let eqQuery = supabase
    .from("equipos")
    .select("id, nombre_equipo, estado, hdmi, vga")
    .eq("estado", 1);
  if (requireHdmi) eqQuery = eqQuery.eq("hdmi", 1);
  if (requireVga) eqQuery = eqQuery.eq("vga", 1);
  const { data: equipos, error: eqErr } = await eqQuery;
  if (eqErr) throw eqErr;
  if (!equipos?.length) return [];

  const equipoIds = equipos.map((e) => e.id);

  // Buscar reservas que se solapen usando UTC ISO strings
  let resQuery = supabase
    .from("reservas")
    .select("id, id_equipo")
    .in("id_equipo", equipoIds)
    .lt("fecha_hora_inicio", endISO_UTC) // Compara con UTC
    .gt("fecha_hora_fin", startISO_UTC) // Compara con UTC
    .in("estado", ESTADOS_BLOQUEAN);
  if (excludeReservaId != null) resQuery = resQuery.neq("id", excludeReservaId);
  const { data: reservasSolape, error: resErr } = await resQuery;
  if (resErr) throw resErr;
  const ocupados = new Set((reservasSolape || []).map((r) => r.id_equipo));

  return equipos.filter((e) => !ocupados.has(e.id));
}

export async function listLaptopsDisponibles({
  dateYYYYMMDD,
  startHorarioId,
  endHorarioId,
  excludeReservaId = null,
}) {
  const [{ hora: horaInicio }, { hora: horaFin }] = await Promise.all([
    getHorarioById(startHorarioId),
    getHorarioById(endHorarioId),
  ]);

  // Convierte a UTC y obtiene ISO string
  const startUTC = getUTCDateTime(dateYYYYMMDD, horaInicio);
  const endUTC = getUTCDateTime(dateYYYYMMDD, horaFin);
  const startISO_UTC = startUTC.toISOString();
  const endISO_UTC = endUTC.toISOString();

  const { data: laptops, error: lErr } = await supabase
    .from("laptops")
    .select("id, nombre_laptop, estado")
    .eq("estado", 1);
  if (lErr) throw lErr;
  if (!laptops?.length) return [];
  const ids = laptops.map((l) => l.id);

  let rQuery = supabase
    .from("reservas")
    .select("id, id_laptop")
    .in("id_laptop", ids)
    .lt("fecha_hora_inicio", endISO_UTC) // Compara con UTC
    .gt("fecha_hora_fin", startISO_UTC) // Compara con UTC
    .in("estado", ESTADOS_BLOQUEAN);
  if (excludeReservaId != null) rQuery = rQuery.neq("id", excludeReservaId);
  const { data: reservasSolape, error: rErr } = await rQuery;
  if (rErr) throw rErr;
  const ocupados = new Set((reservasSolape || []).map((r) => r.id_laptop));
  return laptops.filter((l) => !ocupados.has(l.id));
}

export async function listExtensionesDisponibles({
  dateYYYYMMDD,
  startHorarioId,
  endHorarioId,
  excludeReservaId = null,
}) {
  const [{ hora: horaInicio }, { hora: horaFin }] = await Promise.all([
    getHorarioById(startHorarioId),
    getHorarioById(endHorarioId),
  ]);

  // Convierte a UTC y obtiene ISO string
  const startUTC = getUTCDateTime(dateYYYYMMDD, horaInicio);
  const endUTC = getUTCDateTime(dateYYYYMMDD, horaFin);
  const startISO_UTC = startUTC.toISOString();
  const endISO_UTC = endUTC.toISOString();

  const { data: extensiones, error: eErr } = await supabase
    .from("extensiones")
    .select("id, nombre_extension, estado")
    .eq("estado", 1);
  if (eErr) throw eErr;
  if (!extensiones?.length) return [];
  const ids = extensiones.map((x) => x.id);

  let rQuery = supabase
    .from("reservas")
    .select("id, id_extension")
    .in("id_extension", ids)
    .lt("fecha_hora_inicio", endISO_UTC) // Compara con UTC
    .gt("fecha_hora_fin", startISO_UTC) // Compara con UTC
    .in("estado", ESTADOS_BLOQUEAN);
  if (excludeReservaId != null) rQuery = rQuery.neq("id", excludeReservaId);
  const { data: reservasSolape, error: rErr } = await rQuery;
  if (rErr) throw rErr;
  const ocupados = new Set((reservasSolape || []).map((r) => r.id_extension));
  return extensiones.filter((x) => !ocupados.has(x.id));
}

// Lista reservas del profesor (tabla y calendario)
// Esta función NO cambia, ya que compara fechas ISO directamente
export async function listMisReservas({
  futuras = true,
  rangeStartISO, // Espera UTC ISO
  rangeEndISO, // Espera UTC ISO
} = {}) {
  const userId = await getUserId();
  let query = supabase
    .from("reservas")
    .select(
      "id, id_equipo, id_laptop, id_extension, id_decanato, id_aula, fecha_hora_inicio, fecha_hora_fin, estado"
    )
    .eq("id_usuario", userId);

  if (futuras) {
    query = query.gte("fecha_hora_fin", nowISO()); // nowISO() ya es UTC
  }
  // Estas comparaciones funcionan bien con UTC ISO strings
  if (rangeStartISO) query = query.lt("fecha_hora_inicio", rangeEndISO);
  if (rangeEndISO) query = query.gt("fecha_hora_fin", rangeStartISO);

  query = query.order("fecha_hora_inicio", { ascending: true });

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// Lista todas las reservas (admin)
export async function listReservasAll({
  futuras = false,
  rangeStartISO,
  rangeEndISO,
} = {}) {
  let query = supabase
    .from("reservas")
    .select(
      "id, id_usuario, id_equipo, id_laptop, id_extension, id_decanato, id_aula, fecha_hora_inicio, fecha_hora_fin, estado"
    );

  if (futuras) {
    query = query.gte("fecha_hora_fin", nowISO());
  }
  if (rangeStartISO) query = query.lt("fecha_hora_inicio", rangeEndISO);
  if (rangeEndISO) query = query.gt("fecha_hora_fin", rangeStartISO);

  query = query.order("fecha_hora_inicio", { ascending: true });
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// Valida solapes para un conjunto de recursos concretos
export async function checkConflictos({
  dateYYYYMMDD,
  startHorarioId,
  endHorarioId,
  id_equipo,
  id_laptop,
  id_extension,
  id_aula,
  excludeReservaId = null,
}) {
  const [{ hora: horaInicio }, { hora: horaFin }] = await Promise.all([
    getHorarioById(startHorarioId),
    getHorarioById(endHorarioId),
  ]);

  // Convierte a UTC y obtiene ISO string
  const startUTC = getUTCDateTime(dateYYYYMMDD, horaInicio);
  const endUTC = getUTCDateTime(dateYYYYMMDD, horaFin);
  const startISO_UTC = startUTC.toISOString();
  const endISO_UTC = endUTC.toISOString();

  // Construir OR dinámico por recurso
  const ors = [];
  if (id_equipo != null) ors.push(`and(id_equipo.eq.${id_equipo})`);
  if (id_laptop != null) ors.push(`and(id_laptop.eq.${id_laptop})`);
  if (id_extension != null) ors.push(`and(id_extension.eq.${id_extension})`);
  if (id_aula != null) ors.push(`and(id_aula.eq.${id_aula})`);

  if (!ors.length) return { conflicto: false };

  let query = supabase
    .from("reservas")
    .select("id, id_equipo, id_laptop, id_extension, id_aula")
    .lt("fecha_hora_inicio", endISO_UTC) // Compara con UTC
    .gt("fecha_hora_fin", startISO_UTC) // Compara con UTC
    .in("estado", ESTADOS_BLOQUEAN)
    .or(ors.join(","));
  if (excludeReservaId != null) query = query.neq("id", excludeReservaId);

  const { data, error } = await query;
  if (error) throw error;
  const conflicto = (data || []).length > 0;
  return { conflicto, choques: data || [] };
}

// Crea la reserva usando UTC
export async function createReserva({
  dateYYYYMMDD,
  startHorarioId,
  endHorarioId,
  id_equipo,
  id_laptop = null,
  id_extension = null,
  id_decanato = null,
  id_aula = null,
  estado = ESTADOS_RESERVA.RESERVADO, // al crear -> Reservado
}) {
  const userId = await getUserId();
  const [{ hora: horaInicio }, { hora: horaFin }] = await Promise.all([
    getHorarioById(startHorarioId),
    getHorarioById(endHorarioId),
  ]);

  // Convierte a UTC y obtiene ISO string
  const startUTC = getUTCDateTime(dateYYYYMMDD, horaInicio);
  const endUTC = getUTCDateTime(dateYYYYMMDD, horaFin);
  const startISO_UTC = startUTC.toISOString();
  const endISO_UTC = endUTC.toISOString();

  if (endUTC <= startUTC) {
    // Compara en UTC
    throw new Error("La hora de fin debe ser mayor a la de inicio");
  }

  // Verificar conflictos (checkConflictos ya usa UTC internamente)
  const { conflicto } = await checkConflictos({
    dateYYYYMMDD,
    startHorarioId,
    endHorarioId,
    id_equipo,
    id_laptop,
    id_extension,
    id_aula,
  });
  if (conflicto) {
    throw new Error("Conflicto de horario con algún recurso seleccionado");
  }

  // INSERTA USANDO UTC ISO String
  const { error } = await supabase.from("reservas").insert(
    [
      {
        id_usuario: userId,
        id_equipo,
        id_laptop,
        id_extension,
        id_decanato,
        id_aula,
        fecha_hora_inicio: startISO_UTC, // <-- UTC
        fecha_hora_fin: endISO_UTC, // <-- UTC
        estado,
      },
    ],
    { returning: "minimal" }
  );
  if (error) throw error;
}

// Crea reserva para un usuario específico (admin)
export async function createReservaForUser({
  userId,
  dateYYYYMMDD,
  startHorarioId,
  endHorarioId,
  id_equipo,
  id_laptop = null,
  id_extension = null,
  id_decanato = null,
  id_aula = null,
  estado = ESTADOS_RESERVA.RESERVADO,
}) {
  const [{ hora: horaInicio }, { hora: horaFin }] = await Promise.all([
    getHorarioById(startHorarioId),
    getHorarioById(endHorarioId),
  ]);

  const startUTC = getUTCDateTime(dateYYYYMMDD, horaInicio);
  const endUTC = getUTCDateTime(dateYYYYMMDD, horaFin);
  const startISO_UTC = startUTC.toISOString();
  const endISO_UTC = endUTC.toISOString();

  if (endUTC <= startUTC) {
    throw new Error("La hora de fin debe ser mayor a la de inicio");
  }

  const { conflicto } = await checkConflictos({
    dateYYYYMMDD,
    startHorarioId,
    endHorarioId,
    id_equipo,
    id_laptop,
    id_extension,
    id_aula,
  });
  if (conflicto) {
    throw new Error("Conflicto de horario con algún recurso seleccionado");
  }

  const { error } = await supabase.from("reservas").insert(
    [
      {
        id_usuario: userId,
        id_equipo,
        id_laptop,
        id_extension,
        id_decanato,
        id_aula,
        fecha_hora_inicio: startISO_UTC,
        fecha_hora_fin: endISO_UTC,
        estado,
      },
    ],
    { returning: "minimal" }
  );
  if (error) throw error;
}

// Cancelar reserva (Sin cambios, ya que compara fechas ISO)
export async function cancelReserva({ reservaId }) {
  const { data, error } = await supabase
    .from("reservas")
    .select("fecha_hora_fin, estado")
    .eq("id", reservaId)
    .single();
  if (error) throw error;
  const fin = data?.fecha_hora_fin;
  if (!fin) throw new Error("Reserva no encontrada");
  const ahora = new Date(); // Hora actual UTC
  if (new Date(fin) <= ahora) {
    // Compara UTC con UTC
    throw new Error("No se puede cancelar una reserva pendiente");
  }

  const { error: upErr } = await supabase
    .from("reservas")
    .update({ estado: ESTADOS_RESERVA.CANCELADA })
    .eq("id", reservaId);
  if (upErr) throw upErr;
}

// Marcar una reserva como completada (solo admins deberían usarlo en UI)
export async function completeReserva({ reservaId }) {
  const { error } = await supabase
    .from("reservas")
    .update({ estado: ESTADOS_RESERVA.COMPLETADA })
    .eq("id", reservaId);
  if (error) throw error;
}

// Para calendario del profesor (Sin cambios, ya que compara fechas ISO)
export async function listMisReservasEnRango({ rangeStartISO, rangeEndISO }) {
  const userId = await getUserId();
  let query = supabase
    .from("reservas")
    .select(
      "id, id_equipo, fecha_hora_inicio, fecha_hora_fin, estado, aula, id_decanato"
    )
    .eq("id_usuario", userId)
    .lt("fecha_hora_inicio", rangeEndISO) // Compara UTC ISO
    .gt("fecha_hora_fin", rangeStartISO) // Compara UTC ISO
    .order("fecha_hora_inicio", { ascending: true });
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// Actualiza una reserva existente usando UTC, excluyendo la propia de los conflictos
export async function updateReserva({
  reservaId,
  dateYYYYMMDD,
  startHorarioId,
  endHorarioId,
  id_equipo,
  id_laptop = null,
  id_extension = null,
  id_decanato = null,
  id_aula = null,
}) {
  // Obtener horas del catálogo
  const [{ hora: horaInicio }, { hora: horaFin }] = await Promise.all([
    getHorarioById(startHorarioId),
    getHorarioById(endHorarioId),
  ]);

  const startUTC = getUTCDateTime(dateYYYYMMDD, horaInicio);
  const endUTC = getUTCDateTime(dateYYYYMMDD, horaFin);
  const startISO_UTC = startUTC.toISOString();
  const endISO_UTC = endUTC.toISOString();

  if (endUTC <= startUTC) {
    throw new Error("La hora de fin debe ser mayor a la de inicio");
  }

  // Verificar conflictos excluyendo la propia reserva
  const { conflicto } = await checkConflictos({
    dateYYYYMMDD,
    startHorarioId,
    endHorarioId,
    id_equipo,
    id_laptop,
    id_extension,
    id_aula,
    excludeReservaId: reservaId,
  });
  if (conflicto) {
    throw new Error("Conflicto de horario con algún recurso seleccionado");
  }

  const { error } = await supabase
    .from("reservas")
    .update({
      id_equipo,
      id_laptop,
      id_extension,
      id_decanato,
      id_aula,
      fecha_hora_inicio: startISO_UTC,
      fecha_hora_fin: endISO_UTC,
    })
    .eq("id", reservaId);
  if (error) throw error;
}

export async function getReservationsForDay({ dateYYYYMMDD }) {
  const T_Z = "America/Caracas"; // Reutiliza tu constante TIME_ZONE

  // Calcula el inicio del día en UTC (Caracas)
  const startOfDayLocal = parse(
    `${dateYYYYMMDD} 00:00:00`,
    "yyyy-MM-dd HH:mm:ss",
    new Date()
  );
  const startOfDayUTC = fromZonedTime(startOfDayLocal, T_Z).toISOString();

  // Calcula el fin del día en UTC (Caracas)
  const endOfDayLocal = parse(
    `${dateYYYYMMDD} 23:59:59`,
    "yyyy-MM-dd HH:mm:ss",
    new Date()
  );
  const endOfDayUTC = fromZonedTime(endOfDayLocal, T_Z).toISOString();

  const { data, error } = await supabase
    .from("reservas")
    .select("id, id_equipo, fecha_hora_inicio, fecha_hora_fin") // Trae las fechas UTC
    .gte("fecha_hora_inicio", startOfDayUTC) // Que empiecen después del inicio del día
    .lte("fecha_hora_inicio", endOfDayUTC) // Y que empiecen antes del fin del día
    .in("estado", ESTADOS_BLOQUEAN); // Solo activas o pendientes

  if (error) {
    console.error("Error fetching reservations for day:", error);
    throw error;
  }
  return data || [];
}
