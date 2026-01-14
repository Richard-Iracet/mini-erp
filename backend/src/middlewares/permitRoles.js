function permitRoles(...rolesPermitidos) {
  return (req, res, next) => {
    const usuario = req.usuario;

    if (!usuario) {
      return res.status(401).json({ erro: "Não autenticado" });
    }

    if (!usuario.role || !rolesPermitidos.includes(usuario.role)) {
      return res.status(403).json({ erro: "Acesso negado" });
    }

    return next();
  };
}

module.exports = permitRoles;
