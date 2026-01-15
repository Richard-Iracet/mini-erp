const express = require("express");
const router = express.Router();

const auth = require("../middlewares/auth");
const adminOnly = require("../middlewares/adminOnly");

const controller = require("../controllers/responsaveis.controller");

router.get("/", auth, controller.listarResponsaveis);
router.get("/:id", auth, controller.buscarResponsavel);
router.post("/", auth, adminOnly, controller.criarResponsavel);
router.post("/importar-forms", auth, adminOnly, controller.importarFormsCSV);
router.put("/:id", auth, adminOnly, controller.atualizarResponsavel);
router.delete("/:id", auth, adminOnly, controller.deletarResponsavel);

module.exports = router;
