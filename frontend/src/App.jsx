import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Alunas from "./pages/Alunas";
import Turmas from "./pages/Turmas";
import Pagamentos from "./pages/Pagamentos";
import Relatorios from "./pages/Relatorios";
import Responsaveis from "./pages/Responsaveis";
import Inadimplentes from "./pages/Inadimplentes";

import PrivateLayout from "./layouts/PrivateLayout";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ✅ login em 2 rotas */}
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />

          <Route element={<PrivateLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/alunas" element={<Alunas />} />
            <Route path="/responsaveis" element={<Responsaveis />} />
            <Route path="/turmas" element={<Turmas />} />
            <Route path="/pagamentos" element={<Pagamentos />} />
            <Route path="/inadimplentes" element={<Inadimplentes />} />
            <Route path="/relatorios" element={<Relatorios />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
