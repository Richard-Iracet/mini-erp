const API_URL = "http://localhost:3001";

async function login(email, senha) {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, senha }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.erro || "Erro ao fazer login");
    }

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
