import { useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../services/authService";
import { useAuth } from "../contexts/AuthContext";
import logo from "../assets/biaballet-logo.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");

    if (!email.trim() || !senha.trim()) {
      setErro("Informe o e-mail e a senha.");
      return;
    }

    try {
      setLoading(true);

      const data = await authService.login(email.trim(), senha.trim());
      login(data.token);
      navigate("/dashboard");
    } catch (err) {
      setErro(err?.message || "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-login">
      <div className="login-container">
        <div className="login-left">
          <div className="login-brand">
            <img src={logo} alt="BiaBallet" className="login-logo" />

            <div className="login-brand-text">
              <div className="login-title">BiaBallet</div>
              <div className="login-subtitle">Sistema administrativo</div>
            </div>
          </div>

          <div className="login-hero">
            <h1 className="login-hero-title">Bem-vinda(o) 👋</h1>

            <p className="login-hero-text">
              Faça login para acessar o Mini ERP e organizar alunas, turmas,
              pagamentos e relatórios.
            </p>
          </div>

          <div className="login-tags">
            <span className="login-tag login-tag-pagamentos">Pagamentos</span>
            <span className="login-tag login-tag-relatorios">Relatórios</span>
            <span className="login-tag login-tag-alunas">Alunas e turmas</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-form-title">Entrar</div>

          <div className="login-form-subtitle">
            Use seu e-mail e senha cadastrados.
          </div>

          {erro && <div className="login-error">{erro}</div>}

          <div className="login-fields">
            <div className="login-field">
              <label className="login-label">E-mail</label>

              <input
                type="email"
                placeholder="ex: admin@biaballet.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="login-input"
              />
            </div>

            <div className="login-field">
              <label className="login-label">Senha</label>

              <input
                type="password"
                placeholder="Digite sua senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                autoComplete="current-password"
                className="login-input"
              />
            </div>

            <button type="submit" disabled={loading} className="login-submit">
              {loading ? "Entrando..." : "Entrar"}
            </button>

            <div className="login-footer">
              © {new Date().getFullYear()} BiaBallet
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
