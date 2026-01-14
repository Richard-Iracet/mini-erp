import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import Toast from "../components/Toast";

export default function Inadimplentes() {
  const [mes, setMes] = useState("");
  const [ano, setAno] = useState("");
  const [dados, setDados] = useState(null);

  const [detalheAberto, setDetalheAberto] = useState(false);
  const [grupoSelecionado, setGrupoSelecionado] = useState(null);

  const [modalAjuda, setModalAjuda] = useState(false);

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

  function formatMoney(valor) {
    const n = Number(valor) || 0;
    return n.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  const periodoTexto = useMemo(() => {
    const m = Number(mes);
    const a = Number(ano);
    if (!m || !a) return "";
    return `${nomeMes(m)}/${a}`;
  }, [mes, ano]);

  const grupos = useMemo(() => {
    if (!dados?.inadimplentes) return [];

    const map = new Map();

    for (const item of dados.inadimplentes) {
      const key = item.responsavel_id || "SEM_RESP";

      if (!map.has(key)) {
        map.set(key, {
          responsavel_id: item.responsavel_id,
          responsavel_nome: item.responsavel_nome || "Sem responsável",
          telefone1: item.responsavel_telefone1 || "",
          telefone2: item.responsavel_telefone2 || "",
          itens: [],
          totalValor: 0,
        });
      }

      const grupo = map.get(key);
      grupo.itens.push(item);
      grupo.totalValor += Number(item.valor) || 0;
    }

    return Array.from(map.values()).sort((a, b) =>
      a.responsavel_nome.localeCompare(b.responsavel_nome)
    );
  }, [dados]);

  function montarMensagemResponsavel(grupo) {
    const responsavel = grupo.responsavel_nome || "Responsável";
    const periodo = periodoTexto || `${mes}/${ano}`;

    let msg =
      `Olá, *${responsavel}*! Tudo bem?\n\n` +
      `Identificamos pendências no período *${periodo}* referente às mensalidades abaixo:\n\n`;

    for (const item of grupo.itens) {
      const aluna = item.aluna_nome || "";
      const turma = item.turma_nome || "";
      const valor = formatMoney(item.valor);

      msg += `• ${aluna} (${turma}) — *${valor}*\n`;
    }

    msg +=
      `\nTotal pendente: *${formatMoney(grupo.totalValor)}*\n\n` +
      `Pode me confirmar o pagamento, por favor?\nObrigado!`;

    return msg;
  }

  async function copiarMensagemResponsavel(grupo) {
    const msg = montarMensagemResponsavel(grupo);

    try {
      await navigator.clipboard.writeText(msg);
      showToast("Cobrança copiada! Agora é só colar no WhatsApp.", "success");
    } catch (err) {
      console.error(err);
      showToast("Não consegui copiar. Seu navegador bloqueou.", "error");
    }
  }

  function abrirDetalhes(grupo) {
    setGrupoSelecionado(grupo);
    setDetalheAberto(true);
  }

  function fecharDetalhes() {
    setDetalheAberto(false);
    setGrupoSelecionado(null);
  }

  async function buscar() {
    if (!mes || !ano) {
      showToast("Preencha mês e ano para consultar", "warning");
      return;
    }

    try {
      const res = await api.get("/pagamentos/inadimplentes", {
        params: { mes: Number(mes), ano: Number(ano) },
      });

      setDados(res.data);
    } catch (err) {
      console.error(err);
      showToast(
        err?.response?.data?.erro || "Erro ao buscar inadimplentes",
        "error"
      );
    }
  }

  useEffect(() => {
    const hoje = new Date();
    setMes(String(hoje.getMonth() + 1));
    setAno(String(hoje.getFullYear()));
  }, []);

  return (
    <div className="page-crud">
      <div className="inadimplentes-topbar">
        <h1>Inadimplentes</h1>

        <button
          type="button"
          onClick={() => setModalAjuda(true)}
          className="inadimplentes-btn-ajuda"
          title="Ajuda"
        >
          Ajuda
        </button>
      </div>

      <div className="card inadimplentes-filtros">
        <h2>Filtros</h2>

        <div className="inadimplentes-filtros-row">
          <input
            type="number"
            placeholder="Mês"
            value={mes}
            onChange={(e) => setMes(e.target.value)}
            className="inadimplentes-input-mes"
          />

          <input
            type="number"
            placeholder="Ano"
            value={ano}
            onChange={(e) => setAno(e.target.value)}
            className="inadimplentes-input-ano"
          />

          <button onClick={buscar}>Buscar</button>
        </div>

        {!!periodoTexto && (
          <p className="inadimplentes-periodo">
            Consultando: <b>{periodoTexto}</b>
          </p>
        )}
      </div>

      {!dados ? (
        <p>Informe mês e ano para consultar.</p>
      ) : dados.total === 0 ? (
        <p>
          Nenhum inadimplente no período {dados.mes}/{dados.ano}
        </p>
      ) : (
        <div className="card inadimplentes-resultados">
          <h2 className="inadimplentes-titulo-total">
            Total de inadimplentes: {dados.total} ({dados.mes}/{dados.ano})
          </h2>

          <table className="inadimplentes-table">
            <thead>
              <tr>
                <th>Responsável</th>
                <th>Telefone</th>
                <th>Pendências</th>
                <th>Total</th>
                <th className="inadimplentes-col-acoes">Ações</th>
              </tr>
            </thead>
            <tbody>
              {grupos.map((g) => (
                <tr key={g.responsavel_id || g.responsavel_nome}>
                  <td className="inadimplentes-responsavel">
                    {g.responsavel_nome}
                  </td>
                  <td>
                    {g.telefone1 || "-"}
                    {g.telefone2 ? ` / ${g.telefone2}` : ""}
                  </td>
                  <td>{g.itens.length}</td>
                  <td>{formatMoney(g.totalValor)}</td>
                  <td>
                    <div className="inadimplentes-acoes">
                      <button onClick={() => abrirDetalhes(g)}>
                        Ver detalhes
                      </button>
                      <button onClick={() => copiarMensagemResponsavel(g)}>
                        Copiar cobrança
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="inadimplentes-dica">
            Use “Ver detalhes” para ver as alunas e valores do responsável.
          </p>
        </div>
      )}

      {detalheAberto && grupoSelecionado && (
        <div className="modal-overlay" onClick={fecharDetalhes}>
          <div
            className="card modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <div className="inadimplentes-detalhe-titulo">
                  {grupoSelecionado.responsavel_nome}
                </div>
                <div className="inadimplentes-detalhe-telefone">
                  {grupoSelecionado.telefone1 || "-"}
                  {grupoSelecionado.telefone2
                    ? ` / ${grupoSelecionado.telefone2}`
                    : ""}
                </div>
              </div>

              <button onClick={fecharDetalhes} className="modal-close">
                ✕
              </button>
            </div>

            <div className="inadimplentes-detalhe-resumo">
              Período: <b>{periodoTexto}</b> <br />
              Pendências: <b>{grupoSelecionado.itens.length}</b> <br />
              Total: <b>{formatMoney(grupoSelecionado.totalValor)}</b>
            </div>

            <div className="inadimplentes-detalhe-tabela">
              <h3 className="inadimplentes-detalhe-subtitulo">
                Alunas / Turmas
              </h3>

              <table className="inadimplentes-table">
                <thead>
                  <tr>
                    <th>Aluna</th>
                    <th>Turma</th>
                    <th>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {grupoSelecionado.itens.map((x) => (
                    <tr key={x.pagamento_id}>
                      <td>{x.aluna_nome}</td>
                      <td>{x.turma_nome}</td>
                      <td>{formatMoney(x.valor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="modal-actions">
              <button
                onClick={() => copiarMensagemResponsavel(grupoSelecionado)}
              >
                Copiar cobrança completa
              </button>
              <button onClick={fecharDetalhes}>Fechar</button>
            </div>
          </div>
        </div>
      )}

      {modalAjuda && (
        <div
          className="modal-overlay modal-overlay-ajuda"
          onClick={() => setModalAjuda(false)}
        >
          <div
            className="card modal-content modal-content-ajuda"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <div className="inadimplentes-ajuda-titulo">
                  Ajuda — Inadimplentes
                </div>
                <div className="inadimplentes-ajuda-texto">
                  Aqui você consulta pendências e copia uma mensagem pronta para
                  enviar no WhatsApp.
                </div>
              </div>

              <button
                onClick={() => setModalAjuda(false)}
                className="modal-close"
              >
                ✕
              </button>
            </div>

            <div className="inadimplentes-ajuda-conteudo">
              <div className="inadimplentes-ajuda-item">
                <b>1) Buscar</b>
                <p>
                  Informe mês e ano e clique em <b>Buscar</b>.
                </p>
              </div>

              <div className="inadimplentes-ajuda-item">
                <b>2) Ver detalhes</b>
                <p>
                  Clique em <b>Ver detalhes</b> para ver alunas/turmas e o
                  total.
                </p>
              </div>

              <div className="inadimplentes-ajuda-item">
                <b>3) Copiar cobrança</b>
                <p>
                  Clique em <b>Copiar cobrança</b> e cole no WhatsApp.
                </p>
              </div>
            </div>

            <div className="modal-actions">
              <button onClick={() => setModalAjuda(false)}>Fechar</button>
            </div>
          </div>
        </div>
      )}

      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
      />
    </div>
  );
}
