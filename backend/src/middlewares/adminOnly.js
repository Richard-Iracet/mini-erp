function adminOnly(req, res, next) {
  if (!req.usuario) {
    return res.status(401).json({ erro: "Não autenticado" });
  }

  if (req.usuario.role !== "admin") {
    return res
      .status(403)
      .json({ erro: "Apenas admin pode realizar esta ação" });
  }

  return next();
}

module.exports = adminOnly;
