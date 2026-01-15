import { useEffect, useState } from "react";
import { api } from "../services/api";
import Toast from "../components/Toast";
import AdminOnly from "../components/AdminOnly";

const emptyResponsavel = {
  nome: "",
  cpf: "",
  telefone1: "",
  telefone2: "",
  email: "",
  endereco: "",
  bairro: "",
  municipio: "",
  estado: "",
  cep: "",
};

export default function Responsaveis() {
  const [responsaveis, setResponsaveis] = useState([]);

  const [novo, setNovo] = useState(emptyResponsavel);

  const [responsavelDetalhe, setResponsavelDetalhe] = useState(null);

  const [responsavelEditando, setResponsavelEditando] = useState(null);
  const [editForm, setEditForm] = useState(emptyResponsavel);

  const [modalAjuda, setModalAjuda] = useState(false);

  const [loadingImport, setLoadingImport] = useState(false);

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

  function carregarResponsaveis() {
    api
      .get("/responsaveis")
      .then((res) => setResponsaveis(res.data))
      .catch(() => showToast("Erro ao carregar responsáveis", "error"));
  }

  useEffect(() => {
    carregarResponsaveis();
  }, []);

  function handleNovoChange(campo, valor) {
    setNovo((prev) => ({ ...prev, [campo]: valor }));
  }

  function limparNovo() {
    setNovo(emptyResponsavel);
    showToast("Formulário limpo", "success");
  }

  function normalizarPayload(form) {
    const payload = {
      ...form,
      nome: String(form.nome || "").trim(),
      cpf: String(form.cpf || "").trim() || null,
      telefone1: String(form.telefone1 || "").trim() || null,
      telefone2: String(form.telefone2 || "").trim() || null,
      email: String(form.email || "").trim() || null,
      endereco: String(form.endereco || "").trim() || null,
      bairro: String(form.bairro || "").trim() || null,
      municipio: String(form.municipio || "").trim() || null,
      estado: String(form.estado || "").trim() || null,
      cep: String(form.cep || "").trim() || null,
    };

    if (payload.cpf) payload.cpf = payload.cpf.replace(/\D/g, "");
    if (payload.estado) payload.estado = payload.estado.toUpperCase();

    return payload;
  }

  function criarResponsavel(e) {
    e.preventDefault();

    if (!novo.nome.trim()) {
      showToast("Nome do responsável é obrigatório", "warning");
      return;
    }

    const payload = normalizarPayload(novo);

    api
      .post("/responsaveis", payload)
      .then(() => {
        limparNovo();
        carregarResponsaveis();
        showToast("Responsável cadastrado com sucesso", "success");
      })
      .catch((err) => {
        const msg = err?.response?.data?.erro || "Erro ao criar responsável";
        showToast(msg, "error");
      });
  }

  function deletarResponsavel(id) {
    const ok = window.confirm(
      "Tem certeza que deseja excluir esse responsável?"
    );
    if (!ok) return;

    api
      .delete(`/responsaveis/${id}`)
      .then(() => {
        carregarResponsaveis();
        showToast("Responsável deletado com sucesso", "success");
      })
      .catch((err) => {
        const msg = err?.response?.data?.erro || "Erro ao deletar responsável";
        showToast(msg, "error");
      });
  }

  function abrirDetalhes(r) {
    setResponsavelDetalhe(r);
  }

  function fecharDetalhes() {
    setResponsavelDetalhe(null);
  }

  function abrirEditar(r) {
    setResponsavelEditando(r);

    setEditForm({
      nome: r.nome || "",
      cpf: r.cpf || "",
      telefone1: r.telefone1 || "",
      telefone2: r.telefone2 || "",
      email: r.email || "",
      endereco: r.endereco || "",
      bairro: r.bairro || "",
      municipio: r.municipio || "",
      estado: r.estado || "",
      cep: r.cep || "",
    });
  }

  function fecharEditar() {
    setResponsavelEditando(null);
  }

  function handleEditChange(campo, valor) {
    setEditForm((prev) => ({ ...prev, [campo]: valor }));
  }

  function salvarEdicao() {
    if (!responsavelEditando) return;

    if (!editForm.nome.trim()) {
      showToast("Nome do responsável é obrigatório", "warning");
      return;
    }

    const payload = normalizarPayload(editForm);

    api
      .put(`/responsaveis/${responsavelEditando.id}`, payload)
      .then(() => {
        fecharEditar();
        carregarResponsaveis();
        showToast("Responsável atualizado com sucesso", "success");
      })
      .catch((err) => {
        const msg =
          err?.response?.data?.erro || "Erro ao atualizar responsável";
        showToast(msg, "error");
      });
  }

  async function importarDoForms() {
    const ok = window.confirm(
      "Importar responsáveis e alunas do Google Forms? (Não irá duplicar)"
    );
    if (!ok) return;

    try {
      setLoadingImport(true);

      const res = await api.post("/responsaveis/importar-forms");

      const msg = res?.data?.mensagem || `Importação concluída.`;

      showToast(msg, "success");

      carregarResponsaveis();
    } catch (err) {
      const msg = err?.response?.data?.erro || "Erro ao importar do Forms";
      showToast(msg, "error");
    } finally {
      setLoadingImport(false);
    }
  }

  return (
    <div className="page-crud">
      <div className="responsaveis-topbar">
        <h1>Responsáveis</h1>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <AdminOnly>
            <button
              type="button"
              onClick={importarDoForms}
              disabled={loadingImport}
              title="Importar responsáveis/alunas do Forms"
            >
              {loadingImport ? "Importando..." : "Importar do Forms"}
            </button>
          </AdminOnly>

          <button
            type="button"
            onClick={() => setModalAjuda(true)}
            className="responsaveis-btn-ajuda"
            title="Ajuda"
          >
            Ajuda
          </button>
        </div>
      </div>

      <AdminOnly>
        <div className="card responsaveis-novo">
          <h2>Novo responsável</h2>

          <form onSubmit={criarResponsavel} className="responsaveis-form">
            <input
              placeholder="Nome do responsável *"
              value={novo.nome}
              onChange={(e) => handleNovoChange("nome", e.target.value)}
            />

            <input
              placeholder="CPF (somente números)"
              value={novo.cpf}
              onChange={(e) => handleNovoChange("cpf", e.target.value)}
            />

            <div className="responsaveis-grid-2">
              <input
                placeholder="Telefone 1"
                value={novo.telefone1}
                onChange={(e) => handleNovoChange("telefone1", e.target.value)}
              />
              <input
                placeholder="Telefone 2"
                value={novo.telefone2}
                onChange={(e) => handleNovoChange("telefone2", e.target.value)}
              />
            </div>

            <input
              placeholder="E-mail"
              value={novo.email}
              onChange={(e) => handleNovoChange("email", e.target.value)}
            />

            <input
              placeholder="Endereço"
              value={novo.endereco}
              onChange={(e) => handleNovoChange("endereco", e.target.value)}
            />

            <div className="responsaveis-grid-2">
              <input
                placeholder="Bairro"
                value={novo.bairro}
                onChange={(e) => handleNovoChange("bairro", e.target.value)}
              />
              <input
                placeholder="Município"
                value={novo.municipio}
                onChange={(e) => handleNovoChange("municipio", e.target.value)}
              />
            </div>

            <div className="responsaveis-grid-uf-cep">
              <input
                placeholder="UF"
                value={novo.estado}
                onChange={(e) => handleNovoChange("estado", e.target.value)}
              />
              <input
                placeholder="CEP"
                value={novo.cep}
                onChange={(e) => handleNovoChange("cep", e.target.value)}
              />
            </div>

            <div className="responsaveis-form-actions">
              <button type="submit">Salvar</button>
              <button type="button" onClick={limparNovo}>
                Limpar
              </button>
            </div>
          </form>
        </div>
      </AdminOnly>

      {responsaveis.length === 0 ? (
        <p>Nenhum responsável cadastrado</p>
      ) : (
        <div className="card responsaveis-tabela">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>CPF</th>
                <th>Telefone</th>
                <th>Alunas</th>
                <th>Ação</th>
              </tr>
            </thead>

            <tbody>
              {responsaveis.map((r) => (
                <tr key={r.id}>
                  <td>{r.nome}</td>
                  <td>{r.cpf || "-"}</td>
                  <td>{r.telefone1 || "-"}</td>

                  <td>
                    {Array.isArray(r.alunas) && r.alunas.length > 0 ? (
                      <div className="responsaveis-alunas">
                        {r.alunas.map((a) => (
                          <div key={a.id} className="responsaveis-aluna-item">
                            • <b>{a.nome}</b>{" "}
                            <span className="responsaveis-aluna-status">
                              ({a.ativo ? "Ativa" : "Inativa"})
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="responsaveis-sem-aluna">
                        Nenhuma aluna
                      </span>
                    )}
                  </td>

                  <td>
                    <div className="responsaveis-acoes">
                      <button onClick={() => abrirDetalhes(r)}>Detalhes</button>

                      <AdminOnly fallback={<span>Somente leitura</span>}>
                        <button onClick={() => abrirEditar(r)}>Editar</button>
                        <button onClick={() => deletarResponsavel(r.id)}>
                          Excluir
                        </button>
                      </AdminOnly>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
            <h2>Ajuda — Responsáveis</h2>

            <p className="responsaveis-ajuda-texto">
              Aqui você cadastra os pais/responsáveis das alunas. Um responsável
              pode ter mais de uma aluna.
            </p>

            <div className="modal-actions">
              <button onClick={() => setModalAjuda(false)}>Fechar</button>
            </div>
          </div>
        </div>
      )}

      {responsavelDetalhe && (
        <div onClick={fecharDetalhes} className="modal-overlay">
          <div
            onClick={(e) => e.stopPropagation()}
            className="card modal-content"
          >
            <h2>Detalhes do responsável</h2>

            <div className="responsaveis-detalhe">
              <p>
                <b>Nome:</b> {responsavelDetalhe.nome}
              </p>
              <p>
                <b>CPF:</b> {responsavelDetalhe.cpf || "-"}
              </p>
              <p>
                <b>Telefone 1:</b> {responsavelDetalhe.telefone1 || "-"}
              </p>
              <p>
                <b>Telefone 2:</b> {responsavelDetalhe.telefone2 || "-"}
              </p>
              <p>
                <b>E-mail:</b> {responsavelDetalhe.email || "-"}
              </p>

              <hr />

              <p>
                <b>Endereço:</b> {responsavelDetalhe.endereco || "-"}
              </p>
              <p>
                <b>Bairro:</b> {responsavelDetalhe.bairro || "-"}
              </p>
              <p>
                <b>Município:</b> {responsavelDetalhe.municipio || "-"}
              </p>
              <p>
                <b>Estado:</b> {responsavelDetalhe.estado || "-"}
              </p>
              <p>
                <b>CEP:</b> {responsavelDetalhe.cep || "-"}
              </p>
            </div>

            <div className="modal-actions">
              <button onClick={fecharDetalhes}>Fechar</button>

              <AdminOnly>
                <button
                  onClick={() => {
                    fecharDetalhes();
                    abrirEditar(responsavelDetalhe);
                  }}
                >
                  Editar
                </button>
              </AdminOnly>
            </div>
          </div>
        </div>
      )}

      <AdminOnly>
        {responsavelEditando && (
          <div onClick={fecharEditar} className="modal-overlay">
            <div
              onClick={(e) => e.stopPropagation()}
              className="card modal-content"
            >
              <h2>Editar responsável</h2>

              <div className="responsaveis-editar-form">
                <input
                  placeholder="Nome *"
                  value={editForm.nome}
                  onChange={(e) => handleEditChange("nome", e.target.value)}
                />

                <input
                  placeholder="CPF (somente números)"
                  value={editForm.cpf}
                  onChange={(e) => handleEditChange("cpf", e.target.value)}
                />

                <div className="responsaveis-grid-2">
                  <input
                    placeholder="Telefone 1"
                    value={editForm.telefone1}
                    onChange={(e) =>
                      handleEditChange("telefone1", e.target.value)
                    }
                  />
                  <input
                    placeholder="Telefone 2"
                    value={editForm.telefone2}
                    onChange={(e) =>
                      handleEditChange("telefone2", e.target.value)
                    }
                  />
                </div>

                <input
                  placeholder="E-mail"
                  value={editForm.email}
                  onChange={(e) => handleEditChange("email", e.target.value)}
                />

                <input
                  placeholder="Endereço"
                  value={editForm.endereco}
                  onChange={(e) => handleEditChange("endereco", e.target.value)}
                />

                <div className="responsaveis-grid-2">
                  <input
                    placeholder="Bairro"
                    value={editForm.bairro}
                    onChange={(e) => handleEditChange("bairro", e.target.value)}
                  />
                  <input
                    placeholder="Município"
                    value={editForm.municipio}
                    onChange={(e) =>
                      handleEditChange("municipio", e.target.value)
                    }
                  />
                </div>

                <div className="responsaveis-grid-uf-cep">
                  <input
                    placeholder="UF"
                    value={editForm.estado}
                    onChange={(e) => handleEditChange("estado", e.target.value)}
                  />
                  <input
                    placeholder="CEP"
                    value={editForm.cep}
                    onChange={(e) => handleEditChange("cep", e.target.value)}
                  />
                </div>
              </div>

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
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
      />
    </div>
  );
}
