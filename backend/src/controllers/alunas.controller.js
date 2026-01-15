const pool = require("../database/connection");

async function listarAlunas(req, res) {
  try {
    const query = `
      SELECT
        a.id,
        a.nome,
        a.ativo,
        a.created_at,
        a.responsavel_id,
        a.data_nascimento,

        r.nome AS responsavel_nome,
        r.cpf  AS responsavel_cpf,
        r.telefone1 AS responsavel_telefone1,
        r.telefone2 AS responsavel_telefone2,

        COALESCE(
          JSON_AGG(
            DISTINCT JSONB_BUILD_OBJECT(
              'id', t.id,
              'nome', t.nome,
              'dia_semana', t.dia_semana,
              'horario', t.horario
            )
          ) FILTER (WHERE t.id IS NOT NULL),
          '[]'
        ) AS turmas

      FROM alunas a
      LEFT JOIN responsaveis r ON r.id = a.responsavel_id
      LEFT JOIN alunas_turmas at ON at.aluna_id = a.id
      LEFT JOIN turmas t ON t.id = at.turma_id

      GROUP BY a.id, r.id
      ORDER BY a.id
    `;

    const { rows } = await pool.query(query);
    return res.json(rows);
  } catch (err) {
    console.error("Erro ao listar alunas:", err);
    return res.status(500).json({ erro: "Erro ao listar alunas" });
  }
}

async function criarAluna(req, res) {
  const { nome, responsavel_id, ativo, data_nascimento } = req.body;

  try {
    const query = `
      INSERT INTO alunas (nome, responsavel_id, ativo, data_nascimento)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const values = [nome, responsavel_id, ativo ?? true, data_nascimento || null];

    const { rows } = await pool.query(query, values);
    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error("Erro ao criar aluna:", err);
    return res.status(500).json({ erro: "Erro ao criar aluna" });
  }
}

async function buscarAluna(req, res) {
  const { id } = req.params;

  try {
    const query = `
      SELECT 
        a.id,
        a.nome,
        a.ativo,
        a.created_at,
        a.responsavel_id,
        a.data_nascimento,

        r.nome AS responsavel_nome,
        r.cpf  AS responsavel_cpf,
        r.telefone1 AS responsavel_telefone1,
        r.telefone2 AS responsavel_telefone2,
        r.email AS responsavel_email,
        r.endereco AS responsavel_endereco,
        r.bairro AS responsavel_bairro,
        r.municipio AS responsavel_municipio,
        r.estado AS responsavel_estado,
        r.cep AS responsavel_cep

      FROM alunas a
      LEFT JOIN responsaveis r ON r.id = a.responsavel_id
      WHERE a.id = $1
    `;

    const { rows } = await pool.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ erro: "Aluna não encontrada" });
    }

    return res.json(rows[0]);
  } catch (err) {
    console.error("Erro ao buscar aluna:", err);
    return res.status(500).json({ erro: "Erro ao buscar aluna" });
  }
}

async function atualizarAluna(req, res) {
  const { id } = req.params;
  const { nome, responsavel_id, ativo, data_nascimento } = req.body;

  try {
    const query = `
      UPDATE alunas
      SET nome = $1,
          responsavel_id = $2,
          ativo = $3,
          data_nascimento = $4
      WHERE id = $5
      RETURNING *
    `;

    const values = [nome, responsavel_id, ativo, data_nascimento || null, id];

    const { rows } = await pool.query(query, values);

    if (rows.length === 0) {
      return res.status(404).json({ erro: "Aluna não encontrada" });
    }

    return res.json(rows[0]);
  } catch (err) {
    console.error("Erro ao atualizar aluna:", err);
    return res.status(500).json({ erro: "Erro ao atualizar aluna" });
  }
}

async function deletarAluna(req, res) {
  const { id } = req.params;

  try {
    const query = `DELETE FROM alunas WHERE id = $1 RETURNING *`;
    const { rows } = await pool.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ erro: "Aluna não encontrada" });
    }

    return res.json({ mensagem: "Aluna deletada com sucesso" });
  } catch (err) {
    console.error("Erro ao deletar aluna:", err);
    return res.status(500).json({ erro: "Erro ao deletar aluna" });
  }
}

async function aniversariantesMes(req, res) {
  const mes = Number(req.query.mes);

  if (!mes || mes < 1 || mes > 12) {
    return res.status(400).json({ erro: "mes inválido (1-12)" });
  }

  try {
    const { rows } = await pool.query(
      `
      SELECT 
        a.id,
        a.nome,
        a.data_nascimento,
        r.nome AS responsavel_nome,
        r.telefone1 AS responsavel_telefone1,
        r.telefone2 AS responsavel_telefone2
      FROM alunas a
      LEFT JOIN responsaveis r ON r.id = a.responsavel_id
      WHERE a.data_nascimento IS NOT NULL
        AND EXTRACT(MONTH FROM a.data_nascimento) = $1
      ORDER BY EXTRACT(DAY FROM a.data_nascimento), a.nome
      `,
      [mes]
    );

    return res.json(rows);
  } catch (err) {
    console.error("Erro ao buscar aniversariantes:", err);
    return res.status(500).json({ erro: "Erro ao buscar aniversariantes" });
  }
}

module.exports = {
  listarAlunas,
  criarAluna,
  buscarAluna,
  atualizarAluna,
  deletarAluna,
  aniversariantesMes,
};
