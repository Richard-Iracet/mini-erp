const pool = require("../database/connection");

async function listarTurmas(req, res) {
  try {
    const query = `
      SELECT
        t.id,
        t.nome,
        t.dia_semana,
        t.horario,
        t.valor_mensal,
        t.created_at,
        COUNT(at.aluna_id) AS qtd_alunas
      FROM turmas t
      LEFT JOIN alunas_turmas at ON at.turma_id = t.id
      GROUP BY t.id
      ORDER BY t.id
    `;

    const { rows } = await pool.query(query);
    return res.json(rows);
  } catch (err) {
    console.error("Erro ao listar turmas:", err);
    return res.status(500).json({ erro: "Erro ao listar turmas" });
  }
}

async function listarAlunasDaTurma(req, res) {
  const { id } = req.params;

  try {
    const query = `
      SELECT
        a.id,
        a.nome,
        a.ativo,
        a.created_at,
        r.nome AS responsavel_nome,
        r.cpf  AS responsavel_cpf
      FROM alunas_turmas at
      INNER JOIN alunas a ON a.id = at.aluna_id
      LEFT JOIN responsaveis r ON r.id = a.responsavel_id
      WHERE at.turma_id = $1
      ORDER BY a.nome ASC
    `;

    const { rows } = await pool.query(query, [id]);
    return res.json(rows);
  } catch (err) {
    console.error("Erro ao listar alunas da turma:", err);
    return res.status(500).json({ erro: "Erro ao listar alunas da turma" });
  }
}

async function buscarTurma(req, res) {
  const { id } = req.params;

  try {
    const query = `
      SELECT id, nome, dia_semana, horario, valor_mensal
      FROM turmas
      WHERE id = $1
    `;

    const { rows } = await pool.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ erro: "Turma não encontrada" });
    }

    return res.json(rows[0]);
  } catch (err) {
    console.error("Erro ao buscar turma:", err);
    return res.status(500).json({ erro: "Erro ao buscar turma" });
  }
}

async function criarTurma(req, res) {
  const { nome, dia_semana, horario, valor_mensal } = req.body;

  try {
    const query = `
      INSERT INTO turmas (nome, dia_semana, horario, valor_mensal)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const values = [nome, dia_semana, horario, valor_mensal];

    const { rows } = await pool.query(query, values);
    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error("Erro ao criar turma:", err);
    return res.status(500).json({ erro: "Erro ao criar turma" });
  }
}

async function atualizarTurma(req, res) {
  const { id } = req.params;
  const { nome, dia_semana, horario, valor_mensal } = req.body;

  try {
    const query = `
      UPDATE turmas
      SET nome = $1,
          dia_semana = $2,
          horario = $3,
          valor_mensal = $4
      WHERE id = $5
      RETURNING *
    `;

    const values = [nome, dia_semana, horario, valor_mensal, id];

    const { rows } = await pool.query(query, values);

    if (rows.length === 0) {
      return res.status(404).json({ erro: "Turma não encontrada" });
    }

    return res.json(rows[0]);
  } catch (err) {
    console.error("Erro ao atualizar turma:", err);
    return res.status(500).json({ erro: "Erro ao atualizar turma" });
  }
}

async function deletarTurma(req, res) {
  const { id } = req.params;

  try {
    const query = `DELETE FROM turmas WHERE id = $1 RETURNING *`;
    const { rows } = await pool.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ erro: "Turma não encontrada" });
    }

    return res.json({ mensagem: "Turma deletada com sucesso" });
  } catch (err) {
    console.error("Erro ao deletar turma:", err);
    return res.status(500).json({ erro: "Erro ao deletar turma" });
  }
}

module.exports = {
  listarTurmas,
  listarAlunasDaTurma,
  buscarTurma,
  criarTurma,
  atualizarTurma,
  deletarTurma,
};
