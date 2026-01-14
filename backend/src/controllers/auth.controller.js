const pool = require("../database/connection");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

async function login(req, res) {
  const email = String(req.body.email || "")
    .trim()
    .toLowerCase();
  const senha = String(req.body.senha || "").trim();

  try {
    if (!JWT_SECRET) {
      return res
        .status(500)
        .json({ erro: "JWT_SECRET não configurado no .env" });
    }

    const query = `SELECT id, email, senha, role FROM usuarios WHERE email = $1`;
    const { rows } = await pool.query(query, [email]);

    if (rows.length === 0) {
      return res.status(401).json({ erro: "Credenciais inválidas" });
    }

    const usuario = rows[0];

    const senhaOk = await bcrypt.compare(senha, usuario.senha);
    if (!senhaOk) {
      return res.status(401).json({ erro: "Credenciais inválidas" });
    }

    const token = jwt.sign(
      {
        id: usuario.id,
        email: usuario.email,
        role: usuario.role, // admin | contadora
      },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
    );

    return res.json({
      token,
      usuario: {
        id: usuario.id,
        email: usuario.email,
        role: usuario.role,
      },
    });
  } catch (err) {
    console.error("Erro no login:", err);
    return res.status(500).json({ erro: "Erro no login" });
  }
}

module.exports = { login };
