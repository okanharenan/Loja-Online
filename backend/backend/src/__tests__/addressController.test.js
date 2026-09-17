import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../config/prisma.js", () => ({
  prisma: {
    address: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
  },
}));

import { prisma } from "../config/prisma.js";
import {
  listAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
} from "../controllers/addressController.js";

const VALID_INPUT = {
  recipientName: "Ana Teste",
  zipCode: "60000-000",
  street: "Rua das Flores",
  number: "123",
  neighborhood: "Centro",
  city: "Fortaleza",
  state: "CE",
};

function mockRes() {
  return { status: vi.fn().mockReturnThis(), json: vi.fn(), send: vi.fn() };
}

describe("addressController.listAddresses", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lista só os endereços do usuário logado, padrão primeiro", async () => {
    prisma.address.findMany.mockResolvedValue([{ id: "a1", isDefault: true }]);

    const req = { user: { id: "u1" } };
    const res = mockRes();

    await listAddresses(req, res);

    expect(prisma.address.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "u1" } })
    );
    expect(res.json).toHaveBeenCalledWith({ addresses: [{ id: "a1", isDefault: true }] });
  });
});

describe("addressController.createAddress", () => {
  beforeEach(() => vi.clearAllMocks());

  it("o primeiro endereço do usuário vira padrão automaticamente", async () => {
    prisma.address.count.mockResolvedValue(0);
    prisma.address.create.mockResolvedValue({ id: "a1", ...VALID_INPUT, isDefault: true });

    const req = { user: { id: "u1" }, body: VALID_INPUT };
    const res = mockRes();

    await createAddress(req, res);

    expect(prisma.address.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ isDefault: true }) })
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("marcar um novo endereço como padrão tira o padrão dos outros", async () => {
    prisma.address.count.mockResolvedValue(2);
    prisma.address.create.mockResolvedValue({ id: "a2", ...VALID_INPUT, isDefault: true });

    const req = { user: { id: "u1" }, body: { ...VALID_INPUT, isDefault: true } };

    await createAddress(req, mockRes());

    expect(prisma.address.updateMany).toHaveBeenCalledWith({
      where: { userId: "u1" },
      data: { isDefault: false },
    });
  });

  it("recusa dados inválidos (ex: sigla de estado errada)", async () => {
    const req = { user: { id: "u1" }, body: { ...VALID_INPUT, state: "Ceará" } };

    await expect(createAddress(req, mockRes())).rejects.toThrow();
    expect(prisma.address.create).not.toHaveBeenCalled();
  });
});

describe("addressController.updateAddress / deleteAddress", () => {
  beforeEach(() => vi.clearAllMocks());

  it("recusa editar endereço de outro usuário", async () => {
    prisma.address.findUnique.mockResolvedValue({ id: "a1", userId: "outro-usuario" });

    const req = { user: { id: "u1" }, params: { id: "a1" }, body: { city: "Rio" } };

    await expect(updateAddress(req, mockRes())).rejects.toThrow(/não encontrado/);
    expect(prisma.address.update).not.toHaveBeenCalled();
  });

  it("recusa remover endereço de outro usuário", async () => {
    prisma.address.findUnique.mockResolvedValue({ id: "a1", userId: "outro-usuario" });

    const req = { user: { id: "u1" }, params: { id: "a1" } };

    await expect(deleteAddress(req, mockRes())).rejects.toThrow(/não encontrado/);
    expect(prisma.address.delete).not.toHaveBeenCalled();
  });

  it("ao apagar o endereço padrão, promove outro existente a padrão", async () => {
    prisma.address.findUnique.mockResolvedValue({ id: "a1", userId: "u1", isDefault: true });
    prisma.address.findFirst.mockResolvedValue({ id: "a2" });

    const req = { user: { id: "u1" }, params: { id: "a1" } };
    const res = mockRes();

    await deleteAddress(req, res);

    expect(prisma.address.delete).toHaveBeenCalledWith({ where: { id: "a1" } });
    expect(prisma.address.update).toHaveBeenCalledWith({
      where: { id: "a2" },
      data: { isDefault: true },
    });
    expect(res.status).toHaveBeenCalledWith(204);
  });

  it("apagar um endereço que não é padrão não mexe nos outros", async () => {
    prisma.address.findUnique.mockResolvedValue({ id: "a1", userId: "u1", isDefault: false });

    const req = { user: { id: "u1" }, params: { id: "a1" } };

    await deleteAddress(req, mockRes());

    expect(prisma.address.findFirst).not.toHaveBeenCalled();
    expect(prisma.address.update).not.toHaveBeenCalled();
  });
});