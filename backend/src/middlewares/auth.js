const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ erro: "Token não informado" });
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2) {
    return res.status(401).json({ erro: "Token mal formatado" });
  }

  const [scheme, token] = parts;
  if (scheme !== "Bearer") {
    return res.status(401).json({ erro: "Token mal formatado" });
  }

  if (!JWT_SECRET) {
    return res.status(500).json({ erro: "JWT_SECRET não configurado no .env" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.usuario = decoded;
    return next();
  } catch {
    return res.status(401).json({ erro: "Token inválido ou expirado" });
  }
}

module.exports = authMiddleware;
