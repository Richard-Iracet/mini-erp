const express = require("express");
const router = express.Router();

const auth = require("../middlewares/auth");
const adminOnly = require("../middlewares/adminOnly");

const {
  listarAlunas,
  criarAluna,
  buscarAluna,
  atualizarAluna,
  deletarAluna,
  aniversariantesMes,
} = require("../controllers/alunas.controller");

router.get("/", auth, listarAlunas);
router.get("/aniversariantes", auth, aniversariantesMes);
router.get("/:id", auth, buscarAluna);

router.post("/", auth, adminOnly, criarAluna);
router.put("/:id", auth, adminOnly, atualizarAluna);
router.delete("/:id", auth, adminOnly, deletarAluna);

module.exports = router;
