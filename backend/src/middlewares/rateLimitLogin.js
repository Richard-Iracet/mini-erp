const rateLimit = require("express-rate-limit");

const rateLimitLogin = rateLimit({
  windowMs: 2 * 60 * 1000, // 2 minutos
  max: 10, // 10 tentativas por IP a cada 15min
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    erro: "Muitas tentativas de login. Tente novamente em 15 minutos.",
  },
});

module.exports = rateLimitLogin;
