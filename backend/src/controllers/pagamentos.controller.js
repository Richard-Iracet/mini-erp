const pool = require("../database/connection");

const DESCONTO_DINHEIRO = 10;
const DESCONTO_IRMAOS = 10;

function calcularValorFinal({ valorOriginal, metodoPagamento, temIrmaos }) {
  const original = Number(valorOriginal) || 0;

  const descontoModalidade =
    metodoPagamento === "dinheiro" ? DESCONTO_DINHEIRO : 0;

  const descontoIrmaos = temIrmaos ? DESCONTO_IRMAOS : 0;

  const final = Math.max(original - descontoModalidade - descontoIrmaos, 0);

  return {
    valor_original: original,
    desconto_modalidade: descontoModalidade,
    desconto_irmaos: descontoIrmaos,
    valor_final: final,
  };
}

async function criarPagamento(req, res) {
  const { aluna_id, turma_id, mes, ano, valor, metodo_pagamento } = req.body;

  if (!aluna_id || !turma_id || !mes || !ano || valor === undefined) {
    return res.status(400).json({
      erro: "Campos obrigatórios: aluna_id, turma_id, mes, ano, valor",
    });
  }

  const metodo = metodo_pagamento || "pix";

  try {
    const irmaosQuery = `
      SELECT COUNT(DISTINCT a.id) AS total
      FROM alunas a
      WHERE a.responsavel_id = (SELECT responsavel_id FROM alunas WHERE id = $1)
        AND a.ativo = true
    `;

    const { rows: irmaosRows } = await pool.query(irmaosQuery, [aluna_id]);
    const total = Number(irmaosRows[0]?.total || 0);
    const temIrmaos = total >= 2;

    const calc = calcularValorFinal({
      valorOriginal: valor,
      metodoPagamento: metodo,
      temIrmaos,
    });

    const insertQuery = `
      INSERT INTO pagamentos (
        aluna_id, turma_id, mes, ano,
        metodo_pagamento,
        valor_original, desconto_modalidade, desconto_irmaos, valor_final,
        valor
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$9)
      RETURNING *
    `;

    const values = [
      aluna_id,
      turma_id,
      mes,
      ano,
      metodo,
      calc.valor_original,
      calc.desconto_modalidade,
      calc.desconto_irmaos,
      calc.valor_final,
    ];

    const { rows } = await pool.query(insertQuery, values);
    return res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(400).json({
        erro: "Pagamento já existe para essa aluna, turma e mês",
      });
    }

    console.error("Erro ao criar pagamento:", err);
    return res.status(500).json({ erro: "Erro ao criar pagamento" });
  }
}

async function listarPagamentos(req, res) {
  try {
    const { mes, ano, turma_id, status } = req.query;

    const filtros = [];
    const params = [];
    let idx = 1;

    if (mes) {
      filtros.push(`p.mes = $${idx++}`);
      params.push(Number(mes));
    }

    if (ano) {
      filtros.push(`p.ano = $${idx++}`);
      params.push(Number(ano));
    }

    if (turma_id) {
      filtros.push(`p.turma_id = $${idx++}`);
      params.push(Number(turma_id));
    }

    if (status === "pago") filtros.push("p.pago = true");
    if (status === "pendente") filtros.push("p.pago = false");

    const where = filtros.length ? `WHERE ${filtros.join(" AND ")}` : "";

    const query = `
      SELECT
        p.id,
        a.nome AS aluna,
        t.nome AS turma,
        p.mes,
        p.ano,
        p.metodo_pagamento,
        p.valor_original,
        p.desconto_modalidade,
        p.desconto_irmaos,
        p.valor_final,
        p.valor,
        p.pago,
        p.data_pagamento
      FROM pagamentos p
      JOIN alunas a ON a.id = p.aluna_id
      JOIN turmas t ON t.id = p.turma_id
      ${where}
      ORDER BY p.ano DESC, p.mes DESC, a.nome ASC
    `;

    const { rows } = await pool.query(query, params);
    return res.json(rows);
  } catch (err) {
    console.error("Erro ao listar pagamentos:", err);
    return res.status(500).json({ erro: "Erro ao listar pagamentos" });
  }
}

async function buscarPagamento(req, res) {
  const { id } = req.params;

  try {
    const { rows } = await pool.query(
      `SELECT * FROM pagamentos WHERE id = $1`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ erro: "Pagamento não encontrado" });
    }

    return res.json(rows[0]);
  } catch (err) {
    console.error("Erro ao buscar pagamento:", err);
    return res.status(500).json({ erro: "Erro ao buscar pagamento" });
  }
}

async function atualizarPagamento(req, res) {
  const { id } = req.params;
  const { mes, ano, valor } = req.body;

  if (!mes || !ano || valor === undefined) {
    return res.status(400).json({
      erro: "Campos obrigatórios: mes, ano, valor",
    });
  }

  try {
    const query = `
      UPDATE pagamentos
      SET mes = $1,
          ano = $2,
          valor = $3,
          valor_original = COALESCE(valor_original, $3),
          valor_final = COALESCE(valor_final, $3)
      WHERE id = $4
      RETURNING *
    `;

    const { rows } = await pool.query(query, [mes, ano, valor, id]);

    if (rows.length === 0) {
      return res.status(404).json({ erro: "Pagamento não encontrado" });
    }

    return res.json(rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(400).json({
        erro: "Já existe pagamento para essa aluna/turma nesse mês/ano",
      });
    }

    console.error("Erro ao atualizar pagamento:", err);
    return res.status(500).json({ erro: "Erro ao atualizar pagamento" });
  }
}

async function marcarComoPago(req, res) {
  const { id } = req.params;

  try {
    const query = `
      UPDATE pagamentos
      SET pago = true,
          data_pagamento = CURRENT_DATE
      WHERE id = $1
      RETURNING *
    `;

    const { rows } = await pool.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ erro: "Pagamento não encontrado" });
    }

    return res.json(rows[0]);
  } catch (err) {
    console.error("Erro ao marcar como pago:", err);
    return res.status(500).json({ erro: "Erro ao atualizar pagamento" });
  }
}

async function desfazerPagamento(req, res) {
  const { id } = req.params;

  try {
    const query = `
      UPDATE pagamentos
      SET pago = false,
          data_pagamento = NULL
      WHERE id = $1
      RETURNING *
    `;

    const { rows } = await pool.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ erro: "Pagamento não encontrado" });
    }

    return res.json(rows[0]);
  } catch (err) {
    console.error("Erro ao desfazer pagamento:", err);
    return res.status(500).json({ erro: "Erro ao desfazer pagamento" });
  }
}

async function deletarPagamento(req, res) {
  const { id } = req.params;

  try {
    const { rows } = await pool.query(
      `DELETE FROM pagamentos WHERE id = $1 RETURNING *`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ erro: "Pagamento não encontrado" });
    }

    return res.json({ mensagem: "Pagamento deletado com sucesso" });
  } catch (err) {
    console.error("Erro ao deletar pagamento:", err);
    return res.status(500).json({ erro: "Erro ao deletar pagamento" });
  }
}

async function atualizarMetodoPagamento(req, res) {
  const { id } = req.params;
  const { metodo_pagamento } = req.body;

  const permitido = ["pix", "dinheiro", "cartao"];
  if (!permitido.includes(metodo_pagamento)) {
    return res.status(400).json({
      erro: "metodo_pagamento inválido. Use pix, dinheiro ou cartao",
    });
  }

  try {
    const atualQuery = `
      SELECT id, valor_original, desconto_irmaos
      FROM pagamentos
      WHERE id = $1
    `;

    const { rows: atualRows } = await pool.query(atualQuery, [id]);

    if (atualRows.length === 0) {
      return res.status(404).json({ erro: "Pagamento não encontrado" });
    }

    const pagamento = atualRows[0];

    const valorOriginal = Number(pagamento.valor_original) || 0;
    const descontoIrmaos = Number(pagamento.desconto_irmaos) || 0;

    const descontoModalidade =
      metodo_pagamento === "dinheiro" ? DESCONTO_DINHEIRO : 0;

    const valorFinal = Math.max(
      valorOriginal - descontoModalidade - descontoIrmaos,
      0
    );

    const updateQuery = `
      UPDATE pagamentos
      SET metodo_pagamento = $1,
          desconto_modalidade = $2,
          valor_final = $3,
          valor = $3
      WHERE id = $4
      RETURNING *
    `;

    const { rows } = await pool.query(updateQuery, [
      metodo_pagamento,
      descontoModalidade,
      valorFinal,
      id,
    ]);

    return res.json(rows[0]);
  } catch (err) {
    console.error("Erro ao atualizar método de pagamento:", err);
    return res
      .status(500)
      .json({ erro: "Erro ao atualizar método de pagamento" });
  }
}

async function gerarPagamentosDoMes(req, res) {
  let { mes, ano, turma_id, valor_override } = req.body;

  if (!mes || !ano) {
    return res.status(400).json({
      erro: "mes e ano são obrigatórios (ex: { mes: 1, ano: 2026 })",
    });
  }

  mes = Number(mes);
  ano = Number(ano);

  if (Number.isNaN(mes) || Number.isNaN(ano)) {
    return res.status(400).json({ erro: "mes e ano precisam ser números" });
  }

  if (mes < 1 || mes > 12) {
    return res.status(400).json({ erro: "mes precisa estar entre 1 e 12" });
  }

  if (turma_id !== undefined && turma_id !== null && turma_id !== "") {
    turma_id = Number(turma_id);
    if (Number.isNaN(turma_id)) {
      return res.status(400).json({ erro: "turma_id inválido" });
    }
  } else {
    turma_id = null;
  }

  if (
    valor_override !== undefined &&
    valor_override !== null &&
    valor_override !== ""
  ) {
    valor_override = Number(valor_override);
    if (Number.isNaN(valor_override) || valor_override < 0) {
      return res.status(400).json({ erro: "valor_override inválido" });
    }
  } else {
    valor_override = null;
  }

  try {
    const metodoPadrao = "pix";

    const query = `
      WITH base AS (
        SELECT
          at.aluna_id,
          at.turma_id,
          CASE
            WHEN $5::numeric IS NOT NULL THEN $5::numeric
            ELSE t.valor_mensal
          END AS valor_original,
          a.responsavel_id
        FROM alunas_turmas at
        JOIN turmas t ON t.id = at.turma_id
        JOIN alunas a ON a.id = at.aluna_id
        WHERE at.ativo = true
          AND a.ativo = true
          AND ($6::int IS NULL OR at.turma_id = $6::int)
          AND NOT EXISTS (
            SELECT 1
            FROM pagamentos p
            WHERE p.aluna_id = at.aluna_id
              AND p.turma_id = at.turma_id
              AND p.mes = $1
              AND p.ano = $2
          )
      ),
      irmaos AS (
        SELECT
          responsavel_id,
          COUNT(DISTINCT aluna_id) AS qtd_alunas
        FROM base
        GROUP BY responsavel_id
      )
      INSERT INTO pagamentos (
        aluna_id, turma_id, mes, ano,
        metodo_pagamento,
        valor_original,
        desconto_modalidade,
        desconto_irmaos,
        valor_final,
        valor
      )
      SELECT
        b.aluna_id,
        b.turma_id,
        $1 AS mes,
        $2 AS ano,
        $3 AS metodo_pagamento,
        b.valor_original,
        0 AS desconto_modalidade,
        CASE WHEN i.qtd_alunas >= 2 THEN $4 ELSE 0 END AS desconto_irmaos,
        GREATEST(b.valor_original - (CASE WHEN i.qtd_alunas >= 2 THEN $4 ELSE 0 END), 0) AS valor_final,
        GREATEST(b.valor_original - (CASE WHEN i.qtd_alunas >= 2 THEN $4 ELSE 0 END), 0) AS valor
      FROM base b
      JOIN irmaos i ON i.responsavel_id = b.responsavel_id
      RETURNING *
    `;

    const result = await pool.query(query, [
      mes,
      ano,
      metodoPadrao,
      DESCONTO_IRMAOS,
      valor_override,
      turma_id,
    ]);

    let turma_nome = null;
    if (turma_id) {
      const { rows } = await pool.query(
        `SELECT nome FROM turmas WHERE id = $1`,
        [turma_id]
      );
      turma_nome = rows[0]?.nome || null;
    }

    return res.json({
      mensagem: "Pagamentos gerados com sucesso",
      mes,
      ano,
      turma_id,
      turma_nome,
      valor_override,
      quantidade: result.rowCount,
      pagamentos: result.rows,
    });
  } catch (err) {
    console.error("Erro ao gerar pagamentos do mês:", err);
    return res.status(500).json({ erro: "Erro ao gerar pagamentos do mês" });
  }
}

async function listarInadimplentes(req, res) {
  let { mes, ano } = req.query;

  if (!mes || !ano) {
    return res.status(400).json({ erro: "mes e ano são obrigatórios" });
  }

  mes = Number(mes);
  ano = Number(ano);

  if (Number.isNaN(mes) || Number.isNaN(ano)) {
    return res.status(400).json({ erro: "mes e ano precisam ser números" });
  }

  try {
    const query = `
      SELECT
        p.id AS pagamento_id,
        p.mes,
        p.ano,
        COALESCE(p.valor_final, p.valor) AS valor,

        a.id AS aluna_id,
        a.nome AS aluna_nome,

        t.id AS turma_id,
        t.nome AS turma_nome,

        r.id AS responsavel_id,
        r.nome AS responsavel_nome,
        r.telefone1 AS responsavel_telefone1,
        r.telefone2 AS responsavel_telefone2

      FROM pagamentos p
      JOIN alunas a ON a.id = p.aluna_id
      JOIN turmas t ON t.id = p.turma_id
      LEFT JOIN responsaveis r ON r.id = a.responsavel_id

      WHERE p.pago = false
        AND p.mes = $1
        AND p.ano = $2

      ORDER BY r.nome ASC NULLS LAST, a.nome ASC
    `;

    const result = await pool.query(query, [mes, ano]);

    return res.json({
      mes,
      ano,
      total: result.rowCount,
      inadimplentes: result.rows,
    });
  } catch (err) {
    console.error("Erro ao listar inadimplentes:", err);
    return res.status(500).json({ erro: "Erro ao listar inadimplentes" });
  }
}

module.exports = {
  criarPagamento,
  listarPagamentos,
  buscarPagamento,
  atualizarPagamento,
  marcarComoPago,
  desfazerPagamento,
  deletarPagamento,
  atualizarMetodoPagamento,
  gerarPagamentosDoMes,
  listarInadimplentes,
};
