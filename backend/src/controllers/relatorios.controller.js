const pool = require("../database/connection");

function validarMesAno(req, res) {
  let { mes, ano } = req.query;

  if (!mes || !ano) {
    res.status(400).json({ erro: "mes e ano são obrigatórios" });
    return null;
  }

  mes = Number(mes);
  ano = Number(ano);

  if (Number.isNaN(mes) || Number.isNaN(ano)) {
    res.status(400).json({ erro: "mes e ano precisam ser números" });
    return null;
  }

  return { mes, ano };
}

async function resumoFinanceiro(req, res) {
  const dados = validarMesAno(req, res);
  if (!dados) return;

  const { mes, ano } = dados;

  try {
    const query = `
      SELECT
        SUM(COALESCE(valor_final, valor)) AS total_cobrado,
        SUM(CASE WHEN pago = true THEN COALESCE(valor_final, valor) ELSE 0 END) AS total_pago,
        SUM(CASE WHEN pago = false THEN COALESCE(valor_final, valor) ELSE 0 END) AS total_pendente
      FROM pagamentos
      WHERE mes = $1 AND ano = $2
    `;

    const { rows } = await pool.query(query, [mes, ano]);

    return res.json({
      mes,
      ano,
      ...rows[0],
    });
  } catch (err) {
    console.error("Erro ao gerar resumo financeiro:", err);
    return res.status(500).json({ erro: "Erro ao gerar resumo financeiro" });
  }
}

async function inadimplentes(req, res) {
  const dados = validarMesAno(req, res);
  if (!dados) return;

  const { mes, ano } = dados;

  try {
    const query = `
      SELECT
        r.nome AS responsavel,
        COALESCE(r.telefone1, r.telefone2) AS telefone,
        a.nome AS aluna,
        t.nome AS turma,
        COALESCE(p.valor_final, p.valor) AS valor
      FROM pagamentos p
      JOIN alunas a ON a.id = p.aluna_id
      JOIN turmas t ON t.id = p.turma_id
      LEFT JOIN responsaveis r ON r.id = a.responsavel_id
      WHERE p.mes = $1
        AND p.ano = $2
        AND p.pago = false
      ORDER BY r.nome ASC NULLS LAST, a.nome ASC
    `;

    const { rows } = await pool.query(query, [mes, ano]);
    return res.json(rows);
  } catch (err) {
    console.error("Erro ao listar inadimplentes:", err);
    return res.status(500).json({ erro: "Erro ao listar inadimplentes" });
  }
}

async function faturamentoPorTurma(req, res) {
  const dados = validarMesAno(req, res);
  if (!dados) return;

  const { mes, ano } = dados;

  try {
    const query = `
      SELECT
        t.nome AS turma,
        SUM(COALESCE(p.valor_final, p.valor)) AS total
      FROM pagamentos p
      JOIN turmas t ON t.id = p.turma_id
      WHERE p.mes = $1
        AND p.ano = $2
        AND p.pago = true
      GROUP BY t.nome
      ORDER BY total DESC
    `;

    const { rows } = await pool.query(query, [mes, ano]);
    return res.json(rows);
  } catch (err) {
    console.error("Erro ao gerar faturamento por turma:", err);
    return res
      .status(500)
      .json({ erro: "Erro ao gerar faturamento por turma" });
  }
}

async function relatorioCompleto(req, res) {
  const dados = validarMesAno(req, res);
  if (!dados) return;

  const { mes, ano } = dados;

  try {
    const query = `
      SELECT
        p.id AS pagamento_id,
        p.mes,
        p.ano,
        p.pago,
        p.data_pagamento,
        p.metodo_pagamento,

        COALESCE(p.valor_original, p.valor) AS valor_original,
        COALESCE(p.desconto_modalidade, 0) AS desconto_modalidade,
        COALESCE(p.desconto_irmaos, 0) AS desconto_irmaos,
        COALESCE(p.valor_final, p.valor) AS valor_final,

        a.id AS aluna_id,
        a.nome AS aluna_nome,
        a.ativo AS aluna_ativa,

        t.id AS turma_id,
        t.nome AS turma_nome,
        t.dia_semana,
        t.horario,

        r.id AS responsavel_id,
        r.nome AS responsavel_nome,
        r.cpf AS responsavel_cpf,
        r.telefone1 AS responsavel_telefone1,
        r.telefone2 AS responsavel_telefone2,
        r.email AS responsavel_email,
        r.endereco AS responsavel_endereco,
        r.bairro AS responsavel_bairro,
        r.municipio AS responsavel_municipio,
        r.estado AS responsavel_estado,
        r.cep AS responsavel_cep

      FROM pagamentos p
      JOIN alunas a ON a.id = p.aluna_id
      JOIN turmas t ON t.id = p.turma_id
      LEFT JOIN responsaveis r ON r.id = a.responsavel_id
      WHERE p.mes = $1
        AND p.ano = $2
      ORDER BY p.pago ASC, r.nome ASC NULLS LAST, a.nome ASC
    `;

    const result = await pool.query(query, [mes, ano]);

    let totalPago = 0;
    let totalPendente = 0;
    let totalGeral = 0;

    for (const row of result.rows) {
      const valor = Number(row.valor_final) || 0;
      totalGeral += valor;
      if (row.pago) totalPago += valor;
      else totalPendente += valor;
    }

    return res.json({
      mes,
      ano,
      total_registros: result.rowCount,
      total_pago: totalPago,
      total_pendente: totalPendente,
      total_geral: totalGeral,
      registros: result.rows,
    });
  } catch (err) {
    console.error("Erro ao gerar relatório completo:", err);
    return res.status(500).json({ erro: "Erro ao gerar relatório completo" });
  }
}

module.exports = {
  resumoFinanceiro,
  inadimplentes,
  faturamentoPorTurma,
  relatorioCompleto,
};
