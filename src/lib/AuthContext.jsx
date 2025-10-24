// src/lib/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "./supabaseClient"; // Tu conexión a Supabase

// 1. Creamos el contexto (un lugar para guardar datos)
const AuthContext = createContext();

// 2. Creamos el "Proveedor" (el componente que envuelve la app y provee los datos)
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null); // Guarda la sesión (o null)
  const [loading, setLoading] = useState(true); // Indica si aún estamos revisando la sesión

  useEffect(() => {
    // Revisa si ya hay una sesión activa de Supabase cuando la app carga
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false); // Terminamos de cargar
    });

    // Escucha cambios en el estado de autenticación (Login, Logout)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session); // Actualiza nuestro estado 'session'
      }
    );

    // Limpieza: Deja de escuchar cuando el componente se desmonta
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []); // El [] vacío significa "ejecuta esto solo una vez al cargar"

  // Los "valores" que compartiremos con toda la app
  const value = {
    session,
    loading,
  };

  // Importante: No mostramos el resto de la app hasta que sepamos si hay sesión
  // Esto evita parpadeos o mostrar contenido protegido brevemente
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

// 3. Creamos un "Hook" personalizado para usar el contexto más fácil
// En otros componentes, solo llamaremos a 'useAuth()'
export function useAuth() {
  return useContext(AuthContext);
}
