import React, { useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import logo from "../assets/logo-3.png";
import Swal from "sweetalert2";
import { Loader2 } from "lucide-react";

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const emailParam = params.get("email") || "";
  const [sending, setSending] = useState(false);

  const handleResend = async () => {
    if (!emailParam) {
      await Swal.fire({
        title: "Correo no disponible",
        text: "Vuelve al registro e intenta de nuevo.",
        icon: "warning",
        confirmButtonText: "Entendido",
      });
      return;
    }

    try {
      setSending(true);
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: emailParam,
      });
      if (error) throw error;
      await Swal.fire({
        title: "Correo reenviado",
        text: `Hemos reenviado el enlace de verificación a ${emailParam}.`,
        icon: "success",
        confirmButtonText: "Entendido",
      });
    } catch (err) {
      await Swal.fire({
        title: "No se pudo reenviar",
        text: err?.message || "Inténtalo de nuevo más tarde.",
        icon: "error",
        confirmButtonText: "Entendido",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="relative min-h-screen w-100% bg-[#0D4D98] md:flex md:min-h-screen md:bg-white">
      <aside className="hidden md:flex md:w-[30%] bg-[#0D4D98] items-center justify-center">
        <img src={logo} alt="Logo" className="p-10 max-w-[85%] h-auto" />
      </aside>

      <main className="relative z-10 min-h-screen flex-1 flex flex-col items-center justify-center">
        <img
          src={logo}
          alt="Logo"
          className="md:hidden mb-[4rem] w-40 h-auto drop-shadow"
        />

        <div className="w-[calc(100%-32px)] max-w-[420px] rounded-2xl p-6 text-center text-white backdrop-blur-md bg-white/15 border border-white/30 shadow-xl mx-auto md:static md:w-100% md:max-w-none md:text-black md:bg-transparent md:backdrop-blur-0 md:border-0 md:shadow-none md:p-12 md:m-0">
          <h1 className="font-bold text-white md:text-[#0D4D98] text-3xl md:text-[42px] leading-tight">
            Verifica tu correo
          </h1>
          <p className="mb-4 mt-2 text-white md:text-black">
            Te enviamos un enlace de confirmación{" "}
            {emailParam ? (
              <>
                al correo <b className="break-all">{emailParam}</b>.
              </>
            ) : (
              "a tu correo."
            )}{" "}
            Abre tu bandeja y confirma para poder iniciar sesión.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 justify-center">
            <button
              onClick={handleResend}
              disabled={sending}
              className="bg-[#0D4D98] text-white rounded-md h-12 px-5 flex items-center justify-center hover:bg-[#0b4282] disabled:opacity-50"
            >
              {sending ? (
                <>
                  <Loader2 className="animate-spin mr-2" /> Reenviando...
                </>
              ) : (
                "Reenviar correo"
              )}
            </button>
            <Link
              to="/"
              className="text-sm text-blue-300 md:text-blue-600 hover:underline text-center"
            >
              Ya confirmé, ir a iniciar sesión
            </Link>
          </div>

          <div className="mt-6 text-xs text-white/80 md:text-black/70">
            ¿No llegó? Revisa tu carpeta de spam o espera un par de minutos.
          </div>
        </div>
      </main>
    </div>
  );
}
