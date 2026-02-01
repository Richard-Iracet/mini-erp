import { useEffect, useState } from "react";
import { api } from "../services/api";
import Toast from "../components/Toast";
import AdminOnly from "../components/AdminOnly";

export default function Alunas() {
  const [alunas, setAlunas] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [responsaveis, setResponsaveis] = useState([]);

  const [nome, setNome] = useState("");
  const [responsavelId, setResponsavelId] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");

  const [turmaSelecionada, setTurmaSelecionada] = useState({});

  const [modalEditar, setModalEditar] = useState(false);
  const [alunaEditando, setAlunaEditando] = useState(null);

  const [editNome, setEditNome] = useState("");
  const [editResponsavelId, setEditResponsavelId] = useState("");
  const [editAtivo, setEditAtivo] = useState(true);
  const [editDataNascimento, setEditDataNascimento] = useState("");

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

  function formatarDataBR(data) {
    if (!data) return "—";
    try {
      return new Date(data).toLocaleDateString("pt-BR");
    } catch {
      return "—";
    }
  }

  function turmaLabel(t) {
    return `${t.nome} — ${t.dia_semana} ${t.horario}`;
  }

  function carregarAlunas() {
    api
      .get("/alunas")
      .then((res) => setAlunas(res.data))
      .catch(() => showToast("Erro ao carregar alunas", "error"));
  }

  function carregarTurmas() {
    api
      .get("/turmas")
      .then((res) => setTurmas(res.data))
      .catch(() => showToast("Erro ao carregar turmas", "error"));
  }

  function carregarResponsaveis() {
    api
      .get("/responsaveis")
      .then((res) => setResponsaveis(res.data))
      .catch(() => showToast("Erro ao carregar responsáveis", "error"));
  }

  useEffect(() => {
    carregarAlunas();
    carregarTurmas();
    carregarResponsaveis();
  }, []);

  function limparCadastro() {
    setNome("");
    setResponsavelId("");
    setDataNascimento("");
  }

  function criarAluna(e) {
    e.preventDefault();

    if (!nome || !responsavelId) {
      showToast("Preencha todos os campos", "warning");
      return;
    }

    api
      .post("/alunas", {
        nome,
        responsavel_id: Number(responsavelId),
        data_nascimento: dataNascimento || null,
      })
      .then(() => {
        limparCadastro();
        carregarAlunas();
        showToast("Aluna cadastrada com sucesso", "success");
      })
      .catch(() => {
        showToast("Erro ao criar aluna", "error");
      });
  }

  function vincularTurma(alunaId) {
    const turmaId = turmaSelecionada[alunaId];

    if (!turmaId) {
      showToast("Selecione uma turma", "warning");
      return;
    }

    api
      .post("/alunas-turmas", {
        aluna_id: alunaId,
        turma_id: Number(turmaId),
      })
      .then(() => {
        setTurmaSelecionada((prev) => ({ ...prev, [alunaId]: "" }));
        carregarAlunas();
        showToast("Turma vinculada com sucesso", "success");
      })
      .catch(() => {
        showToast("Erro ao vincular turma", "error");
      });
  }

  function removerDaTurma(vinculoId) {
    const ok = window.confirm("Remover aluna desta turma?");
    if (!ok) return;

    api
      .put(`/alunas-turmas/${vinculoId}/desativar`)
      .then(() => {
        carregarAlunas();
        showToast("Turma removida", "success");
      })
      .catch(() => {
        showToast("Erro ao remover turma", "error");
      });
  }

  function abrirEditar(aluna) {
    setAlunaEditando(aluna);
    setEditNome(aluna.nome || "");
    setEditResponsavelId(
      aluna.responsavel_id ? String(aluna.responsavel_id) : ""
    );
    setEditAtivo(aluna.ativo !== false);
    setEditDataNascimento(aluna.data_nascimento || "");
    setModalEditar(true);
  }

  function fecharEditar() {
    setModalEditar(false);
    setAlunaEditando(null);
  }

  function salvarEdicao() {
    if (!alunaEditando) return;

    if (!editNome.trim() || !editResponsavelId) {
      showToast("Preencha Nome e Responsável", "warning");
      return;
    }

    api
      .put(`/alunas/${alunaEditando.id}`, {
        nome: editNome.trim(),
        responsavel_id: Number(editResponsavelId),
        ativo: editAtivo,
        data_nascimento: editDataNascimento || null,
      })
      .then(() => {
        fecharEditar();
        carregarAlunas();
        showToast("Aluna atualizada com sucesso", "success");
      })
      .catch(() => {
        showToast("Erro ao atualizar aluna", "error");
      });
  }

  function excluirAluna(id) {
    const ok = window.confirm("Tem certeza que deseja excluir essa aluna?");
    if (!ok) return;

    api
      .delete(`/alunas/${id}`)
      .then(() => {
        carregarAlunas();
        showToast("Aluna excluída com sucesso", "success");
      })
      .catch(() => {
        showToast("Erro ao excluir aluna", "error");
      });
  }

  return (
    <div className="page-crud">
      <div className="alunas-topbar">
        <h1>Alunas</h1>

        <button type="button" onClick={() => setModalAjuda(true)}>
          Ajuda
        </button>
      </div>

      <AdminOnly>
        <div className="card alunas-card-nova">
          <h2>Nova Aluna</h2>

          <form onSubmit={criarAluna}>
            <input
              placeholder="Nome da aluna"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />

            <select
              value={responsavelId}
              onChange={(e) => setResponsavelId(e.target.value)}
            >
              <option value="">Selecione o responsável</option>
              {responsaveis.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nome}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={dataNascimento}
              onChange={(e) => setDataNascimento(e.target.value)}
            />

            <button type="submit">Salvar</button>
          </form>
        </div>
      </AdminOnly>

      {alunas.length === 0 ? (
        <p>Nenhuma aluna cadastrada</p>
      ) : (
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Aluna</th>
                <th>Nascimento</th>
                <th>Responsável</th>
                <th>Status</th>
                <th>Turmas</th>
                <th>Vincular</th>
                <th>Ação</th>
              </tr>
            </thead>

            <tbody>
              {alunas.map((a) => (
                <tr key={a.id}>
                  <td>{a.nome}</td>
                  <td>{formatarDataBR(a.data_nascimento)}</td>

                  <td>{a.responsavel_nome || "Sem responsável"}</td>

                  <td>{a.ativo ? "Ativa" : "Inativa"}</td>

                  <td>
                    {a.turmas?.length > 0 ? (
                      <div className="alunas-turmas">
                        {a.turmas.map((t) => (
                          <div key={t.vinculo_id}>
                            {t.nome}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span>Sem turma</span>
                    )}
                  </td>

                  <td>
                    <AdminOnly>
                      <select
                        value={turmaSelecionada[a.id] || ""}
                        onChange={(e) =>
                          setTurmaSelecionada((p) => ({
                            ...p,
                            [a.id]: e.target.value,
                          }))
                        }
                      >
                        <option value="">Selecione</option>
                        {turmas.map((t) => (
                          <option key={t.id} value={t.id}>
                            {turmaLabel(t)}
                          </option>
                        ))}
                      </select>
                    </AdminOnly>
                  </td>

                  <td className="alunas-acoes">
                    <AdminOnly>
                      <button onClick={() => vincularTurma(a.id)}>
                        Vincular
                      </button>
                      <button onClick={() => abrirEditar(a)}>
                        Editar
                      </button>
                      <button onClick={() => excluirAluna(a.id)}>
                        Excluir
                      </button>
                    </AdminOnly>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AdminOnly>
        {modalEditar && alunaEditando && (
          <div onClick={fecharEditar} className="modal-overlay">
            <div
              onClick={(e) => e.stopPropagation()}
              className="card modal-content"
            >
              <h2>Editar aluna</h2>

              <div className="alunas-editar-form">
                <input
                  placeholder="Nome"
                  value={editNome}
                  onChange={(e) => setEditNome(e.target.value)}
                />

                <select
                  value={editResponsavelId}
                  onChange={(e) => setEditResponsavelId(e.target.value)}
                >
                  <option value="">Selecione o responsável</option>
                  {responsaveis.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nome}
                    </option>
                  ))}
                </select>

                <input
                  type="date"
                  value={editDataNascimento}
                  onChange={(e) => setEditDataNascimento(e.target.value)}
                />

                <label className="alunas-editar-ativo">
                  <input
                    type="checkbox"
                    checked={editAtivo}
                    onChange={(e) => setEditAtivo(e.target.checked)}
                  />
                  Aluna ativa
                </label>
              </div>

              {alunaEditando.turmas?.length > 0 && (
                <div className="alunas-editar-turmas">
                  <h4>Turmas</h4>

                  {alunaEditando.turmas.map((t) => (
                    <div key={t.vinculo_id}>
                      {t.nome} ({t.dia_semana} {t.horario})
                      <button
                        onClick={() =>
                          removerDaTurma(t.vinculo_id)
                        }
                        style={{
                          marginLeft: 6,
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                        }}
                        title="Remover da turma"
                      >
                        ❌
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="modal-actions">
                <button onClick={salvarEdicao}>Atualizar</button>
                <button onClick={fecharEditar}>Cancelar</button>
              </div>
            </div>
          </div>
        )}
      </AdminOnly>

      <Toast
        show={toast.show}
        message={toast.message},
        type={toast.type}
        onClose={hideToast}
      />
    </div>
  );
}
