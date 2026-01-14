const express = require("express");
const router = express.Router();

const auth = require("../middlewares/auth");
const adminOnly = require("../middlewares/adminOnly");

const controller = require("../controllers/turmas.controller");

router.get("/", auth, controller.listarTurmas);
router.get("/:id/alunas", auth, controller.listarAlunasDaTurma);
router.get("/:id", auth, controller.buscarTurma);
router.post("/", auth, adminOnly, controller.criarTurma);
router.put("/:id", auth, adminOnly, controller.atualizarTurma);
router.delete("/:id", auth, adminOnly, controller.deletarTurma);

module.exports = router;
