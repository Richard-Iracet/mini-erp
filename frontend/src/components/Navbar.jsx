import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import logo from "../assets/biaballet-logo.png";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [open, setOpen] = useState(false);

  function isActive(path) {
    return location.pathname === path;
  }

  function closeMenu() {
    setOpen(false);
  }

  function handleLogout() {
    logout();
    closeMenu();
    navigate("/login");
  }

  return (
    <>
      <button className="menu-mobile" onClick={() => setOpen(true)}>
        ☰
      </button>

      <aside className={`app-sidebar ${open ? "open" : ""}`}>
        <button className="sidebar-close" onClick={closeMenu}>
          ✕
        </button>

        <div className="sidebar-brand">
          <img src={logo} alt="BiaBallet" className="sidebar-logo" />
        </div>

        <nav className="sidebar-nav">
          <Link
            to="/dashboard"
            className={`sidebar-link ${isActive("/dashboard") ? "active" : ""}`}
            onClick={closeMenu}
          >
            Dashboard
          </Link>

          <Link
            to="/responsaveis"
            className={`sidebar-link ${
              isActive("/responsaveis") ? "active" : ""
            }`}
            onClick={closeMenu}
          >
            Responsáveis
          </Link>

          <Link
            to="/alunas"
            className={`sidebar-link ${isActive("/alunas") ? "active" : ""}`}
            onClick={closeMenu}
          >
            Alunas
          </Link>

          <Link
            to="/turmas"
            className={`sidebar-link ${isActive("/turmas") ? "active" : ""}`}
            onClick={closeMenu}
          >
            Turmas
          </Link>

          <Link
            to="/pagamentos"
            className={`sidebar-link ${
              isActive("/pagamentos") ? "active" : ""
            }`}
            onClick={closeMenu}
          >
            Pagamentos
          </Link>

          <Link
            to="/inadimplentes"
            className={`sidebar-link ${
              isActive("/inadimplentes") ? "active" : ""
            }`}
            onClick={closeMenu}
          >
            Inadimplentes
          </Link>

          <Link
            to="/relatorios"
            className={`sidebar-link ${
              isActive("/relatorios") ? "active" : ""
            }`}
            onClick={closeMenu}
          >
            Relatórios
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="sidebar-logout"
          >
            Sair
          </button>
        </nav>

        <div className="sidebar-footer">
          <ThemeToggle />

          <div className="sidebar-copy">
            BiaBallet © {new Date().getFullYear()}
          </div>
        </div>
      </aside>

      {open && <div className="sidebar-backdrop" onClick={closeMenu} />}
    </>
  );
}
