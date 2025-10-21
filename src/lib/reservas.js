import supabase from "./supabaseClient";

// Asunciones de estados (confírmame si difieren):
// 0 = pendiente, 1 = activa, 2 = cancelada, 3 = finalizada
export const ESTADOS_RESERVA = {
  PENDIENTE: 0,
  ACTIVA: 1,
  CANCELADA: 2,
  FINALIZADA: 3,
};

const ESTADOS_BLOQUEAN = [ESTADOS_RESERVA.PENDIENTE, ESTADOS_RESERVA.ACTIVA];

// Zona horaria oficial
const TZ = "America/Caracas";
// Offset actual de Caracas (UTC-04:00). Si necesitas exactitud histórica, podemos calcular dinámicamente.
const TZ_OFFSET = "-04:00";

// Convierte una fecha (YYYY-MM-DD) y un time (HH:MM:SS) a ISO con offset de Caracas
export function toCaracasISO(dateYYYYMMDD, timeHHMMSS) {
  return `${dateYYYYMMDD}T${timeHHMMSS}${TZ_OFFSET}`;
}

export function nowISO() {
  return new Date().toISOString();
}

// Util: obtener usuario actual
async function getUserId() {
  const { data } = await supabase.auth.getUser();
  const id = data?.user?.id;
  if (!id) throw new Error("No hay sesión de usuario");
  return id;
}

// Catálogos
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

export async function getHorarios() {
  const { data, error } = await supabase
    .from("horarios")
    .select("id, descripcion, hora")
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

// Helpers horarios
export async function getHorarioById(id) {
  const { data, error } = await supabase
    .from("horarios")
    .select("id, hora")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

// Disponibilidad de equipos para un rango: devuelve solo los equipos disponibles
export async function listEquiposDisponibles({
  dateYYYYMMDD,
  startHorarioId,
  endHorarioId,
  requireHdmi = false,
  requireVga = false,
}) {
  const [{ hora: horaInicio }, { hora: horaFin }] = await Promise.all([
    getHorarioById(startHorarioId),
    getHorarioById(endHorarioId),
  ]);

  const startISO = toCaracasISO(dateYYYYMMDD, horaInicio);
  const endISO = toCaracasISO(dateYYYYMMDD, horaFin);

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

  // Buscar reservas que se solapen: (inicio < end) AND (fin > start)
  const { data: reservasSolape, error: resErr } = await supabase
    .from("reservas")
    .select("id, id_equipo")
    .in("id_equipo", equipoIds)
    .lt("fecha_hora_inicio", endISO)
    .gt("fecha_hora_fin", startISO)
    .in("estado", ESTADOS_BLOQUEAN);
  if (resErr) throw resErr;
  const ocupados = new Set((reservasSolape || []).map((r) => r.id_equipo));

  return equipos.filter((e) => !ocupados.has(e.id));
}

export async function listLaptopsDisponibles({
  dateYYYYMMDD,
  startHorarioId,
  endHorarioId,
}) {
  const [{ hora: horaInicio }, { hora: horaFin }] = await Promise.all([
    getHorarioById(startHorarioId),
    getHorarioById(endHorarioId),
  ]);
  const startISO = toCaracasISO(dateYYYYMMDD, horaInicio);
  const endISO = toCaracasISO(dateYYYYMMDD, horaFin);

  const { data: laptops, error: lErr } = await supabase
    .from("laptops")
    .select("id, nombre_laptop, estado")
    .eq("estado", 1);
  if (lErr) throw lErr;
  if (!laptops?.length) return [];
  const ids = laptops.map((l) => l.id);

  const { data: reservasSolape, error: rErr } = await supabase
    .from("reservas")
    .select("id, id_laptop")
    .in("id_laptop", ids)
    .lt("fecha_hora_inicio", endISO)
    .gt("fecha_hora_fin", startISO)
    .in("estado", ESTADOS_BLOQUEAN);
  if (rErr) throw rErr;
  const ocupados = new Set((reservasSolape || []).map((r) => r.id_laptop));
  return laptops.filter((l) => !ocupados.has(l.id));
}

export async function listExtensionesDisponibles({
  dateYYYYMMDD,
  startHorarioId,
  endHorarioId,
}) {
  const [{ hora: horaInicio }, { hora: horaFin }] = await Promise.all([
    getHorarioById(startHorarioId),
    getHorarioById(endHorarioId),
  ]);
  const startISO = toCaracasISO(dateYYYYMMDD, horaInicio);
  const endISO = toCaracasISO(dateYYYYMMDD, horaFin);

  const { data: extensiones, error: eErr } = await supabase
    .from("extensiones")
    .select("id, nombre_extension, estado")
    .eq("estado", 1);
  if (eErr) throw eErr;
  if (!extensiones?.length) return [];
  const ids = extensiones.map((x) => x.id);

  const { data: reservasSolape, error: rErr } = await supabase
    .from("reservas")
    .select("id, id_extension")
    .in("id_extension", ids)
    .lt("fecha_hora_inicio", endISO)
    .gt("fecha_hora_fin", startISO)
    .in("estado", ESTADOS_BLOQUEAN);
  if (rErr) throw rErr;
  const ocupados = new Set((reservasSolape || []).map((r) => r.id_extension));
  return extensiones.filter((x) => !ocupados.has(x.id));
}

// Lista reservas del profesor (tabla y calendario)
export async function listMisReservas({
  futuras = true,
  rangeStartISO,
  rangeEndISO,
} = {}) {
  const userId = await getUserId();
  let query = supabase
    .from("reservas")
    .select(
      "id, id_equipo, id_laptop, id_extension, id_decanato, aula, fecha_hora_inicio, fecha_hora_fin, estado"
    )
    .eq("id_usuario", userId);

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
}) {
  const [{ hora: horaInicio }, { hora: horaFin }] = await Promise.all([
    getHorarioById(startHorarioId),
    getHorarioById(endHorarioId),
  ]);
  const startISO = toCaracasISO(dateYYYYMMDD, horaInicio);
  const endISO = toCaracasISO(dateYYYYMMDD, horaFin);

  // Construir OR dinámico por recurso
  const ors = [];
  if (id_equipo != null) ors.push(`and(id_equipo.eq.${id_equipo})`);
  if (id_laptop != null) ors.push(`and(id_laptop.eq.${id_laptop})`);
  if (id_extension != null) ors.push(`and(id_extension.eq.${id_extension})`);

  if (!ors.length) return { conflicto: false };

  let query = supabase
    .from("reservas")
    .select("id, id_equipo, id_laptop, id_extension")
    .lt("fecha_hora_inicio", endISO)
    .gt("fecha_hora_fin", startISO)
    .in("estado", ESTADOS_BLOQUEAN)
    .or(ors.join(","));

  const { data, error } = await query;
  if (error) throw error;
  const conflicto = (data || []).length > 0;
  return { conflicto, choques: data || [] };
}

export async function createReserva({
  dateYYYYMMDD,
  startHorarioId,
  endHorarioId,
  id_equipo,
  id_laptop = null,
  id_extension = null,
  id_decanato = null,
  aula = null,
  estado = ESTADOS_RESERVA.ACTIVA, // sin aprobación -> activa
}) {
  const userId = await getUserId();
  const [{ hora: horaInicio }, { hora: horaFin }] = await Promise.all([
    getHorarioById(startHorarioId),
    getHorarioById(endHorarioId),
  ]);
  const startISO = toCaracasISO(dateYYYYMMDD, horaInicio);
  const endISO = toCaracasISO(dateYYYYMMDD, horaFin);

  if (endISO <= startISO) {
    throw new Error("La hora de fin debe ser mayor a la de inicio");
  }

  // Verificar conflictos
  const { conflicto } = await checkConflictos({
    dateYYYYMMDD,
    startHorarioId,
    endHorarioId,
    id_equipo,
    id_laptop,
    id_extension,
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
        aula,
        fecha_hora_inicio: startISO,
        fecha_hora_fin: endISO,
        estado,
      },
    ],
    { returning: "minimal" }
  );
  if (error) throw error;
}

export async function cancelReserva({ reservaId }) {
  // Validar ventana de cancelación: antes de la hora de fin
  const { data, error } = await supabase
    .from("reservas")
    .select("fecha_hora_fin, estado")
    .eq("id", reservaId)
    .single();
  if (error) throw error;
  const fin = data?.fecha_hora_fin;
  if (!fin) throw new Error("Reserva no encontrada");
  const ahora = new Date();
  if (new Date(fin) <= ahora) {
    throw new Error("No se puede cancelar una reserva finalizada");
  }

  const { error: upErr } = await supabase
    .from("reservas")
    .update({ estado: ESTADOS_RESERVA.CANCELADA })
    .eq("id", reservaId);
  if (upErr) throw upErr;
}

// Para calendario del profesor
export async function listMisReservasEnRango({ rangeStartISO, rangeEndISO }) {
  const userId = await getUserId();
  let query = supabase
    .from("reservas")
    .select(
      "id, id_equipo, fecha_hora_inicio, fecha_hora_fin, estado, aula, id_decanato"
    )
    .eq("id_usuario", userId)
    .lt("fecha_hora_inicio", rangeEndISO)
    .gt("fecha_hora_fin", rangeStartISO)
    .order("fecha_hora_inicio", { ascending: true });
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}
