import rateLimit from "express-rate-limit";

export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas tentativas de login. Tente novamente em alguns minutos." },
});

// Cadastro: limite mais folgado (é uma ação legítima mais rara por IP), só
// pra evitar bots criando centenas de contas em sequência.
export const registerRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas contas criadas a partir deste endereço. Tente mais tarde." },
});

// Esqueci senha: cada tentativa dispara (potencialmente) um e-mail — sem
// limite, alguém poderia spammar a caixa de entrada de terceiros só
// digitando o e-mail deles várias vezes nesse formulário.
export const forgotPasswordRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitos pedidos de redefinição. Tente novamente mais tarde." },
});