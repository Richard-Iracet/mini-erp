import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import Toast from "../components/Toast";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export default function Relatorios() {
  const [resumo, setResumo] = useState(null);
  const [inadimplentes, setInadimplentes] = useState([]);
  const [completo, setCompleto] = useState(null);

  const [mes, setMes] = useState("");
  const [ano, setAno] = useState("");
  const [loading, setLoading] = useState(false);

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  function showToast(message, type = "success") {
    setToast({ show: true, message, type });
  }

  function hideToast() {
    setToast((t) => ({ ...t, show: false }));
  }

  function formatMoney(v) {
    const n = Number(v) || 0;
    return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function nomeMes(m) {
    const meses = [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
    ];
    return meses[m - 1] || `Mês ${m}`;
  }

  function periodoTexto() {
    const m = Number(mes);
    const a = Number(ano);
    if (!m || !a) return "";
    return `${nomeMes(m)}/${a}`;
  }

  async function buscarRelatorios() {
    if (!mes || !ano) {
      showToast("Preencha mês e ano", "warning");
      return;
    }

    setLoading(true);
    showToast("Buscando relatórios...", "warning");

    try {
      const params = { mes: Number(mes), ano: Number(ano) };

      const [resFinanceiro, resInadimplentes, resCompleto] = await Promise.all([
        api.get(`/relatorios/financeiro`, { params }),
        api.get(`/relatorios/inadimplentes`, { params }),
        api.get(`/relatorios/completo`, { params }),
      ]);

      setResumo(resFinanceiro.data);
      setInadimplentes(resInadimplentes.data);
      setCompleto(resCompleto.data);

      showToast(`Relatórios carregados (${periodoTexto()})`, "success");
    } catch (err) {
      console.error(err);
      showToast("Erro ao carregar relatórios", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const hoje = new Date();
    setMes(String(hoje.getMonth() + 1));
    setAno(String(hoje.getFullYear()));
  }, []);

  const pieData = resumo
    ? [
        { name: "Pago", value: Number(resumo.total_pago) || 0 },
        { name: "Pendente", value: Number(resumo.total_pendente) || 0 },
      ]
    : [];

  const colors = ["#D16BA5", "#F0A6C2"];

  const metricas = useMemo(() => {
    if (!resumo) return null;

    const cobrado = Number(resumo.total_cobrado) || 0;
    const pago = Number(resumo.total_pago) || 0;
    const pendente = Number(resumo.total_pendente) || 0;

    return {
      cobrado,
      pago,
      pendente,
      taxaInad: cobrado > 0 ? (pendente / cobrado) * 100 : 0,
    };
  }, [resumo]);

  function exportarCSV(filename, rows) {
    if (!rows || rows.length === 0) {
      showToast("Nada para exportar", "warning");
      return;
    }

    const header = Object.keys(rows[0]);
    const csv = [
      header.join(";"),
      ...rows.map((r) =>
        header
          .map((h) => {
            const val = r[h] ?? "";
            return String(val).replaceAll(";", ",");
          })
          .join(";")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("CSV exportado", "success");
  }

  function exportarRelatorioCompletoCSV() {
  if (!completo?.registros || completo.registros.length === 0) {
    showToast("Nenhum registro no relatório completo", "warning");
    return;
  }
  const registrosOrdenados = [...completo.registros].sort((a, b) => {
    if (!a.data_pagamento && !b.data_pagamento) return 0;
    if (!a.data_pagamento) return 1; // sem data vai pro final
    if (!b.data_pagamento) return -1;

    return new Date(a.data_pagamento) - new Date(b.data_pagamento);
  });

  const rows = registrosOrdenados.map((r) => ({
    pagamento_id: r.pagamento_id,
    mes: r.mes,
    ano: r.ano,
    status: r.pago ? "Pago" : "Pendente",
    data_pagamento: r.data_pagamento
      ? new Date(r.data_pagamento).toLocaleDateString("pt-BR")
      : "",
    metodo_pagamento: r.metodo_pagamento || "",

    valor_original: r.valor_original,
    desconto_modalidade: r.desconto_modalidade,
    desconto_irmaos: r.desconto_irmaos,
    valor_final: r.valor_final,

    turma: r.turma_nome,
    turma_dia: r.dia_semana,
    turma_horario: r.horario,

    aluna: r.aluna_nome,
    aluna_ativa: r.aluna_ativa ? "Ativa" : "Inativa",

    responsavel: r.responsavel_nome || "",
    responsavel_cpf: r.responsavel_cpf || "",
    responsavel_telefone1: r.responsavel_telefone1 || "",
    responsavel_telefone2: r.responsavel_telefone2 || "",
    responsavel_email: r.responsavel_email || "",
    responsavel_endereco: r.responsavel_endereco || "",
    responsavel_bairro: r.responsavel_bairro || "",
    responsavel_municipio: r.responsavel_municipio || "",
    responsavel_estado: r.responsavel_estado || "",
    responsavel_cep: r.responsavel_cep || "",
  }));

  exportarCSV(`relatorio_completo_${mes}-${ano}.csv`, rows);
}

  function exportarRelatorioCompletoPDF() {
    if (!completo?.registros || completo.registros.length === 0) {
      showToast("Nenhum registro no relatório completo", "warning");
      return;
    }

    const doc = new jsPDF("l", "mm", "a4");
    const periodo = periodoTexto();

    doc.setFontSize(16);
    doc.text("Relatório Completo do Mês", 14, 16);

    doc.setFontSize(11);
    doc.text(`Período: ${periodo}`, 14, 24);

    doc.text(
      `Total: ${completo.total_registros} | Pago: ${formatMoney(
        completo.total_pago
      )} | Pendente: ${formatMoney(completo.total_pendente)}`,
      14,
      31
    );

    const body = completo.registros.map((r) => [
      r.pago ? "Pago" : "Pendente",
      r.data_pagamento
        ? new Date(r.data_pagamento).toLocaleDateString("pt-BR")
        : "-",
      r.metodo_pagamento || "-",
      r.responsavel_nome || "Sem responsável",
      r.responsavel_cpf || "-",
      r.responsavel_telefone1 || "-",
      r.aluna_nome || "-",
      r.turma_nome || "-",
      formatMoney(r.valor_final),
    ]);

    autoTable(doc, {
      startY: 38,
      head: [
        [
          "Status",
          "Pago em",
          "Método",
          "Responsável",
          "CPF",
          "Telefone",
          "Aluna",
          "Turma",
          "Valor",
        ],
      ],
      body,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [209, 107, 165] },
      columnStyles: {
        0: { cellWidth: 18 },
        1: { cellWidth: 20 },
        2: { cellWidth: 20 },
        3: { cellWidth: 45 },
        4: { cellWidth: 24 },
        5: { cellWidth: 28 },
        6: { cellWidth: 40 },
        7: { cellWidth: 35 },
        8: { cellWidth: 20 },
      },
    });

    doc.save(`relatorio_completo_${mes}-${ano}.pdf`);
    showToast("PDF completo gerado", "success");
  }

  function exportarFinanceiroPDF() {
    if (!metricas) {
      showToast("Nenhum resumo carregado", "warning");
      return;
    }

    const doc = new jsPDF();
    const periodo = periodoTexto();

    doc.setFontSize(16);
    doc.text("Relatório Financeiro", 14, 18);

    doc.setFontSize(11);
    doc.text(`Período: ${periodo}`, 14, 26);

    autoTable(doc, {
      startY: 32,
      head: [["Campo", "Valor"]],
      body: [
        ["Total Cobrado", formatMoney(metricas.cobrado)],
        ["Total Pago", formatMoney(metricas.pago)],
        ["Total Pendente", formatMoney(metricas.pendente)],
        ["Taxa de inadimplência", `${metricas.taxaInad.toFixed(1)}%`],
      ],
    });

    doc.save(`financeiro_${mes}-${ano}.pdf`);
    showToast("PDF financeiro gerado", "success");
  }

  function exportarFinanceiroCSV() {
    if (!metricas) {
      showToast("Nenhum resumo carregado", "warning");
      return;
    }

    exportarCSV(`financeiro_${mes}-${ano}.csv`, [
      {
        mes,
        ano,
        total_cobrado: metricas.cobrado,
        total_pago: metricas.pago,
        total_pendente: metricas.pendente,
        taxa_inadimplencia: `${metricas.taxaInad.toFixed(1)}%`,
      },
    ]);
  }

  function exportarInadimplentesPDF() {
    if (!inadimplentes || inadimplentes.length === 0) {
      showToast("Nenhum inadimplente no período", "warning");
      return;
    }

    const doc = new jsPDF("p", "mm", "a4");
    const periodo = periodoTexto();

    doc.setFontSize(16);
    doc.text("Relatório de Inadimplentes", 14, 18);

    doc.setFontSize(11);
    doc.text(`Período: ${periodo}`, 14, 26);
    doc.text(`Total: ${inadimplentes.length}`, 14, 32);

    autoTable(doc, {
      startY: 38,
      head: [["Responsável", "Telefone", "Aluna", "Turma", "Valor"]],
      body: inadimplentes.map((i) => [
        i.responsavel || "-",
        i.telefone || "-",
        i.aluna || "-",
        i.turma || "-",
        formatMoney(i.valor),
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [209, 107, 165] },
    });

    doc.save(`inadimplentes_${mes}-${ano}.pdf`);
    showToast("PDF inadimplentes gerado", "success");
  }

  function exportarInadimplentesCSV() {
    if (!inadimplentes || inadimplentes.length === 0) {
      showToast("Nenhum inadimplente no período", "warning");
      return;
    }

    const rows = inadimplentes.map((i) => ({
      responsavel: i.responsavel || "",
      telefone: i.telefone || "",
      aluna: i.aluna,
      turma: i.turma,
      valor: i.valor,
    }));

    exportarCSV(`inadimplentes_${mes}-${ano}.csv`, rows);
  }

 function exportarRelatorioCompletoExcel() {
  if (!completo?.registros || completo.registros.length === 0) {
    showToast("Nenhum registro no relatório completo", "warning");
    return;
  }

  const registrosOrdenados = [...completo.registros].sort((a, b) => {

    const prioridadeMetodo = (r) => {
      if (!r.pago) return 3;

      const metodo = (r.metodo_pagamento || "").toLowerCase();

      if (metodo.includes("pix")) return 1;
      if (metodo.includes("dinheiro")) return 2;

      return 2;
    };

    const pa = prioridadeMetodo(a);
    const pb = prioridadeMetodo(b);

    if (pa !== pb) return pa - pb;

    const da = a.data_pagamento ? new Date(a.data_pagamento).getTime() : Infinity;
    const db = b.data_pagamento ? new Date(b.data_pagamento).getTime() : Infinity;

    return da - db;
  });

  const linhas = registrosOrdenados.map((r) => ([
    r.pago ? "Pago" : "Pendente",
    r.data_pagamento ? new Date(r.data_pagamento) : "",
    r.metodo_pagamento || "",
    r.responsavel_nome || "",
    r.responsavel_cpf || "",
    r.responsavel_telefone1 || "",
    r.aluna_nome || "",
    r.turma_nome || "",
    Number(r.valor_final) || 0,
  ]));

  const periodo = periodoTexto();

  const aoa = [
    ["Relatório Completo do Mês"],
    [`Período: ${periodo}`],
    [`Total: ${completo.total_registros} | Pago: ${formatMoney(completo.total_pago)} | Pendente: ${formatMoney(completo.total_pendente)}`],
    [],
    ["Status","Pago em","Método","Responsável","CPF","Telefone","Aluna","Turma","Valor"],
    ...linhas
  ];

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  ws["!merges"] = [
    { s:{r:0,c:0}, e:{r:0,c:8} },
    { s:{r:1,c:0}, e:{r:1,c:8} },
    { s:{r:2,c:0}, e:{r:2,c:8} }
  ];

  const headerRow = 5;
  const colunas = ["A","B","C","D","E","F","G","H","I"];

  colunas.forEach((col) => {
    const cell = ws[`${col}${headerRow}`];
    if (cell) {
      cell.s = {
        font:{ bold:true, color:{ rgb:"FFFFFF" }},
        fill:{ fgColor:{ rgb:"D16BA5" }},
        alignment:{ horizontal:"center", vertical:"center" }
      };
    }
  });

  ws["!freeze"] = { xSplit:0, ySplit:headerRow };

  ws["!autofilter"] = {
    ref:`A${headerRow}:I${headerRow}`
  };

  const range = XLSX.utils.decode_range(ws["!ref"]);

  for (let R = headerRow; R <= range.e.r; ++R) {

    const linhaExcel = R + 1;

    const valorCell = ws[`I${linhaExcel}`];
    if (valorCell) {
      valorCell.z = '"R$" #,##0.00';
      valorCell.s = { alignment:{ horizontal:"right" }};
    }

    const dataCell = ws[`B${linhaExcel}`];
    if (dataCell && dataCell.v instanceof Date) {
      dataCell.t = "d";
      dataCell.z = "dd/mm/yyyy";
      dataCell.s = { alignment:{ horizontal:"center" }};
    }

    if ((R - headerRow) % 2 === 1) {
      colunas.forEach(col=>{
        const c = ws[`${col}${linhaExcel}`];
        if (c) {
          c.s = {
            ...c.s,
            fill:{ fgColor:{ rgb:"F4F4F4" }}
          };
        }
      });
    }
  }

  ws["!cols"] = [
    { wch:12 },
    { wch:15 },
    { wch:16 },
    { wch:30 },
    { wch:18 },
    { wch:18 },
    { wch:28 },
    { wch:22 },
    { wch:14 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Relatório");

  XLSX.writeFile(wb, `relatorio_completo_${mes}-${ano}.xlsx`);

  showToast("Excel PROFISSIONAL exportado", "success");
}
  return (
    <div className="page-crud">
      <h1 className="relatorios-title">Relatórios</h1>

      <div className="card relatorios-filtro">
        <h2>Filtro</h2>

        <div className="relatorios-filtro-row">
          <input
            type="number"
            placeholder="Mês"
            value={mes}
            onChange={(e) => setMes(e.target.value)}
            className="relatorios-input-mes"
          />

          <input
            type="number"
            placeholder="Ano"
            value={ano}
            onChange={(e) => setAno(e.target.value)}
            className="relatorios-input-ano"
          />

          <button onClick={buscarRelatorios} disabled={loading}>
            {loading ? "Carregando..." : "Buscar"}
          </button>
        </div>

        {!!periodoTexto() && (
          <p className="relatorios-periodo">
            Consultando: <b>{periodoTexto()}</b>
          </p>
        )}
      </div>

      {metricas && (
        <div className="relatorios-metricas">
          <div className="card relatorios-metrica-card">
            <h2>Total Cobrado</h2>
            <p className="relatorios-metrica-value">
              {formatMoney(metricas.cobrado)}
            </p>
          </div>

          <div className="card relatorios-metrica-card">
            <h2>Total Pago</h2>
            <p className="relatorios-metrica-value relatorios-metrica-pago">
              {formatMoney(metricas.pago)}
            </p>
          </div>

          <div className="card relatorios-metrica-card">
            <h2>Total Pendente</h2>
            <p className="relatorios-metrica-value relatorios-metrica-pendente">
              {formatMoney(metricas.pendente)}
            </p>
          </div>

          <div className="card relatorios-metrica-card">
            <h2>Taxa inadimplência</h2>
            <p className="relatorios-metrica-value relatorios-metrica-taxa">
              {metricas.taxaInad.toFixed(1)}%
            </p>
          </div>
        </div>
      )}

      <div className="card relatorios-exportacao">
        <h2>Exportação</h2>

        <div className="relatorios-exportacao-row">
          <button onClick={exportarFinanceiroCSV} disabled={!resumo}>
            Financeiro (CSV)
          </button>
          <button onClick={exportarFinanceiroPDF} disabled={!resumo}>
            Financeiro (PDF)
          </button>

          <button
            onClick={exportarInadimplentesCSV}
            disabled={!inadimplentes || inadimplentes.length === 0}
          >
            Inadimplentes (CSV)
          </button>
          <button
            onClick={exportarInadimplentesPDF}
            disabled={!inadimplentes || inadimplentes.length === 0}
          >
            Inadimplentes (PDF)
          </button>

          <button
            onClick={exportarRelatorioCompletoCSV}
            disabled={!completo?.registros || completo.registros.length === 0}
          >
            Relatório Completo (CSV)
          </button>
          <button
            onClick={exportarRelatorioCompletoPDF}
            disabled={!completo?.registros || completo.registros.length === 0}
          >
            Relatório Completo (PDF)
          </button>
          <button
  onClick={exportarRelatorioCompletoExcel}
  disabled={!completo?.registros || completo.registros.length === 0}
>
  Relatório Completo (Excel)
</button>
        </div>

        <p className="relatorios-exportacao-dica">
          O relatório completo é o recomendado para a contadora.
        </p>
      </div>

      {resumo && (
        <div className="card relatorios-grafico">
          <h2>Pagamentos — {periodoTexto()}</h2>

          {pieData.every((p) => p.value === 0) ? (
            <p className="relatorios-empty">
              Nenhum pagamento registrado neste período.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={110}
                  label
                >
                  {pieData.map((_, index) => (
                    <Cell key={index} fill={colors[index]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      <div className="card relatorios-inadimplentes">
        <h2>Inadimplentes — {periodoTexto()}</h2>

        {inadimplentes.length === 0 ? (
          <p className="relatorios-empty">Nenhuma inadimplência</p>
        ) : (
          <table className="relatorios-table">
            <thead>
              <tr>
                <th>Responsável</th>
                <th>Telefone</th>
                <th>Aluna</th>
                <th>Turma</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              {inadimplentes.map((i, index) => (
                <tr key={index}>
                  <td>{i.responsavel || "-"}</td>
                  <td>{i.telefone || "-"}</td>
                  <td>{i.aluna}</td>
                  <td>{i.turma}</td>
                  <td>{formatMoney(i.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
      />
    </div>
  );
}
