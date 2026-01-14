const express = require("express");
const router = express.Router();

const auth = require("../middlewares/auth");
const adminOnly = require("../middlewares/adminOnly");

const pagamentosController = require("../controllers/pagamentos.controller");

router.get("/inadimplentes", auth, pagamentosController.listarInadimplentes);
router.post(
  "/gerar",
  auth,
  adminOnly,
  pagamentosController.gerarPagamentosDoMes
);

router.get("/", auth, pagamentosController.listarPagamentos);
router.post("/", auth, adminOnly, pagamentosController.criarPagamento);
router.put("/:id/pagar", auth, adminOnly, pagamentosController.marcarComoPago);
router.put(
  "/:id/desfazer",
  auth,
  adminOnly,
  pagamentosController.desfazerPagamento
);
router.put(
  "/:id/metodo",
  auth,
  adminOnly,
  pagamentosController.atualizarMetodoPagamento
);
router.get("/:id", auth, pagamentosController.buscarPagamento);
router.put("/:id", auth, adminOnly, pagamentosController.atualizarPagamento);
router.delete("/:id", auth, adminOnly, pagamentosController.deletarPagamento);

module.exports = router;
