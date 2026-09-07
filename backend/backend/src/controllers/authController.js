import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";
import { sendPasswordResetEmail } from "../utils/mailer.js";

const registerSchema = z.object({
  name: z.string().min(2, "Nome muito curto"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("E-mail inválido"),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token é obrigatório"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora

function hashToken(rawToken) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

function generateToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

function sanitizeUser(user) {
  const { password, ...safeUser } = user;
  return safeUser;
}

export async function register(req, res) {
  const data = registerSchema.parse(req.body);

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email.toLowerCase(),
      password: hashedPassword,
    },
  });

  const token = generateToken(user);

  res.status(201).json({ user: sanitizeUser(user), token });
}

export async function login(req, res) {
  const data = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
  });

  if (!user) {
    throw new AppError("E-mail ou senha inválidos", 401);
  }

  const passwordMatches = await bcrypt.compare(data.password, user.password);

  if (!passwordMatches) {
    throw new AppError("E-mail ou senha inválidos", 401);
  }

  const token = generateToken(user);

  res.json({ user: sanitizeUser(user), token });
}

export async function me(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
  });

  if (!user) {
    throw new AppError("Usuário não encontrado", 404);
  }

  res.json({ user: sanitizeUser(user) });
}

export async function forgotPassword(req, res) {
  const data = forgotPasswordSchema.parse(req.body);
  const genericResponse = {
    message: "Se esse e-mail existir na nossa base, enviamos um link de redefinição.",
  };

  const user = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
  });

  if (!user) {
    res.json(genericResponse);
    return;
  }

  // Token cru vai só no e-mail (link); no banco guardamos o hash — assim,
  // mesmo se o banco vazar, ninguém consegue usar os tokens armazenados.
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    },
  });

  const resetLink = `${process.env.FRONTEND_URL || "http://localhost:5173"}/redefinir-senha?token=${rawToken}`;

  await sendPasswordResetEmail(user.email, resetLink);

  res.json(genericResponse);
}

// POST /api/auth/reset-password
export async function resetPassword(req, res) {
  const data = resetPasswordSchema.parse(req.body);
  const tokenHash = hashToken(data.token);

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
  });

  if (
    !resetToken ||
    resetToken.usedAt ||
    resetToken.expiresAt.getTime() < Date.now()
  ) {
    throw new AppError("Link inválido ou expirado. Peça uma nova redefinição.", 400);
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  // Troca a senha e invalida o token numa transação só — evita o token
  // continuar "meio usado" se uma das duas operações falhar no meio.
  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
  ]);

  res.json({ message: "Senha redefinida com sucesso. Você já pode entrar." });
}