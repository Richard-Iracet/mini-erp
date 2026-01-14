import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  const [resumo, setResumo] = useState(null);
  const [completo, setCompleto] = useState(null);

  const [alunas, setAlunas] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [responsaveis, setResponsaveis] = useState([]);

  const [loading, setLoading] = useState(true);

  const hoje = useMemo(() => new Date(), []);
  const mes = hoje.getMonth() + 1;
  const ano = hoje.getFullYear();

  useEffect(() => {
    let ativo = true;

    async function carregarDashboard() {
      try {
        setLoading(true);

        const [resFinanceiro, resCompleto, resAlunas, resTurmas, resResp] =
          await Promise.all([
            api.get("/relatorios/financeiro", { params: { mes, ano } }),
            api.get("/relatorios/completo", { params: { mes, ano } }),
            api.get("/alunas"),
            api.get("/turmas"),
            api.get("/responsaveis"),
          ]);

        if (!ativo) return;

        setResumo(resFinanceiro.data);
        setCompleto(resCompleto.data);

        setAlunas(Array.isArray(resAlunas.data) ? resAlunas.data : []);
        setTurmas(Array.isArray(resTurmas.data) ? resTurmas.data : []);
        setResponsaveis(Array.isArray(resResp.data) ? resResp.data : []);
      } catch (err) {
        console.error(err);
      } finally {
        if (ativo) setLoading(false);
      }
    }

    carregarDashboard();

    return () => {
      ativo = false;
    };
  }, [mes, ano]);

  function formatMoney(v) {
    const n = Number(v) || 0;
    return n.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
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

  const periodo = `${nomeMes(mes)}/${ano}`;

  const pieData = resumo
    ? [
        { name: "Pago", value: Number(resumo.total_pago) || 0 },
        { name: "Pendente", value: Number(resumo.total_pendente) || 0 },
      ]
    : [];

  const colors = ["#D16BA5", "#F0A6C2"];

  const operacional = useMemo(() => {
    const registros = completo?.registros;
    if (!Array.isArray(registros)) {
      return {
        qtd_total: 0,
        qtd_pago: 0,
        qtd_pendente: 0,
        total_pago: 0,
        total_pendente: 0,
      };
    }

    let qtd_pago = 0;
    let qtd_pendente = 0;
    let total_pago = 0;
    let total_pendente = 0;

    for (const r of registros) {
      const val = Number(r.valor_final ?? r.valor ?? 0);

      if (r.pago) {
        qtd_pago++;
        total_pago += val;
      } else {
        qtd_pendente++;
        total_pendente += val;
      }
    }

    return {
      qtd_total: registros.length,
      qtd_pago,
      qtd_pendente,
      total_pago,
      total_pendente,
    };
  }, [completo]);

  const topInadimplentes = useMemo(() => {
    const registros = completo?.registros;
    if (!Array.isArray(registros)) return [];

    const map = new Map();

    for (const r of registros) {
      if (r.pago) continue;

      const key = r.responsavel_id || `SEM_${r.aluna_id}`;

      if (!map.has(key)) {
        map.set(key, {
          responsavel: r.responsavel_nome || "Sem responsável",
          telefone: r.responsavel_telefone1 || r.responsavel_telefone2 || "-",
          total: 0,
          itens: [],
        });
      }

      const grupo = map.get(key);

      const valor = Number(r.valor_final ?? r.valor ?? 0);
      grupo.total += valor;

      grupo.itens.push({
        aluna: r.aluna_nome,
        turma: r.turma_nome,
        valor,
      });
    }

    return Array.from(map.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [completo]);

  function montarMensagemCobranca(grupo) {
    let msg =
      `Olá, ${grupo.responsavel}! Tudo bem?\n\n` +
      `Identificamos pendências no período ${periodo} referente às mensalidades abaixo:\n\n`;

    for (const item of grupo.itens) {
      msg += `• ${item.aluna} (${item.turma}) — ${formatMoney(item.valor)}\n`;
    }

    msg += `\nTotal pendente: ${formatMoney(
      grupo.total
    )}\n\nPode me confirmar o pagamento, por favor?\nObrigado!`;

    return msg;
  }

  async function copiarCobranca(grupo) {
    try {
      await navigator.clipboard.writeText(montarMensagemCobranca(grupo));
      alert("Cobrança copiada! Agora é só colar no WhatsApp.");
    } catch (err) {
      console.error(err);
      alert("Não consegui copiar automaticamente (navegador bloqueou).");
    }
  }

  const totalAlunasAtivas = useMemo(() => {
    return alunas.filter((a) => a.ativo !== false).length;
  }, [alunas]);

  return (
    <div className="page-dashboard">
      <h1>Dashboard</h1>

      <div className="card dashboard-welcome">
        <h2>Bem-vinda ao BiaBallet</h2>
        <p className="dashboard-welcome-text">
          Este painel foi pensado para facilitar o controle das alunas, turmas e
          pagamentos da escola.
          <br />
          <br />
          Use o menu ao lado para navegar entre as seções e acompanhar a saúde
          financeira do BiaBallet de forma simples e organizada.
        </p>
      </div>

      <div className="card dashboard-periodo">
        <h2>Período atual</h2>

        <p className="dashboard-periodo-text">
          Consultando automaticamente: <b>{periodo}</b>
        </p>

        {loading && <p className="dashboard-loading">Carregando painel...</p>}
      </div>

      <div className="dashboard-cards">
        <div className="card dashboard-card">
          <h2>Mensalidades</h2>
          <p className="dashboard-numero">{operacional.qtd_total}</p>
          <p className="dashboard-legenda">Total geradas no mês</p>
        </div>

        <div className="card dashboard-card">
          <h2>Pagas</h2>
          <p className="dashboard-numero dashboard-numero-pago">
            {operacional.qtd_pago}
          </p>
          <p className="dashboard-legenda">
            Total pago: <b>{formatMoney(operacional.total_pago)}</b>
          </p>
        </div>

        <div className="card dashboard-card">
          <h2>Pendentes</h2>
          <p className="dashboard-numero dashboard-numero-pendente">
            {operacional.qtd_pendente}
          </p>
          <p className="dashboard-legenda">
            Total pendente: <b>{formatMoney(operacional.total_pendente)}</b>
          </p>
        </div>
      </div>

      <div className="card dashboard-inadimplentes">
        <h2>Quem cobrar hoje (Top 5)</h2>

        {topInadimplentes.length === 0 ? (
          <p className="dashboard-empty">Nenhuma pendência no período.</p>
        ) : (
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Responsável</th>
                <th>Telefone</th>
                <th>Total pendente</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {topInadimplentes.map((g, idx) => (
                <tr key={idx}>
                  <td>{g.responsavel}</td>
                  <td>{g.telefone}</td>
                  <td>
                    <b>{formatMoney(g.total)}</b>
                  </td>
                  <td>
                    <button onClick={() => copiarCobranca(g)}>
                      Copiar cobrança
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <p className="dashboard-dica">Dica: copie e cole direto no WhatsApp.</p>
      </div>

      <div className="card dashboard-resumo">
        <h2>Resumo do sistema</h2>

        <div className="dashboard-resumo-grid">
          <div className="dashboard-resumo-item">
            <div className="dashboard-resumo-label">Alunas ativas</div>
            <div className="dashboard-resumo-value">{totalAlunasAtivas}</div>
          </div>

          <div className="dashboard-resumo-item">
            <div className="dashboard-resumo-label">Turmas</div>
            <div className="dashboard-resumo-value">{turmas.length}</div>
          </div>

          <div className="dashboard-resumo-item">
            <div className="dashboard-resumo-label">Responsáveis</div>
            <div className="dashboard-resumo-value">{responsaveis.length}</div>
          </div>
        </div>

        <p className="dashboard-dica">
          Esse resumo é útil para conferência geral (contadora).
        </p>
      </div>

      <div className="card dashboard-grafico">
        <h2>Pagamentos do mês</h2>

        {!resumo ? (
          <p className="dashboard-grafico-msg">Carregando gráfico...</p>
        ) : pieData.every((p) => p.value === 0) ? (
          <p className="dashboard-grafico-msg">
            Nenhum pagamento registrado neste mês.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                outerRadius={80}
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
    </div>
  );
}
