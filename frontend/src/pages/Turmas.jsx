import { useEffect, useState } from "react";
import { api } from "../services/api";
import Toast from "../components/Toast";
import AdminOnly from "../components/AdminOnly";

export default function Turmas() {
  const [turmas, setTurmas] = useState([]);

  const [nome, setNome] = useState("");
  const [diaSemana, setDiaSemana] = useState("");
  const [horario, setHorario] = useState("");
  const [valorMensal, setValorMensal] = useState("");

  const [modalAlunas, setModalAlunas] = useState(false);
  const [turmaSelecionada, setTurmaSelecionada] = useState(null);
  const [alunasDaTurma, setAlunasDaTurma] = useState([]);

  const [modalEditar, setModalEditar] = useState(false);
  const [turmaEditando, setTurmaEditando] = useState(null);
  const [editNome, setEditNome] = useState("");
  const [editDiaSemana, setEditDiaSemana] = useState("");
  const [editHorario, setEditHorario] = useState("");
  const [editValorMensal, setEditValorMensal] = useState("");

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

  function carregarTurmas() {
    api
      .get("/turmas")
      .then((res) => setTurmas(res.data))
      .catch(() => showToast("Erro ao carregar turmas", "error"));
  }

  useEffect(() => {
    carregarTurmas();
  }, []);

  function limparFormNovaTurma() {
    setNome("");
    setDiaSemana("");
    setHorario("");
    setValorMensal("");
  }

  function criarTurma(e) {
    e.preventDefault();

    if (!nome || !diaSemana || !horario || !valorMensal) {
      showToast("Preencha todos os campos", "warning");
      return;
    }

    api
      .post("/turmas", {
        nome,
        dia_semana: diaSemana,
        horario,
        valor_mensal: Number(valorMensal),
      })
      .then(() => {
        limparFormNovaTurma();
        carregarTurmas();
        showToast("Turma cadastrada com sucesso", "success");
      })
      .catch((err) => {
        const msg =
          err?.response?.data?.erro ||
          err?.response?.data?.message ||
          "Erro ao criar turma";
        showToast(msg, "error");
      });
  }

  function abrirModalVerAlunas(turma) {
    setTurmaSelecionada(turma);
    setModalAlunas(true);
    setAlunasDaTurma([]);

    showToast("Carregando alunas da turma...", "warning");

    api
      .get(`/turmas/${turma.id}/alunas`)
      .then((res) => {
        setAlunasDaTurma(res.data);
        showToast("Lista de alunas carregada", "success");
      })
      .catch(() => showToast("Erro ao buscar alunas dessa turma", "error"));
  }

  function fecharModalVerAlunas() {
    setModalAlunas(false);
    setTurmaSelecionada(null);
    setAlunasDaTurma([]);
  }

  function abrirEditarTurma(turma) {
    setTurmaEditando(turma);

    setEditNome(turma.nome || "");
    setEditDiaSemana(turma.dia_semana || "");
    setEditHorario(turma.horario || "");
    setEditValorMensal(String(turma.valor_mensal ?? ""));

    setModalEditar(true);
  }

  function fecharEditarTurma() {
    setModalEditar(false);
    setTurmaEditando(null);
  }

  function salvarEdicao() {
    if (!turmaEditando) return;

    if (
      !editNome.trim() ||
      !editDiaSemana.trim() ||
      !editHorario.trim() ||
      !editValorMensal
    ) {
      showToast("Preencha todos os campos para editar", "warning");
      return;
    }

    showToast("Salvando alterações...", "warning");

    api
      .put(`/turmas/${turmaEditando.id}`, {
        nome: editNome.trim(),
        dia_semana: editDiaSemana.trim(),
        horario: editHorario.trim(),
        valor_mensal: Number(editValorMensal),
      })
      .then(() => {
        fecharEditarTurma();
        carregarTurmas();
        showToast("Turma atualizada", "success");
      })
      .catch((err) => {
        const msg =
          err?.response?.data?.erro ||
          err?.response?.data?.message ||
          "Erro ao atualizar turma";
        showToast(msg, "error");
      });
  }

  function excluirTurma(id) {
    const ok = window.confirm(
      "Tem certeza que deseja excluir essa turma?\n\nIsso pode afetar pagamentos e vínculos."
    );
    if (!ok) return;

    showToast("Excluindo turma...", "warning");

    api
      .delete(`/turmas/${id}`)
      .then(() => {
        carregarTurmas();
        showToast("Turma excluída", "success");
      })
      .catch((err) => {
        const msg =
          err?.response?.data?.erro ||
          err?.response?.data?.message ||
          "Erro ao excluir turma";
        showToast(msg, "error");
      });
  }

  return (
    <div className="page-crud">
      <div className="turmas-topbar">
        <h1>Turmas</h1>

        <button
          type="button"
          onClick={() => setModalAjuda(true)}
          className="turmas-btn-ajuda"
          title="Ajuda"
        >
          Ajuda
        </button>
      </div>

      <AdminOnly>
        <div className="card turmas-nova">
          <h2>Nova Turma</h2>

          <form onSubmit={criarTurma} className="turmas-form">
            <input
              placeholder="Nome da turma"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />

            <input
              placeholder="Dia da semana (ex: Segunda)"
              value={diaSemana}
              onChange={(e) => setDiaSemana(e.target.value)}
            />

            <input
              placeholder="Horário (ex: 19:00)"
              value={horario}
              onChange={(e) => setHorario(e.target.value)}
            />

            <input
              type="number"
              placeholder="Valor mensal (R$)"
              value={valorMensal}
              onChange={(e) => setValorMensal(e.target.value)}
            />

            <button type="submit">Salvar</button>
          </form>
        </div>
      </AdminOnly>

      {turmas.length === 0 ? (
        <p>Nenhuma turma cadastrada</p>
      ) : (
        <div className="card turmas-tabela">
          <table className="turmas-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Dia</th>
                <th>Horário</th>
                <th>Valor Mensal</th>
                <th>Qtd Alunas</th>
                <th>Ação</th>
              </tr>
            </thead>

            <tbody>
              {turmas.map((t) => (
                <tr key={t.id}>
                  <td>{t.nome}</td>
                  <td>{t.dia_semana}</td>
                  <td>{t.horario}</td>
                  <td>R$ {t.valor_mensal}</td>

                  <td className="turmas-qtd-alunas">
                    {Number(t.qtd_alunas ?? 0)}
                  </td>

                  <td>
                    <div className="turmas-acoes">
                      <button onClick={() => abrirModalVerAlunas(t)}>
                        Ver alunas
                      </button>

                      <AdminOnly fallback={<span>Somente leitura</span>}>
                        <button onClick={() => abrirEditarTurma(t)}>
                          Editar
                        </button>
                        <button onClick={() => excluirTurma(t.id)}>
                          Excluir
                        </button>
                      </AdminOnly>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="turmas-dica">
            Dica: se não quiser perder histórico, no futuro podemos trocar
            “Excluir” por “Inativar turma”.
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
            <h2>Ajuda — Turmas</h2>

            <p className="turmas-ajuda-texto">
              Aqui você cadastra e organiza as turmas (dia, horário e valor).
              Depois, você vincula alunas nas turmas na tela de Alunas.
            </p>

            <div className="modal-actions">
              <button onClick={() => setModalAjuda(false)}>Fechar</button>
            </div>
          </div>
        </div>
      )}

      {modalAlunas && turmaSelecionada && (
        <div onClick={fecharModalVerAlunas} className="modal-overlay">
          <div
            onClick={(e) => e.stopPropagation()}
            className="card modal-content turmas-modal-alunas"
          >
            <h2>Alunas da turma</h2>

            <p className="turmas-modal-subtitle">
              Turma: <b>{turmaSelecionada.nome}</b> —{" "}
              {turmaSelecionada.dia_semana} {turmaSelecionada.horario}
            </p>

            <div className="turmas-modal-body">
              {alunasDaTurma.length === 0 ? (
                <p>Nenhuma aluna vinculada nessa turma.</p>
              ) : (
                <table className="turmas-table">
                  <thead>
                    <tr>
                      <th>Aluna</th>
                      <th>Status</th>
                      <th>Responsável</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alunasDaTurma.map((a) => (
                      <tr key={a.id}>
                        <td>{a.nome}</td>
                        <td>{a.ativo ? "Ativa" : "Inativa"}</td>
                        <td>
                          {a.responsavel_nome
                            ? `${a.responsavel_nome}${
                                a.responsavel_cpf
                                  ? ` - ${a.responsavel_cpf}`
                                  : ""
                              }`
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="modal-actions">
              <button onClick={fecharModalVerAlunas}>Fechar</button>
            </div>
          </div>
        </div>
      )}

      <AdminOnly>
        {modalEditar && turmaEditando && (
          <div onClick={fecharEditarTurma} className="modal-overlay">
            <div
              onClick={(e) => e.stopPropagation()}
              className="card modal-content turmas-modal-editar"
            >
              <h2>Editar turma</h2>

              <div className="turmas-editar-form">
                <input
                  placeholder="Nome"
                  value={editNome}
                  onChange={(e) => setEditNome(e.target.value)}
                />

                <input
                  placeholder="Dia da semana"
                  value={editDiaSemana}
                  onChange={(e) => setEditDiaSemana(e.target.value)}
                />

                <input
                  placeholder="Horário"
                  value={editHorario}
                  onChange={(e) => setEditHorario(e.target.value)}
                />

                <input
                  type="number"
                  placeholder="Valor mensal"
                  value={editValorMensal}
                  onChange={(e) => setEditValorMensal(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button onClick={salvarEdicao}>Salvar</button>
                <button onClick={fecharEditarTurma}>Cancelar</button>
              </div>
            </div>
          </div>
        )}
      </AdminOnly>

      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
      />
    </div>
  );
}
