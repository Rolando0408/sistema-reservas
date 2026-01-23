import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import logo from "../assets/logo-3.png";
import {
  AiOutlineMail,
  AiOutlineLock,
  AiOutlineArrowRight,
  AiOutlineEye,
  AiOutlineEyeInvisible,
} from "react-icons/ai";
import Swal from "sweetalert2";
import { Loader2 } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) throw error;

      const userId = data?.user?.id;
      if (!userId) throw new Error("No se pudo obtener el usuario");

      const { data: perfil, error: perfilErr } = await supabase
        .from("usuarios")
        .select("id, id_rol_fk")
        .eq("id", userId)
        .single();
      if (perfilErr) throw perfilErr;

      await Swal.fire({
        title: "¡Bienvenido!",
        text: "Has iniciado sesión correctamente",
        icon: "success",
        showConfirmButton: false,
        timer: 1500,
      });

      if (perfil?.id_rol_fk === 2) {
        navigate("/app/dashboard");
      } else if (perfil?.id_rol_fk === 1) {
        navigate("/admin/dashboard");
      } else {
        navigate("/");
      }
    } catch (error) {
      await Swal.fire({
        title: "Error al iniciar sesión",
        text:
          error?.error_description ||
          error?.message ||
          "Ocurrió un error inesperado",
        icon: "error",
        confirmButtonText: "Entendido",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-screen bg-[#0D4D98] md:flex md:min-h-screen md:bg-white">
      <aside className="hidden md:flex md:w-[30%] bg-[#0D4D98] items-center justify-center">
        <img src={logo} alt="Logo" className="p-10 max-w-[85%] h-auto" />
      </aside>

      <main className="relative z-10 min-h-screen flex-1 flex flex-col items-center justify-center px-4">
        <img
          src={logo}
          alt="Logo"
          className="md:hidden mb-[4rem] w-40 h-auto drop-shadow"
        />
        <div className="w-[calc(100%-32px)] max-w-[380px] rounded-2xl p-6 text-center text-white backdrop-blur-md bg-white/15 border border-white/30 shadow-xl mx-auto md:static md:w-auto md:max-w-none md:text-black md:bg-transparent md:backdrop-blur-0 md:border-0 md:shadow-none md:p-12">
          <h1 className="font-bold text-white md:text-[#0D4D98] text-3xl md:text-[50px] leading-tight">
            UNIMAR PROYECTA
          </h1>
          <p className="mb-3 mt-0 text-white md:text-black">
            Bienvenido! Inicia sesión para continuar
          </p>

          <form
            onSubmit={handleLogin}
            className="flex flex-col items-start gap-5 w-full md:w-[300px] mx-auto"
          >
            <div className="w-full">
              <div className="relative flex items-center gap-2 w-full h-14">
                <AiOutlineMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="rounded-md pl-10 pr-10 w-full h-full bg-white text-black border border-gray-500 outline-none placeholder:text-gray-500"
                />
              </div>
            </div>

            <div className="w-full">
              <div className="relative flex items-center gap-2 w-full h-14">
                <AiOutlineLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10 pr-10 w-full h-full bg-white text-black border border-gray-500 rounded-md outline-none placeholder:text-gray-500"
                />
                {showPassword ? (
                  <AiOutlineEyeInvisible
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 cursor-pointer"
                    onClick={() => setShowPassword(false)}
                  />
                ) : (
                  <AiOutlineEye
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 cursor-pointer"
                    onClick={() => setShowPassword(true)}
                  />
                )}
              </div>
            </div>

            <button
              type="submit"
              className="bg-[#0D4D98] text-white rounded-md h-12 w-full flex items-center justify-between px-4 hover:bg-[#0b4282] disabled:opacity-50"
              disabled={loading}
            >
              <span className="flex items-center">
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" />
                    <span className="pl-1">Iniciando...</span>
                  </>
                ) : (
                  "Iniciar Sesión"
                )}
              </span>
              <AiOutlineArrowRight />
            </button>
          </form>

          <p className="mt-3 text-white md:text-black">
            ¿No estás registrado? {""}
            <Link
              to="/register"
              className="hover:text-purple-700 text-blue-300 md:text-blue-500 hover:underline underline-offset-4"
            >
              Regístrate aquí
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
