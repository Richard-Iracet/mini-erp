export function getUsuario() {
  const u = localStorage.getItem("usuario");
  return u ? JSON.parse(u) : null;
}

export function isAdmin() {
  const usuario = getUsuario();
  return usuario?.role === "admin";
}

export function isContadora() {
  const usuario = getUsuario();
  return usuario?.role === "contadora";
}
