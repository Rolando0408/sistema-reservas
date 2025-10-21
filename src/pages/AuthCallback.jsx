import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";
import supabase from "../lib/supabaseClient";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  useEffect(() => {
    const completeSignIn = async () => {
      try {
        // Supabase envía un access_token o un code en la URL
        const code = params.get("code");
        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(
            code
          );
          if (error) throw error;
        } else {
          // En algunos casos ya habrá session adjunta sin code
          const { data: sess } = await supabase.auth.getSession();
          if (!sess?.session) {
            throw new Error("No se encontró una sesión tras la confirmación.");
          }
        }

        // Con sesión activa, obtenemos el usuario
        const { data: userData } = await supabase.auth.getUser();
        const user = userData?.user;
        if (!user?.id) throw new Error("No se pudo obtener el usuario.");

        // Recuperar nombre capturado durante signUp (user_metadata.full_name)
        const fullName = user.user_metadata?.full_name || "";

        // Crear/actualizar perfil en tabla usuarios
        const { error: upsertError } = await supabase.from("usuarios").upsert(
          {
            id: user.id,
            nombre_completo: fullName,
            email: user.email,
            id_rol_fk: 2,
          },
          { onConflict: "id", returning: "minimal" }
        );
        if (upsertError) throw upsertError;

        await Swal.fire({
          title: "¡Email confirmado!",
          text: "Tu cuenta ha sido activada. Ya puedes iniciar sesión.",
          icon: "success",
          confirmButtonText: "Continuar",
        });

        navigate("/");
      } catch (err) {
        await Swal.fire({
          title: "Error en confirmación",
          text:
            err?.error_description ||
            err?.message ||
            "No se pudo completar el inicio de sesión.",
          icon: "error",
          confirmButtonText: "Entendido",
        });
        navigate("/");
      }
    };

    completeSignIn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
