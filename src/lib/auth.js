import { supabase } from "./supabaseClient";

export async function getUserName() {
  try {
    const { data: sess } = await supabase.auth.getSession();
    const session = sess?.session;
    if (!session?.user?.id) return null;
    const userId = session.user.id;

    const { data, error } = await supabase
      .from("usuarios")
      .select("nombre_completo, email")
      .eq("id", userId)
      .single();

    if (!error && data) {
      return data.nombre_completo || data.email || session.user.email || null;
    }

    return session.user.user_metadata?.full_name || session.user.email || null;
  } catch (e) {
    console.error("getUserName error:", e);
    return null;
  }
}
