const pool = require("../database/connection");

async function listarResponsaveis(req, res) {
  try {
    const query = `
      SELECT
        r.id,
        r.nome,
        r.cpf,
        r.telefone1,
        r.telefone2,
        r.email,
        r.endereco,
        r.bairro,
        r.municipio,
        r.estado,
        r.cep,
        r.created_at,

        COALESCE(
          (
            SELECT JSON_AGG(
              JSON_BUILD_OBJECT(
                'id', a.id,
                'nome', a.nome,
                'ativo', a.ativo
              )
              ORDER BY a.nome
            )
            FROM alunas a
            WHERE a.responsavel_id = r.id
          ),
          '[]'::json
        ) AS alunas

      FROM responsaveis r
      ORDER BY r.nome ASC
    `;

    const { rows } = await pool.query(query);
    return res.json(rows);
  } catch (err) {
    console.error("Erro ao listar responsáveis:", err);
    return res.status(500).json({ erro: "Erro ao listar responsáveis" });
  }
}

async function criarResponsavel(req, res) {
  const {
    nome,
    cpf,
    telefone1,
    telefone2,
    email,
    endereco,
    bairro,
    municipio,
    estado,
    cep,
  } = req.body;

  if (!nome || nome.trim() === "") {
    return res.status(400).json({ erro: "Nome do responsável é obrigatório" });
  }

  try {
    const query = `
      INSERT INTO responsaveis
      (nome, cpf, telefone1, telefone2, email, endereco, bairro, municipio, estado, cep)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *
    `;

    const values = [
      nome,
      cpf || null,
      telefone1 || null,
      telefone2 || null,
      email || null,
      endereco || null,
      bairro || null,
      municipio || null,
      estado || null,
      cep || null,
    ];

    const { rows } = await pool.query(query, values);
    return res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      return res
        .status(400)
        .json({ erro: "CPF já cadastrado para outro responsável" });
    }

    console.error("Erro ao criar responsável:", err);
    return res.status(500).json({ erro: "Erro ao criar responsável" });
  }
}

async function buscarResponsavel(req, res) {
  const { id } = req.params;

  try {
    const query = `
      SELECT *
      FROM responsaveis
      WHERE id = $1
    `;

    const { rows } = await pool.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ erro: "Responsável não encontrado" });
    }

    return res.json(rows[0]);
  } catch (err) {
    console.error("Erro ao buscar responsável:", err);
    return res.status(500).json({ erro: "Erro ao buscar responsável" });
  }
}

async function atualizarResponsavel(req, res) {
  const { id } = req.params;

  const {
    nome,
    cpf,
    telefone1,
    telefone2,
    email,
    endereco,
    bairro,
    municipio,
    estado,
    cep,
  } = req.body;

  if (!nome || nome.trim() === "") {
    return res.status(400).json({ erro: "Nome do responsável é obrigatório" });
  }

  try {
    const query = `
      UPDATE responsaveis
      SET nome=$1,
          cpf=$2,
          telefone1=$3,
          telefone2=$4,
          email=$5,
          endereco=$6,
          bairro=$7,
          municipio=$8,
          estado=$9,
          cep=$10
      WHERE id=$11
      RETURNING *
    `;

    const values = [
      nome,
      cpf || null,
      telefone1 || null,
      telefone2 || null,
      email || null,
      endereco || null,
      bairro || null,
      municipio || null,
      estado || null,
      cep || null,
      id,
    ];

    const { rows } = await pool.query(query, values);

    if (rows.length === 0) {
      return res.status(404).json({ erro: "Responsável não encontrado" });
    }

    return res.json(rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      return res
        .status(400)
        .json({ erro: "CPF já cadastrado para outro responsável" });
    }

    console.error("Erro ao atualizar responsável:", err);
    return res.status(500).json({ erro: "Erro ao atualizar responsável" });
  }
}

async function deletarResponsavel(req, res) {
  const { id } = req.params;

  try {
    const query = `DELETE FROM responsaveis WHERE id = $1 RETURNING *`;
    const { rows } = await pool.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ erro: "Responsável não encontrado" });
    }

    return res.json({ mensagem: "Responsável deletado com sucesso" });
  } catch (err) {
    console.error("Erro ao deletar responsável:", err);
    return res.status(500).json({ erro: "Erro ao deletar responsável" });
  }
}

function onlyDigits(v) {
  return (v ?? "").toString().replace(/\D/g, "");
}

function normalizarUF(valor) {
  if (!valor) return null;
  const v = String(valor).trim().toLowerCase();

  const mapa = {
    "rio grande do sul": "RS",
    rs: "RS",
    "santa catarina": "SC",
    sc: "SC",
    paraná: "PR",
    parana: "PR",
    pr: "PR",
    "são paulo": "SP",
    "sao paulo": "SP",
    sp: "SP",
  };

  return mapa[v] || String(valor).trim().toUpperCase().slice(0, 2);
}

function parseCSV(text) {
  const rows = [];
  let cur = "";
  let row = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === '"' && inQuotes && next === '"') {
      cur += '"';
      i++;
      continue;
    }
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === "," && !inQuotes) {
      row.push(cur);
      cur = "";
      continue;
    }
    if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (ch === "\r" && next === "\n") i++;
      row.push
