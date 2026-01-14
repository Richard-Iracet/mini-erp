import { createContext, useContext, useEffect, useState } from "react";
import authService from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [autenticado, setAutenticado] = useState(false);

  useEffect(() => {
    const token = authService.getToken();
    setAutenticado(!!token);
  }, []);

  function login(token) {
    if (token) {
      localStorage.setItem("token", token);
      setAutenticado(true);
    }
  }

  function logout() {
    authService.logout();
    setAutenticado(false);
  }

  return (
    <AuthContext.Provider value={{ autenticado, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }

  return context;
}
