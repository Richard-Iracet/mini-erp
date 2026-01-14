import { api } from "./api";

async function login(email, senha) {
  try {
    const response = await api.post("/auth/login", { email, senha });

    const data = response.data;

    if (!data.token) {
      throw new Error("Token não recebido do backend");
    }

    localStorage.setItem("token", data.token);

    if (data.usuario) {
      localStorage.setItem("usuario", JSON.stringify(data.usuario));
    }

    return data;
  } catch (error) {
    console.error("Erro no login (frontend):", error);

    if (error.response?.data?.erro) {
      throw new Error(error.response.data.erro);
    }

    throw error;
  }
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
}

function getToken() {
  return localStorage.getItem("token");
}

function getUsuario() {
  const u = localStorage.getItem("usuario");
  return u ? JSON.parse(u) : null;
}

export default {
  login,
  logout,
  getToken,
  getUsuario,
};
