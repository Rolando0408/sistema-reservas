import React, { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import logo from "../assets/logo-3.png";
import {
  AiOutlineUser,
  AiOutlineMail,
  AiOutlineLock,
  AiOutlineArrowRight,
  AiOutlineEye,
  AiOutlineEyeInvisible,
} from "react-icons/ai";
import Swal from "sweetalert2";
import { Loader2 } from "lucide-react";

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      await Swal.fire({
        title: "Contraseñas no coinciden",
        text: "Verifica que ambas contraseñas sean iguales.",
        icon: "warning",
        confirmButtonText: "Entendido",
      });
      return;
    }

    try {
      setLoading(true);
      // --- PASO 1: SOLO signUp CON METADATA ---
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            full_name: fullName, // El trigger leerá esto
          },
        },
      });

      if (error) throw error;

      // --- PASO 2: MOSTRAR MENSAJE DE VERIFICACIÓN ---
      await Swal.fire({
        title: "Verifica tu correo",
        text: "Te hemos enviado un enlace de confirmación. Abre tu correo y confirma tu cuenta para poder iniciar sesión.",
        icon: "info",
        confirmButtonText: "Entendido",
      });

      window.location.href = "/"; // Redirige al login
    } catch (error) {
      const msg = (error?.message || "").toLowerCase();
      if (
        msg.includes("already") ||
        msg.includes("registered") ||
        msg.includes("exists")
      ) {
        await Swal.fire({
          title: "Este email ya está registrado",
          text: "Intenta iniciar sesión.",
          icon: "warning",
          confirmButtonText: "Entendido",
        });
      } else {
        await Swal.fire({
          title: "Error al registrarse",
          text: error?.message || "Ocurrió un error inesperado",
          icon: "error",
          confirmButtonText: "Entendido",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-100% bg-[#0D4D98] md:flex md:min-h-screen md:bg-white">
      {/* Sidebar en pantallas md+ */}
      <aside className="hidden md:flex md:w-[30%] bg-[#0D4D98] items-center justify-center">
        <img src={logo} alt="Logo" className="p-10 max-w-[85%] h-auto" />
      </aside>

      {/* Contenido principal */}
      <main className="relative z-10 min-h-screen flex-1 flex flex-col items-center justify-center">
        {/* Logo arriba de la tarjeta en móvil */}
        <img
          src={logo}
          alt="Logo"
          className="md:hidden mb-[4rem] w-40 h-auto drop-shadow"
        />

        {/* Tarjeta */}
        <div className="w-[calc(100%-32px)] max-w-[380px] rounded-2xl p-6 text-center text-white backdrop-blur-md bg-white/15 border border-white/30 shadow-xl mx-auto md:static md:w-100% md:max-w-none md:text-black md:bg-transparent md:backdrop-blur-0 md:border-0 md:shadow-none md:p-12 md:m-0">
          <h1 className="font-bold text-white md:text-[#0D4D98] text-3xl md:text-[50px] leading-tight">
            UNIMAR PROYECTA
          </h1>
          <p className="mb-3 mt-0 text-white md:text-black">
            ¡Crea tu cuenta para continuar!
          </p>

          <form
            onSubmit={handleRegister}
            className="flex flex-col items-start gap-5 w-full md:w-[300px] mx-auto"
          >
            {/* Nombre completo */}
            <div className="w-full">
              <div className="relative flex items-center gap-2 w-full h-14">
                <AiOutlineUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="fullName"
                  type="text"
                  placeholder="Nombre completo"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="rounded-md pl-10 pr-10 w-full h-full bg-white text-black border border-gray-500 outline-none placeholder:text-gray-500"
                />
              </div>
            </div>

            {/* Email */}
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

            {/* Contraseña */}
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

            {/* Confirmar contraseña */}
            <div className="w-full">
              <div className="relative flex items-center gap-2 w-full h-14">
                <AiOutlineLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirmar contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="pl-10 pr-10 w-full h-full bg-white text-black border border-gray-500 rounded-md outline-none placeholder:text-gray-500"
                />
                {showConfirmPassword ? (
                  <AiOutlineEyeInvisible
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 cursor-pointer"
                    onClick={() => setShowConfirmPassword(false)}
                  />
                ) : (
                  <AiOutlineEye
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 cursor-pointer"
                    onClick={() => setShowConfirmPassword(true)}
                  />
                )}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="bg-[#0D4D98] text-white rounded-md h-12 w-full flex items-center justify-between px-4 hover:bg-[#0b4282] disabled:opacity-50"
              disabled={loading}
            >
              <span className="flex items-center">
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" />
                    <span className="pl-1">Creando...</span>
                  </>
                ) : (
                  "Crear cuenta"
                )}
              </span>
              <AiOutlineArrowRight />
            </button>
          </form>

          <p className="mt-3 text-white md:text-black">
            ¿Ya tienes cuenta? {""}
            <Link
              to="/"
              className="hover:text-purple-700 text-blue-300 md:text-blue-500 hover:underline underline-offset-4"
            >
              Inicia sesión
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
