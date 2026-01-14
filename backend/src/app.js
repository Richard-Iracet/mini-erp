const express = require("express");
const cors = require("cors");

const app = express();

const allowedOrigins = ["http://localhost:5173", "http://localhost:3000"];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS bloqueado: origem não permitida"));
    },
    credentials: true,
  })
);

app.use(express.json());

const alunasRoutes = require("./routes/alunas.routes");
const turmasRoutes = require("./routes/turmas.routes");
const pagamentosRoutes = require("./routes/pagamentos.routes");
const alunasTurmasRoutes = require("./routes/alunasTurmas.routes");
const relatoriosRoutes = require("./routes/relatorios.routes");
const authRoutes = require("./routes/auth.routes");
const responsaveisRoutes = require("./routes/responsaveis.routes");

app.use("/alunas", alunasRoutes);
app.use("/turmas", turmasRoutes);
app.use("/pagamentos", pagamentosRoutes);
app.use("/alunas-turmas", alunasTurmasRoutes);
app.use("/relatorios", relatoriosRoutes);
app.use("/auth", authRoutes);
app.use("/responsaveis", responsaveisRoutes);

app.get("/", (req, res) => {
  res.json({ message: "API do Mini ERP rodando 🚀" });
});

module.exports = app;
