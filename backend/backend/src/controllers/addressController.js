import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";

const addressSchema = z.object({
  label: z.string().optional(),
  recipientName: z.string().min(2, "Nome do destinatário muito curto"),
  zipCode: z.string().min(8, "CEP inválido").max(9),
  street: z.string().min(2, "Rua inválida"),
  number: z.string().min(1, "Número é obrigatório"),
  complement: z.string().optional(),
  neighborhood: z.string().min(2, "Bairro inválido"),
  city: z.string().min(2, "Cidade inválida"),
  state: z.string().length(2, "Use a sigla do estado, ex: SP"),
  isDefault: z.boolean().optional(),
});

// GET /api/addresses — endereços do usuário logado, padrão primeiro
export async function listAddresses(req, res) {
  const addresses = await prisma.address.findMany({
    where: { userId: req.user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  res.json({ addresses });
}

// POST /api/addresses
export async function createAddress(req, res) {
  const data = addressSchema.parse(req.body);

  // Se for marcado como padrão (ou for o primeiro endereço da pessoa),
  // tira o "padrão" de qualquer outro antes de criar — só pode existir um.
  const existingCount = await prisma.address.count({ where: { userId: req.user.id } });
  const shouldBeDefault = data.isDefault || existingCount === 0;

  if (shouldBeDefault) {
    await prisma.address.updateMany({
      where: { userId: req.user.id },
      data: { isDefault: false },
    });
  }

  const address = await prisma.address.create({
    data: { ...data, isDefault: shouldBeDefault, userId: req.user.id },
  });

  res.status(201).json({ address });
}

// PUT /api/addresses/:id
export async function updateAddress(req, res) {
  const { id } = req.params;
  const data = addressSchema.partial().parse(req.body);

  const existing = await prisma.address.findUnique({ where: { id } });
  if (!existing || existing.userId !== req.user.id) {
    throw new AppError("Endereço não encontrado", 404);
  }

  if (data.isDefault) {
    await prisma.address.updateMany({
      where: { userId: req.user.id },
      data: { isDefault: false },
    });
  }

  const address = await prisma.address.update({ where: { id }, data });

  res.json({ address });
}

// DELETE /api/addresses/:id
export async function deleteAddress(req, res) {
  const { id } = req.params;

  const existing = await prisma.address.findUnique({ where: { id } });
  if (!existing || existing.userId !== req.user.id) {
    throw new AppError("Endereço não encontrado", 404);
  }

  await prisma.address.delete({ where: { id } });

  // Se apagou o endereço padrão e ainda sobrou algum, promove o mais
  // recente a padrão — nunca deixa o usuário sem nenhum marcado, se tiver opção.
  if (existing.isDefault) {
    const next = await prisma.address.findFirst({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
    });
    if (next) {
      await prisma.address.update({ where: { id: next.id }, data: { isDefault: true } });
    }
  }

  res.status(204).send();
}