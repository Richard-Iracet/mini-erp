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
      row.push(cur);
      cur = "";

      if (row.some((c) => (c ?? "").toString().trim() !== "")) rows.push(row);
      row = [];
      continue;
    }
    cur += ch;
  }

  row.push(cur);
  if (row.some((c) => (c ?? "").toString().trim() !== "")) rows.push(row);

  return rows;
}

async function fetchText(url) {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Falha ao baixar CSV (${resp.status})`);
  return await resp.text();
}

function getColMulti(headerIndex, row, keys = []) {
  for (const key of keys) {
    const idx = headerIndex.get(key);
    if (idx !== undefined) return row[idx] ?? "";
  }
  return "";
}

function parseDateBR(str) {
  if (!str) return null;
  const s = String(str).trim();
  if (!s) return null;

  const parts = s.split("/");
  if (parts.length !== 3) return null;

  const [dd, mm, yyyy] = parts.map((p) => p.trim());
  if (!dd || !mm || !yyyy) return null;

  const iso = `${yyyy.padStart(4, "0")}-${mm.padStart(2, "0")}-${dd.padStart(
    2,
    "0"
  )}`;

  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;

  return iso;
}

async function importarFormsCSV(req, res) {
  try {
    const url = process.env.FORMS_CSV_URL;
    if (!url) {
      return res.status(400).json({
        erro: "FORMS_CSV_URL não definido no backend (.env).",
      });
    }

    const csvText = await fetchText(url);
    const rows = parseCSV(csvText);

    if (rows.length < 2) {
      return res.status(400).json({ erro: "CSV vazio ou inválido." });
    }

    const header = rows[0].map((h) =>
      (h ?? "").toString().replace("\ufeff", "").trim()
    );

    const headerIndex = new Map();
    for (let i = 0; i < header.length; i++) headerIndex.set(header[i], i);

    await pool.query("BEGIN");

    let responsaveisCriados = 0;
    let responsaveisAtualizados = 0;
    let alunasCriadas = 0;
    let ignorados = 0;
    let datasNascSalvas = 0;

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];

      const alunaNome = getColMulti(headerIndex, row, [
        "Nome completo da bailarina (o):",
        "Nome completo da bailarina (o)",
        "Nome completo da bailarina:",
        "Nome completo da bailarina",
        "Nome completo da aluna:",
        "Nome completo da aluna",
      ]).trim();

      const dataNascRaw = getColMulti(headerIndex, row, [
        "Data de nascimento da aluna:",
        "Data de nascimento da aluna",
        "Data de nascimento:",
        "Data de nascimento",
        "Nascimento da aluna:",
        "Nascimento da aluna",
      ]).trim();

      const dataNascimento = parseDateBR(dataNascRaw);

      const respNome = getColMulti(headerIndex, row, [
        "Nome completo do responsável:",
        "Nome completo do responsável",
        "Nome do responsável:",
        "Nome do responsável",
      ]).trim();

      const cpfRaw = getColMulti(headerIndex, row, [
        "CPF do responsável:",
        "CPF do responsável",
        "Cpf do responsável:",
        "Cpf do responsável",
        "CPF Responsável:",
        "CPF Responsável",
      ]).trim();

      const telefone1Raw = getColMulti(headerIndex, row, [
        "Telefone:",
        "Telefone",
        "Telefone do responsável:",
        "Telefone do responsável",
      ]).trim();

      const telefone2Raw = getColMulti(headerIndex, row, [
        "Telefone adicional:",
        "Telefone adicional",
        "Telefone 2:",
        "Telefone 2",
        "Telefone secundário:",
        "Telefone secundário",
      ]).trim();

      const endereco = getColMulti(headerIndex, row, [
        "Endereço:",
        "Endereço",
        "Endereco:",
        "Endereco",
      ]).trim();

      const bairro = getColMulti(headerIndex, row, ["Bairro:", "Bairro"]).trim();

      const municipio = getColMulti(headerIndex, row, [
        "Município:",
        "Município",
        "Municipio:",
        "Municipio",
        "Cidade:",
        "Cidade",
      ]).trim();

      const estadoRaw = getColMulti(headerIndex, row, [
        "Estado:",
        "Estado",
        "UF:",
        "UF",
      ]).trim();

      const estado = normalizarUF(estadoRaw);

      const cep = getColMulti(headerIndex, row, ["CEP:", "CEP"]).trim();

      if (!respNome) {
        ignorados++;
        continue;
      }

      const cpf = onlyDigits(cpfRaw);
      const telefone1 = onlyDigits(telefone1Raw);
      const telefone2 = onlyDigits(telefone2Raw);

      let responsavelId = null;

      if (cpf) {
        const upsert = await pool.query(
          `
          INSERT INTO responsaveis
          (nome, cpf, telefone1, telefone2, email, endereco, bairro, municipio, estado, cep)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
          ON CONFLICT (cpf)
          DO UPDATE SET
            nome = EXCLUDED.nome,
            telefone1 = COALESCE(EXCLUDED.telefone1, responsaveis.telefone1),
            telefone2 = COALESCE(EXCLUDED.telefone2, responsaveis.telefone2),
            endereco = COALESCE(EXCLUDED.endereco, responsaveis.endereco),
            bairro = COALESCE(EXCLUDED.bairro, responsaveis.bairro),
            municipio = COALESCE(EXCLUDED.municipio, responsaveis.municipio),
            estado = COALESCE(EXCLUDED.estado, responsaveis.estado),
            cep = COALESCE(EXCLUDED.cep, responsaveis.cep)
          RETURNING id
          `,
          [
            respNome,
            cpf,
            telefone1 || null,
            telefone2 || null,
            null,
            endereco || null,
            bairro || null,
            municipio || null,
            estado || null,
            cep || null,
          ]
        );

        responsavelId = upsert.rows[0].id;
        responsaveisAtualizados++;
      } else {
        let found = null;

        if (telefone1) {
          const q = await pool.query(
            `SELECT id FROM responsaveis WHERE telefone1 = $1 LIMIT 1`,
            [telefone1]
          );
          if (q.rows.length) found = q.rows[0];
        }

        if (found) {
          responsavelId = found.id;
          responsaveisAtualizados++;
        } else {
          const created = await pool.query(
            `
            INSERT INTO responsaveis
            (nome, cpf, telefone1, telefone2, email, endereco, bairro, municipio, estado, cep)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
            RETURNING id
            `,
            [
              respNome,
              null,
              telefone1 || null,
              telefone2 || null,
              null,
              endereco || null,
              bairro || null,
              municipio || null,
              estado || null,
              cep || null,
            ]
          );

          responsavelId = created.rows[0].id;
          responsaveisCriados++;
        }
      }

      if (alunaNome && responsavelId) {
        const exists = await pool.query(
          `
          SELECT id, data_nascimento FROM alunas
          WHERE nome = $1 AND responsavel_id = $2
          LIMIT 1
          `,
          [alunaNome, responsavelId]
        );

        if (!exists.rows.length) {
          await pool.query(
            `
            INSERT INTO alunas (nome, responsavel_id, ativo, data_nascimento)
            VALUES ($1, $2, true, $3)
            `,
            [alunaNome, responsavelId, dataNascimento || null]
          );

          alunasCriadas++;
          if (dataNascimento) datasNascSalvas++;
        } else {
          const alunaExistente = exists.rows[0];

          if (!alunaExistente.data_nascimento && dataNascimento) {
            await pool.query(
              `
              UPDATE alunas
              SET data_nascimento = $1
              WHERE id = $2
              `,
              [dataNascimento, alunaExistente.id]
            );
            datasNascSalvas++;
          }
        }
      }
    }

    await pool.query("COMMIT");

    return res.json({
      mensagem: "Importação concluída",
      responsaveisCriados,
      responsaveisAtualizados,
      alunasCriadas,
      ignorados,
      datasNascSalvas,
      totalLinhas: rows.length - 1,
    });
  } catch (err) {
    try {
      await pool.query("ROLLBACK");
    } catch {}
    console.error("Erro ao importar Forms CSV:", err);
    return res.status(500).json({ erro: "Erro ao importar CSV do Forms" });
  }
}

module.exports = {
  listarResponsaveis,
  criarResponsavel,
  buscarResponsavel,
  atualizarResponsavel,
  deletarResponsavel,
  importarFormsCSV,
};
