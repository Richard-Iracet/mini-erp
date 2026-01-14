const pool = require("../database/connection");

// Vincular aluna a uma turma
async function vincular(req, res) {
  const { aluna_id, turma_id } = req.body;

  try {
    const query = `
      INSERT INTO alunas_turmas (aluna_id, turma_id)
      VALUES ($1, $2)
      RETURNING *
    `;

    const values = [aluna_id, turma_id];

    const { rows } = await pool.query(query, values);
    return res.status(201).json(rows[0]);
  } catch (err) {
    // 23505 = unique_violation
    if (err.code === "23505") {
      return res
        .status(400)
        .json({ erro: "Aluna já está vinculada a essa turma" });
    }

    console.error("Erro ao vincular aluna à turma:", err);
    return res.status(500).json({ erro: "Erro ao vincular aluna à turma" });
  }
}

// Listar turmas de uma aluna
async function listarPorAluna(req, res) {
  const { aluna_id } = req.params;

  try {
    const query = `
      SELECT t.id, t.nome, t.dia_semana, t.horario
      FROM alunas_turmas at
      JOIN turmas t ON t.id = at.turma_id
      WHERE at.aluna_id = $1 AND at.ativo = true
    `;

    const { rows } = await pool.query(query, [aluna_id]);
    return res.json(rows);
  } catch (err) {
    console.error("Erro ao listar turmas da aluna:", err);
    return res.status(500).json({ erro: "Erro ao listar turmas da aluna" });
  }
}

// Desativar vínculo
async function desativar(req, res) {
  const { id } = req.params;

  try {
    const query = `
      UPDATE alunas_turmas
      SET ativo = false
      WHERE id = $1
      RETURNING *
    `;

    const { rows } = await pool.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ erro: "Vínculo não encontrado" });
    }

    return res.json({ mensagem: "Vínculo desativado com sucesso" });
  } catch (err) {
    console.error("Erro ao desativar vínculo:", err);
    return res.status(500).json({ erro: "Erro ao desativar vínculo" });
  }
}

module.exports = {
  vincular,
  listarPorAluna,
  desativar,
};
