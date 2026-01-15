import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import Toast from "../components/Toast";
import AdminOnly from "../components/AdminOnly";

export default function Pagamentos() {
  const [pagamentos, setPagamentos] = useState([]);
  const [alunas, setAlunas] = useState([]);
  const [turmas, setTurmas] = useState([]);

  const [alunaId, setAlunaId] = useState("");
  const [turmaId, setTurmaId] = useState("");
  const [mes, setMes] = useState("");
  const [ano, setAno] = useState("");
  const [valor, setValor] = useState("");

  const [mesGerar, setMesGerar] = useState("");
  const [anoGerar, setAnoGerar] = useState("");
  const [turmaGerar, setTurmaGerar] = useState("");
  const [valorGerar, setValorGerar] = useState("");

  const [fMes, setFMes] = useState("");
  const [fAno, setFAno] = useState("");
  const [fTurma, setFTurma] = useState("");
  const [fStatus, setFStatus] = useState("");

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

  function turmaLabel(t) {
    return `${t.nome} — ${t.dia_semana} ${t.horario}`;
  }

  function carregarPagamentos(filtros = {}) {
    api
      .get("/pagamentos", { params: filtros })
      .then((res) => setPagamentos(res.data))
      .catch(() => showToast("Erro ao carregar pagamentos", "error"));
  }

  useEffect(() => {
    carregarPagamentos();

    api
      .get("/alunas")
      .then((res) => setAlunas(res.data))
      .catch(() => showToast("Erro ao carregar alunas", "error"));

    api
      .get("/turmas")
      .then((res) => setTurmas(res.data))
      .catch(() => showToast("Erro ao carregar turmas", "error"));
  }, []);

  function formatMoney(v) {
    const n = Number(v) || 0;
    return n.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function valorExibicao(p) {
    if (p.valor_final !== undefined && p.valor_final !== null)
      return p.valor_final;
    return p.valor;
  }

  const resumo = useMemo(() => {
    const totalRegistros = pagamentos.length;

    let totalPago = 0;
    let totalPendente = 0;

    for (const p of pagamentos) {
      const val = Number(valorExibicao(p)) || 0;
      if (p.pago) totalPago += val;
      else totalPendente += val;
    }

    return {
      totalRegistros,
      totalPago,
      totalPendente,
      totalGeral: totalPago + totalPendente,
    };
  }, [pagamentos]);

  function criarPagamento(e) {
    e.preventDefault();

    if (!alunaId || !turmaId || !mes || !ano || !valor) {
      showToast("Preencha todos os campos", "warning");
      return;
    }

    api
      .post("/pagamentos", {
        aluna_id: alunaId,
        turma_id: turmaId,
        mes: Number(mes),
        ano: Number(ano),
        valor: Number(valor),
      })
      .then(() => {
        setAlunaId("");
        setTurmaId("");
        setMes("");
        setAno("");
        setValor("");
        carregarPagamentos();
        showToast("Pagamento manual criado", "success");
      })
      .catch((err) => {
        const msg =
          err?.response?.data?.erro ||
          err?.response?.data?.message ||
          "Erro ao criar pagamento";
        showToast(msg, "error");
      });
  }

  function gerarMensalidades(e) {
    e.preventDefault();

    if (!mesGerar || !anoGerar) {
      showToast("Preencha mês e ano para gerar mensalidades", "warning");
      return;
    }

    const payload = {
      mes: Number(mesGerar),
      ano: Number(anoGerar),
    };

    if (turmaGerar) payload.turma_id = Number(turmaGerar);
    if (valorGerar) payload.valor_override = Number(valorGerar);

    showToast("Gerando mensalidades...", "warning");

    api
      .post("/pagamentos/gerar", payload)
      .then((res) => {
        const qtd = res?.data?.quantidade ?? 0;

        const turmaNome =
          res?.data?.turma_nome ||
          (turmaGerar ? `turma #${turmaGerar}` : "todas as turmas");
        const extra = valorGerar
          ? ` | valor override: ${formatMoney(valorGerar)}`
          : "";

        showToast(
          `Mensalidades geradas. Criadas: ${qtd} (${res.data.mes}/${res.data.ano}) | ${turmaNome}${extra}`,
          "success"
        );

        setMesGerar("");
        setAnoGerar("");
        setTurmaGerar("");
        setValorGerar("");

        carregarPagamentos();
      })
      .catch((err) => {
        const msg =
          err?.response?.data?.erro ||
          err?.response?.data?.message ||
          "Erro ao gerar mensalidades";
        showToast(msg, "error");
      });
  }

  function marcarComoPago(id) {
    showToast("Marcando como pago...", "warning");

    api
      .put(`/pagamentos/${id}/pagar`)
      .then(() => {
        carregarPagamentos();
        showToast("Pagamento marcado como pago", "success");
      })
      .catch(() => showToast("Erro ao marcar como pago", "error"));
  }

  function desfazerPagamento(id) {
    const ok = window.confirm("Deseja desfazer esse pagamento?");
    if (!ok) return;

    showToast("Desfazendo pagamento...", "warning");

    api
      .put(`/pagamentos/${id}/desfazer`)
      .then(() => {
        carregarPagamentos();
        showToast("Pagamento desfeito", "success");
      })
      .catch((err) => {
        const msg =
          err?.response?.data?.erro ||
          err?.response?.data?.message ||
          "Erro ao desfazer pagamento";
        showToast(msg, "error");
      });
  }

  function excluirPagamento(id) {
    const ok = window.confirm("Tem certeza que deseja excluir esse pagamento?");
    if (!ok) return;

    showToast("Excluindo pagamento...", "warning");

    api
      .delete(`/pagamentos/${id}`)
      .then(() => {
        carregarPagamentos();
        showToast("Pagamento excluído", "success");
      })
      .catch((err) => {
        const msg =
          err?.response?.data?.erro ||
          err?.response?.data?.message ||
          "Erro ao excluir pagamento";
        showToast(msg, "error");
      });
  }

  function atualizarMetodo(pagamentoId, novoMetodo) {
    showToast("Atualizando modalidade...", "warning");

    api
      .put(`/pagamentos/${pagamentoId}/metodo`, {
        metodo_pagamento: novoMetodo,
      })
      .then((res) => {
        const atualizado = res.data;

        setPagamentos((prev) =>
          prev.map((p) => (p.id === pagamentoId ? { ...p, ...atualizado } : p))
        );

        showToast("Modalidade atualizada", "success");
      })
      .catch((err) => {
        const msg =
          err?.response?.data?.erro ||
          err?.response?.data?.message ||
          "Erro ao atualizar modalidade";
        showToast(msg, "error");
      });
  }

  function aplicarFiltros() {
    const filtros = {};
    if (fMes) filtros.mes = Number(fMes);
    if (fAno) filtros.ano = Number(fAno);
    if (fTurma) filtros.turma_id = Number(fTurma);
    if (fStatus) filtros.status = fStatus;

    carregarPagamentos(filtros);

    const resumoTexto = `${fMes || "Todos"}/${fAno || "Todos"}${
      fTurma ? ` | turma #${fTurma}` : ""
    }${fStatus ? ` | ${fStatus}` : ""}`;

    showToast(`Filtro aplicado (${resumoTexto})`, "success");
  }

  function limparFiltros() {
    setFMes("");
    setFAno("");
    setFTurma("");
    setFStatus("");
    carregarPagamentos();
    showToast("Filtros limpos", "success");
  }

  return (
    <div className="page-crud">
      <div className="pagamentos-topbar">
        <h1>Pagamentos</h1>

        <button
          type="button"
          onClick={() => setModalAjuda(true)}
          className="pagamentos-btn-ajuda"
        >
          Ajuda
        </button>
      </div>

      <div className="card pagamentos-filtros">
        <h2>Filtros</h2>

        <div className="pagamentos-filtros-row">
          <input
            type="number"
            placeholder="Mês"
            value={fMes}
            onChange={(e) => setFMes(e.target.value)}
            className="pagamentos-input-mes"
          />

          <input
            type="number"
            placeholder="Ano"
            value={fAno}
            onChange={(e) => setFAno(e.target.value)}
            className="pagamentos-input-ano"
          />

          <select
            value={fTurma}
            onChange={(e) => setFTurma(e.target.value)}
            className="pagamentos-select-turma"
          >
            <option value="">Todas as turmas</option>
            {turmas.map((t) => (
              <option key={t.id} value={t.id}>
                {turmaLabel(t)}
              </option>
            ))}
          </select>

          <select
            value={fStatus}
            onChange={(e) => setFStatus(e.target.value)}
            className="pagamentos-select-status"
          >
            <option value="">Todos</option>
            <option value="pendente">Pendentes</option>
            <option value="pago">Pagos</option>
          </select>

          <button onClick={aplicarFiltros}>Filtrar</button>
          <button onClick={limparFiltros}>Limpar</button>
        </div>
      </div>

      <AdminOnly>
        <div className="card pagamentos-gerar">
          <h2>Gerar mensalidades do mês</h2>

          <form onSubmit={gerarMensalidades} className="pagamentos-gerar-form">
            <input
              type="number"
              placeholder="Mês (1 a 12)"
              value={mesGerar}
              onChange={(e) => setMesGerar(e.target.value)}
              className="pagamentos-gerar-mes"
            />

            <input
              type="number"
              placeholder="Ano (ex: 2026)"
              value={anoGerar}
              onChange={(e) => setAnoGerar(e.target.value)}
              className="pagamentos-gerar-ano"
            />

            <select
              value={turmaGerar}
              onChange={(e) => setTurmaGerar(e.target.value)}
              className="pagamentos-gerar-turma"
            >
              <option value="">Todas as turmas</option>
              {turmas.map((t) => (
                <option key={t.id} value={t.id}>
                  {turmaLabel(t)}
                </option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Valor diferente (opcional)"
              value={valorGerar}
              onChange={(e) => setValorGerar(e.target.value)}
              className="pagamentos-gerar-valor"
            />

            <button type="submit">Gerar mensalidades</button>
          </form>

          <p className="pagamentos-gerar-dica">
            Se preencher “valor diferente”, todas as mensalidades geradas neste
            mês usarão esse valor.
          </p>
        </div>
      </AdminOnly>

      <AdminOnly>
        <div className="card pagamentos-manual">
          <h2>Novo Pagamento (Manual)</h2>

          <form onSubmit={criarPagamento}>
            <select
              value={alunaId}
              onChange={(e) => setAlunaId(e.target.value)}
            >
              <option value="">Selecione a aluna</option>
              {alunas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome}
                </option>
              ))}
            </select>

            <select
              value={turmaId}
              onChange={(e) => setTurmaId(e.target.value)}
            >
              <option value="">Selecione a turma</option>
              {turmas.map((t) => (
                <option key={t.id} value={t.id}>
                  {turmaLabel(t)}
                </option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Mês (1 a 12)"
              value={mes}
              onChange={(e) => setMes(e.target.value)}
            />

            <input
              type="number"
              placeholder="Ano (ex: 2026)"
              value={ano}
              onChange={(e) => setAno(e.target.value)}
            />

            <input
              type="number"
              placeholder="Valor (R$)"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
            />

            <button type="submit">Salvar pagamento</button>
          </form>
        </div>
      </AdminOnly>

      <div className="card pagamentos-resumo">
        <h2>Resumo do período</h2>

        <div className="pagamentos-resumo-grid">
          <div className="pagamentos-resumo-item">
            <div className="pagamentos-resumo-label">Registros</div>
            <div className="pagamentos-resumo-value">
              {resumo.totalRegistros}
            </div>
          </div>

          <div className="pagamentos-resumo-item">
            <div className="pagamentos-resumo-label">Total pago</div>
            <div className="pagamentos-resumo-value">
              {formatMoney(resumo.totalPago)}
            </div>
          </div>

          <div className="pagamentos-resumo-item">
            <div className="pagamentos-resumo-label">Total pendente</div>
            <div className="pagamentos-resumo-value">
              {formatMoney(resumo.totalPendente)}
            </div>
          </div>

          <div className="pagamentos-resumo-item">
            <div className="pagamentos-resumo-label">Total geral</div>
            <div className="pagamentos-resumo-value">
              {formatMoney(resumo.totalGeral)}
            </div>
          </div>
        </div>

        <p className="pagamentos-resumo-dica">
          Esse resumo muda automaticamente conforme o filtro aplicado.
        </p>
      </div>

      {pagamentos.length === 0 ? (
        <p>Nenhum pagamento registrado</p>
      ) : (
        <div className="card pagamentos-tabela">
          <table>
            <thead>
              <tr>
                <th>Aluna</th>
                <th>Turma</th>
                <th>Mês</th>
                <th>Ano</th>
                <th>Modalidade</th>
                <th>Valor</th>
                <th>Status</th>
                <th>Pago em</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
              {pagamentos.map((p) => (
                <tr key={p.id}>
                  <td>{p.aluna}</td>
                  <td>{p.turma}</td>
                  <td>{p.mes}</td>
                  <td>{p.ano}</td>

                  <td>
                    <AdminOnly
                      fallback={<span>{p.metodo_pagamento || "pix"}</span>}
                    >
                      <select
                        value={p.metodo_pagamento || "pix"}
                        onChange={(e) => atualizarMetodo(p.id, e.target.value)}
                      >
                        <option value="pix">Pix</option>
                        <option value="dinheiro">Dinheiro</option>
                        <option value="cartao">Cartão</option>
                      </select>
                    </AdminOnly>
                  </td>

                  <td>{formatMoney(valorExibicao(p))}</td>
                  <td>{p.pago ? "Pago" : "Pendente"}</td>

                  <td>
                    {p.data_pagamento
                      ? new Date(p.data_pagamento).toLocaleDateString()
                      : "-"}
                  </td>

                  <td>
                    <AdminOnly fallback={<span>Somente leitura</span>}>
                      <div className="pagamentos-acoes">
                        {!p.pago ? (
                          <button onClick={() => marcarComoPago(p.id)}>
                            Marcar como pago
                          </button>
                        ) : (
                          <button onClick={() => desfazerPagamento(p.id)}>
                            Desfazer pagamento
                          </button>
                        )}

                        <button onClick={() => excluirPagamento(p.id)}>
                          Excluir
                        </button>
                      </div>
                    </AdminOnly>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="pagamentos-tabela-dica">
            Dinheiro aplica desconto automaticamente.
          </p>
        </div>
      )}

      {modalAjuda && (
        <div
          onClick={() => setModalAjuda(false)}
          className="modal-overlay modal-overlay-ajuda"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="card modal-content modal-content-ajuda"
          >
            <h2>Ajuda - Pagamentos</h2>

            <p className="pagamentos-ajuda-texto">
              Essa tela mostra quem pagou e quem está pendente. Também é
              possível gerar mensalidades automaticamente.
            </p>

            <div className="pagamentos-ajuda-grid">
              <div className="pagamentos-ajuda-item">
                <b>Filtros</b>
                <p>Informe mês/ano e (se quiser) turma/status para filtrar.</p>
              </div>

              <AdminOnly>
                <div className="pagamentos-ajuda-item">
                  <b>Gerar mensalidades</b>
                  <p>
                    Use no início do mês para criar automaticamente os registros
                    de pagamento.
                  </p>
                </div>

                <div className="pagamentos-ajuda-item">
                  <b>Pagamento manual</b>
                  <p>Use quando precisar registrar um pagamento específico.</p>
                </div>

                <div className="pagamentos-ajuda-item">
                  <b>Ações</b>
                  <p>
                    Admin pode marcar como pago/desfazer/excluir e alterar a
                    modalidade.
                  </p>
                </div>
              </AdminOnly>

              <div className="pagamentos-ajuda-box">
                <b>Contadora</b>
                <p>A contadora tem acesso somente para consulta.</p>
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
