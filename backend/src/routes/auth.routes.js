const express = require("express");
const router = express.Router();

const { login } = require("../controllers/auth.controller");
const rateLimitLogin = require("../middlewares/rateLimitLogin");

router.post("/login", rateLimitLogin, login);

module.exports = router;
