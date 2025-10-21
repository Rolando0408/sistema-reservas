import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import supabase from "../lib/supabaseClient";
import "./Login.css";
import logo from "../assets/logo-3.png";
import {
  AiOutlineMail,
  AiOutlineLock,
  AiOutlineArrowRight,
  AiOutlineEye,
  AiOutlineEyeInvisible,
} from "react-icons/ai";
import Swal from "sweetalert2";

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

      // Obtener perfil del usuario para saber el rol
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
        confirmButtonText: "Continuar",
      });

      if (perfil?.id_rol_fk === 2) {
        navigate("/dashboard-professor");
      } else {
        // Por ahora, los demás roles se quedan en login o redirige a otra vista si la tienes
        // navigate("/");
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
    <div className="loginContainer">
      <div className="loginSidebar">
        <div className="loginLogo">
          <img src={logo} alt="Logo" />
        </div>
      </div>
      <div className="loginMain">
        <h1>UNIMAR PROYECTA</h1>
        <p>Bienvenido! Inicia sesión para continuar</p>

        <form onSubmit={handleLogin} className="loginForm">
          <div className="formGroup">
            <div className="inputWithIcon">
              <AiOutlineMail className="icon" />
              <input
                id="email"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="formGroup">
            <div className="inputWithIcon">
              <AiOutlineLock className="icon" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {showPassword ? (
                <AiOutlineEyeInvisible
                  className="iconRight"
                  onClick={() => setShowPassword(false)}
                />
              ) : (
                <AiOutlineEye
                  className="iconRight"
                  onClick={() => setShowPassword(true)}
                />
              )}
            </div>
          </div>
          <button type="submit" className="loginButton" disabled={loading}>
            <span>{loading ? "Iniciando..." : "Iniciar Sesión"}</span>
            <AiOutlineArrowRight />
          </button>
        </form>

        <p className="pRegister">
          ¿No estás registrado? <Link to="/register">Regístrate aquí</Link>
        </p>
      </div>
    </div>
  );
}
