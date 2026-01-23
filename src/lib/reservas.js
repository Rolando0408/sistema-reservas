import { supabase } from "@/lib/supabaseClient";
import { parse } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
export const ESTADOS_RESERVA = {
  RESERVADO: 0,
  ACTIVA: 1,
  CANCELADA: 2,
  COMPLETADA: 3,
  CANCELADA_USUARIO: 4,
  CANCELADA_ADMIN: 5,
  NO_SHOW: 6,
  EXPIRADA: 7,
  PENDIENTE_RETIRO: 8,
  ENTREGADO: 9,
  PENDIENTE_ENTREGA: 10,
};

const ESTADOS_BLOQUEAN = [
  ESTADOS_RESERVA.RESERVADO,
  ESTADOS_RESERVA.ACTIVA,
  ESTADOS_RESERVA.PENDIENTE_RETIRO,
  ESTADOS_RESERVA.ENTREGADO,
  ESTADOS_RESERVA.PENDIENTE_ENTREGA,
];

const TIME_ZONE = "America/Caracas";
export const MAX_RESERVA_ANTICIPACION_DIAS = 10;
export const NO_SHOW_GRACE_MINUTES = 20; 
export const EARLY_DELIVERY_MINUTES = 10; 

export function nowISO() {
  return new Date().toISOString();
}


async function getUserId() {
  const { data } = await supabase.auth.getUser();
  const id = data?.user?.id;
  if (!id) throw new Error("No hay sesión de usuario");
  return id;
}


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

export async function listProfesores() {
  const { data, error } = await supabase
    .from("usuarios")
    .select("id, nombre_completo, email, id_rol_fk")
    .eq("id_rol_fk", 2)
    .order("nombre_completo", { ascending: true });
  if (error) throw error;
  return data || [];
}


export async function getUsuariosByIds(ids = []) {
  if (!Array.isArray(ids) || ids.length === 0) return [];
  const { data, error } = await supabase
    .from("usuarios")
    .select("id, nombre_completo, email")
    .in("id", ids);
  if (error) throw error;
  return data || [];
}


export async function getHorarioById(id) {
  const { data, error } = await supabase
    .from("horarios")
    .select("id, hora") 
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}


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
    .lt("fecha_hora_inicio", endISO_UTC)
    .gt("fecha_hora_fin", startISO_UTC)
    .in("estado", ESTADOS_BLOQUEAN);
  if (excludeReservaId != null) resQuery = resQuery.neq("id", excludeReservaId);
  const { data: reservasSolape, error: resErr } = await resQuery;
  if (resErr) throw resErr;
  const ocupadas = new Set((reservasSolape || []).map((r) => r.id_aula));

  return aulas.filter((a) => !ocupadas.has(a.id));
}

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

  const startUTC = getUTCDateTime(dateYYYYMMDD, horaInicio);
  const endUTC = getUTCDateTime(dateYYYYMMDD, horaFin);
  const startISO_UTC = startUTC.toISOString();
  const endISO_UTC = endUTC.toISOString();

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

  let resQuery = supabase
    .from("reservas")
    .select("id, id_equipo")
    .in("id_equipo", equipoIds)
    .lt("fecha_hora_inicio", endISO_UTC)
    .gt("fecha_hora_fin", startISO_UTC)
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
    .lt("fecha_hora_inicio", endISO_UTC)
    .gt("fecha_hora_fin", startISO_UTC)
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
    .lt("fecha_hora_inicio", endISO_UTC)
    .gt("fecha_hora_fin", startISO_UTC)
    .in("estado", ESTADOS_BLOQUEAN);
  if (excludeReservaId != null) rQuery = rQuery.neq("id", excludeReservaId);
  const { data: reservasSolape, error: rErr } = await rQuery;
  if (rErr) throw rErr;
  const ocupados = new Set((reservasSolape || []).map((r) => r.id_extension));
  return extensiones.filter((x) => !ocupados.has(x.id));
}

export async function listMisReservas({
  futuras = true,
  rangeStartISO,
  rangeEndISO,
} = {}) {
  const userId = await getUserId();
  let query = supabase
    .from("reservas")
    .select(
      "id, id_equipo, id_laptop, id_extension, id_decanato, id_aula, fecha_hora_inicio, fecha_hora_fin, estado"
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

  const startUTC = getUTCDateTime(dateYYYYMMDD, horaInicio);
  const endUTC = getUTCDateTime(dateYYYYMMDD, horaFin);
  const startISO_UTC = startUTC.toISOString();
  const endISO_UTC = endUTC.toISOString();

  const ors = [];
  if (id_equipo != null) ors.push(`and(id_equipo.eq.${id_equipo})`);
  if (id_laptop != null) ors.push(`and(id_laptop.eq.${id_laptop})`);
  if (id_extension != null) ors.push(`and(id_extension.eq.${id_extension})`);
  if (id_aula != null) ors.push(`and(id_aula.eq.${id_aula})`);

  if (!ors.length) return { conflicto: false };

  let query = supabase
    .from("reservas")
    .select("id, id_equipo, id_laptop, id_extension, id_aula")
    .lt("fecha_hora_inicio", endISO_UTC)
    .gt("fecha_hora_fin", startISO_UTC)
    .in("estado", ESTADOS_BLOQUEAN)
    .or(ors.join(","));
  if (excludeReservaId != null) query = query.neq("id", excludeReservaId);

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
  id_aula = null,
  estado = ESTADOS_RESERVA.RESERVADO,
}) {
  const userId = await getUserId();
  const [{ hora: horaInicio }, { hora: horaFin }] = await Promise.all([
    getHorarioById(startHorarioId),
    getHorarioById(endHorarioId),
  ]);

  const startUTC = getUTCDateTime(dateYYYYMMDD, horaInicio);
  const endUTC = getUTCDateTime(dateYYYYMMDD, horaFin);
  const startISO_UTC = startUTC.toISOString();
  const endISO_UTC = endUTC.toISOString();

  const now = new Date();
  const maxAdvanceMs = MAX_RESERVA_ANTICIPACION_DIAS * 24 * 60 * 60 * 1000;
  if (startUTC.getTime() - now.getTime() > maxAdvanceMs) {
    throw new Error(
      `No se permiten reservas con más de ${MAX_RESERVA_ANTICIPACION_DIAS} días de antelación`
    );
  }

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

  const now = new Date();
  const maxAdvanceMs = MAX_RESERVA_ANTICIPACION_DIAS * 24 * 60 * 60 * 1000;
  if (startUTC.getTime() - now.getTime() > maxAdvanceMs) {
    throw new Error(
      `No se permiten reservas con más de ${MAX_RESERVA_ANTICIPACION_DIAS} días de antelación`
    );
  }

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

export async function cancelReserva({ reservaId, by = "user" }) {
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
    throw new Error("No se puede cancelar una reserva pendiente");
  }

  const { error: upErr } = await supabase
    .from("reservas")
    .update({
      estado:
        by === "admin"
          ? ESTADOS_RESERVA.CANCELADA_ADMIN
          : ESTADOS_RESERVA.CANCELADA_USUARIO,
    })
    .eq("id", reservaId);
  if (upErr) throw upErr;
}

export async function syncEstadoReserva({ reservaId }) {
  const { data, error } = await supabase
    .from("reservas")
    .select("id, fecha_hora_inicio, fecha_hora_fin, estado")
    .eq("id", reservaId)
    .single();
  if (error) throw error;
  const { fecha_hora_inicio, fecha_hora_fin, estado } = data;
  const ahora = new Date();
  const inicio = new Date(fecha_hora_inicio);
  const fin = new Date(fecha_hora_fin);
  const inicioMasGracia = new Date(inicio.getTime() + NO_SHOW_GRACE_MINUTES * 60 * 1000);

  const terminales = [
    ESTADOS_RESERVA.CANCELADA,
    ESTADOS_RESERVA.CANCELADA_USUARIO,
    ESTADOS_RESERVA.CANCELADA_ADMIN,
    ESTADOS_RESERVA.NO_SHOW,
    ESTADOS_RESERVA.COMPLETADA,
    ESTADOS_RESERVA.EXPIRADA,
  ];
  if (terminales.includes(estado)) return estado;

  if (ahora >= inicio && ahora < inicioMasGracia && estado !== ESTADOS_RESERVA.ENTREGADO) {
    if (estado !== ESTADOS_RESERVA.PENDIENTE_RETIRO) {
      const { error: upErr } = await supabase
        .from("reservas")
        .update({ estado: ESTADOS_RESERVA.PENDIENTE_RETIRO })
        .eq("id", reservaId);
      if (upErr) throw upErr;
      return ESTADOS_RESERVA.PENDIENTE_RETIRO;
    }
    return estado;
  }

  if (ahora >= inicioMasGracia && estado !== ESTADOS_RESERVA.ENTREGADO) {
    const { error: upErr } = await supabase
      .from("reservas")
      .update({ estado: ESTADOS_RESERVA.NO_SHOW })
      .eq("id", reservaId);
    if (upErr) throw upErr;
    return ESTADOS_RESERVA.NO_SHOW;
  }

  if (ahora >= fin && estado === ESTADOS_RESERVA.ENTREGADO) {
    const { error: upErr } = await supabase
      .from("reservas")
      .update({ estado: ESTADOS_RESERVA.PENDIENTE_ENTREGA })
      .eq("id", reservaId);
    if (upErr) throw upErr;
    return ESTADOS_RESERVA.PENDIENTE_ENTREGA;
  }

  return estado;
}

export async function syncEstadosAutomaticos() {
  const nowIso = nowISO();
  const { data, error } = await supabase
    .from("reservas")
    .select("id, fecha_hora_inicio, fecha_hora_fin, estado");
  if (error) throw error;
  for (const r of data || []) {
    try {
      if (
        [
          ESTADOS_RESERVA.CANCELADA,
          ESTADOS_RESERVA.CANCELADA_USUARIO,
          ESTADOS_RESERVA.CANCELADA_ADMIN,
          ESTADOS_RESERVA.NO_SHOW,
          ESTADOS_RESERVA.COMPLETADA,
          ESTADOS_RESERVA.EXPIRADA,
        ].includes(r.estado)
      )
        continue;
      await syncEstadoReserva({ reservaId: r.id });
    } catch (e) {
      console.error("syncEstadosAutomaticos error", e);
    }
  }
}

export async function toggleEntregaReserva({ reservaId }) {
  const { data, error } = await supabase
    .from("reservas")
    .select("id, fecha_hora_inicio, fecha_hora_fin, estado")
    .eq("id", reservaId)
    .single();
  if (error) throw error;
  const { estado } = data;

  if (
    [
      ESTADOS_RESERVA.CANCELADA,
      ESTADOS_RESERVA.CANCELADA_USUARIO,
      ESTADOS_RESERVA.CANCELADA_ADMIN,
      ESTADOS_RESERVA.NO_SHOW,
      ESTADOS_RESERVA.COMPLETADA,
      ESTADOS_RESERVA.EXPIRADA,
    ].includes(estado)
  ) {
    throw new Error("La reserva no permite más cambios");
  }

  let next = null;
  if (estado === ESTADOS_RESERVA.RESERVADO) {
    next = ESTADOS_RESERVA.PENDIENTE_RETIRO;
  } else if (estado === ESTADOS_RESERVA.PENDIENTE_RETIRO || estado === ESTADOS_RESERVA.ACTIVA) {
    next = ESTADOS_RESERVA.ENTREGADO;
  } else if (
    estado === ESTADOS_RESERVA.ENTREGADO ||
    estado === ESTADOS_RESERVA.PENDIENTE_ENTREGA
  ) {
    next = ESTADOS_RESERVA.COMPLETADA;
  } else {
    const s = await syncEstadoReserva({ reservaId });
    return { newEstado: s };
  }

  const { error: upErr } = await supabase
    .from("reservas")
    .update({ estado: next })
    .eq("id", reservaId)
    .select("estado");
  if (upErr) throw upErr;
  return { newEstado: next };
}

export async function completeReserva({ reservaId }) {
  const { error } = await supabase
    .from("reservas")
    .update({ estado: ESTADOS_RESERVA.COMPLETADA })
    .eq("id", reservaId);
  if (error) throw error;
}

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
  const [{ hora: horaInicio }, { hora: horaFin }] = await Promise.all([
    getHorarioById(startHorarioId),
    getHorarioById(endHorarioId),
  ]);

  const startUTC = getUTCDateTime(dateYYYYMMDD, horaInicio);
  const endUTC = getUTCDateTime(dateYYYYMMDD, horaFin);
  const startISO_UTC = startUTC.toISOString();
  const endISO_UTC = endUTC.toISOString();

  const now = new Date();
  const maxAdvanceMs = MAX_RESERVA_ANTICIPACION_DIAS * 24 * 60 * 60 * 1000;
  if (startUTC.getTime() - now.getTime() > maxAdvanceMs) {
    throw new Error(
      `No se permiten reservas con más de ${MAX_RESERVA_ANTICIPACION_DIAS} días de antelación`
    );
  }

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
  const T_Z = "America/Caracas";

  const startOfDayLocal = parse(
    `${dateYYYYMMDD} 00:00:00`,
    "yyyy-MM-dd HH:mm:ss",
    new Date()
  );
  const startOfDayUTC = fromZonedTime(startOfDayLocal, T_Z).toISOString();

  const endOfDayLocal = parse(
    `${dateYYYYMMDD} 23:59:59`,
    "yyyy-MM-dd HH:mm:ss",
    new Date()
  );
  const endOfDayUTC = fromZonedTime(endOfDayLocal, T_Z).toISOString();

  const { data, error } = await supabase
    .from("reservas")
    .select("id, id_equipo, fecha_hora_inicio, fecha_hora_fin")
    .gte("fecha_hora_inicio", startOfDayUTC)
    .lte("fecha_hora_inicio", endOfDayUTC)
    .in("estado", ESTADOS_BLOQUEAN);

  if (error) {
    console.error("Error fetching reservations for day:", error);
    throw error;
  }
  return data || [];
}
