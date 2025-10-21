import React, { useState } from "react";
import { Link } from "react-router-dom";
import supabase from "../lib/supabaseClient";
import "./Login.css";
import "./Register.css"; 
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
        title: "Las contraseñas no coinciden",
        text: "Por favor, verifica que ambas contraseñas sean iguales.",
        icon: "warning",
        confirmButtonText: "Entendido",
      });
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });

      if (error) throw error;

      const userId = data?.user?.id;
      if (!userId)
        throw new Error(
          "No se pudo obtener el ID de usuario tras el registro."
        );

      if (userId) {
        const { error: upsertError } = await supabase.from("usuarios").upsert(
          {
            id: userId,
            nombre_completo: fullName,
            email: email,
            id_rol_fk: 2, 
          },
          { onConflict: "id" }
        );

        if (upsertError) {
          throw upsertError;
        }

        await Swal.fire({
          title: "¡Cuenta creada!",
          text: "Tu perfil ha sido registrado correctamente.",
          icon: "success",
          confirmButtonText: "Ir a iniciar sesión",
        });

        window.location.href = "/";
        return;
      }
    } catch (error) {
      const msg = (error?.message || "").toLowerCase();
      if (
        msg.includes("already") ||
        msg.includes("registered") ||
        msg.includes("exists")
      ) {
        await Swal.fire({
          title: "Este email ya está registrado",
          text: "Inicia sesión.",
          icon: "warning",
          confirmButtonText: "Entendido",
        });
      } else {
        await Swal.fire({
          title: "Error al registrarse",
          text:
            error?.error_description ||
            error?.message ||
            "Ocurrió un error inesperado",
          icon: "error",
          confirmButtonText: "Entendido",
        });
      }
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
        <p>¡Crea tu cuenta para continuar!</p>

        <form onSubmit={handleRegister} className="loginForm">
          <div className="formGroup">
            <div className="inputWithIcon">
              <AiOutlineUser className="icon" />
              <input
                id="fullName"
                type="text"
                placeholder="Nombre completo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
          </div>

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

          <div className="formGroup">
            <div className="inputWithIcon">
              <AiOutlineLock className="icon" />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirmar contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              {showConfirmPassword ? (
                <AiOutlineEyeInvisible
                  className="iconRight"
                  onClick={() => setShowConfirmPassword(false)}
                />
              ) : (
                <AiOutlineEye
                  className="iconRight"
                  onClick={() => setShowConfirmPassword(true)}
                />
              )}
            </div>
          </div>

          <button type="submit" className="loginButton" disabled={loading}>
            <span>{loading ? "Creando..." : "Crear cuenta"}</span>
            <AiOutlineArrowRight />
          </button>
        </form>

        <p className="pRegister">
          ¿Ya tienes cuenta? <Link to="/">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}
