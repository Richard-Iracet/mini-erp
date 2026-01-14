const express = require("express");
const router = express.Router();

const controller = require("../controllers/alunasTurmas.controller");
const auth = require("../middlewares/auth");
const adminOnly = require("../middlewares/adminOnly");

router.post("/", auth, adminOnly, controller.vincular);
router.put("/:id/desativar", auth, adminOnly, controller.desativar);

router.get("/aluna/:aluna_id", auth, controller.listarPorAluna);

module.exports = router;
