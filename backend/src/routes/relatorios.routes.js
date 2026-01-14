const express = require("express");
const router = express.Router();
const controller = require("../controllers/relatorios.controller");

router.get("/financeiro", controller.resumoFinanceiro);
router.get("/inadimplentes", controller.inadimplentes);
router.get("/faturamento-por-turma", controller.faturamentoPorTurma);
router.get("/completo", controller.relatorioCompleto);

module.exports = router;
