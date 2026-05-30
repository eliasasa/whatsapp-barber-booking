import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../lib/prisma";

const BCRYPT_ROUNDS = 12;
const JWT_SECRET = process.env.AUTH_JWT_SECRET;
const JWT_EXPIRES_IN = process.env.AUTH_JWT_EXPIRES_IN ?? "12h";
const AUTH_SETUP_KEY = process.env.AUTH_SETUP_KEY;

function getJwtSecret(): string {
  if (!JWT_SECRET) {
    throw new Error("AUTH_JWT_SECRET nao definido");
  }

  return JWT_SECRET;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizeName(name?: string | null): string | null {
  if (typeof name !== "string") {
    return null;
  }

  const trimmed = name.trim();
  return trimmed || null;
}

export type AdminUserDTO = {
  id: string;
  name: string | null;
  email: string;
  active: boolean;
  tokenVersion: number;
  createdAt: Date;
  updatedAt: Date;
};

export type AuthResult = {
  token: string;
  admin: AdminUserDTO;
};

function toAdminDTO(admin: {
  id: string;
  name: string | null;
  email: string;
  active: boolean;
  tokenVersion: number;
  createdAt: Date;
  updatedAt: Date;
}): AdminUserDTO {
  return {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    active: admin.active,
    tokenVersion: admin.tokenVersion,
    createdAt: admin.createdAt,
    updatedAt: admin.updatedAt,
  };
}

function signToken(admin: { id: string; email: string; tokenVersion: number }): string {
  const signOptions = {
    expiresIn: JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  } as jwt.SignOptions;

  return jwt.sign(
    { sub: admin.id, email: admin.email, role: "ADMIN", tokenVersion: admin.tokenVersion },
    getJwtSecret(),
    signOptions
  );
}

export async function setupFirstAdminUser(input: {
  name?: string;
  email: string;
  password: string;
  setupKey?: string;
}): Promise<AuthResult> {
  const existingCount = await prisma.adminUser.count();

  if (existingCount > 0) {
    throw new Error("Admin ja configurado");
  }

  if (AUTH_SETUP_KEY && input.setupKey !== AUTH_SETUP_KEY) {
    throw new Error("Chave de setup invalida");
  }

  const email = normalizeEmail(input.email);
  const password = input.password.trim();
  const name = normalizeName(input.name);

  if (!email || !password) {
    throw new Error("Email e senha sao obrigatorios");
  }

  if (password.length < 8) {
    throw new Error("Senha deve ter pelo menos 8 caracteres");
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const admin = await prisma.adminUser.create({
    data: {
      email,
      name,
      passwordHash,
    },
    select: {
      id: true,
      email: true,
      name: true,
      passwordHash: true,
      active: true,
      tokenVersion: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return {
    token: signToken(admin),
    admin: toAdminDTO(admin),
  };
}

export async function loginAdminUser(input: {
  email: string;
  password: string;
}): Promise<AuthResult> {
  const email = normalizeEmail(input.email);
  const password = input.password;

  const admin = await prisma.adminUser.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      passwordHash: true,
      active: true,
      tokenVersion: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!admin || !admin.active) {
    throw new Error("Credenciais invalidas");
  }

  const passwordMatches = await bcrypt.compare(password, admin.passwordHash);

  if (!passwordMatches) {
    throw new Error("Credenciais invalidas");
  }

  return {
    token: signToken(admin),
    admin: toAdminDTO(admin),
  };
}

export async function updateAdminLoginCredentials(input: {
  adminUserId: string;
  currentPassword: string;
  email: string;
  password: string;
}): Promise<AuthResult> {
  const admin = await prisma.adminUser.findUnique({
    where: { id: input.adminUserId },
    select: {
      id: true,
      email: true,
      name: true,
      passwordHash: true,
      active: true,
      tokenVersion: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!admin || !admin.active) {
    throw new Error("Nao autenticado");
  }

  const currentPasswordMatches = await bcrypt.compare(
    input.currentPassword,
    admin.passwordHash
  );

  if (!currentPasswordMatches) {
    throw new Error("Senha atual invalida");
  }

  const email = normalizeEmail(input.email);
  const password = input.password.trim();

  if (!email || !password) {
    throw new Error("Email e senha sao obrigatorios");
  }

  if (password.length < 8) {
    throw new Error("Senha deve ter pelo menos 8 caracteres");
  }

  const existingWithEmail = await prisma.adminUser.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingWithEmail && existingWithEmail.id !== admin.id) {
    throw new Error("Email ja em uso");
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const updated = await prisma.adminUser.update({
    where: { id: admin.id },
    data: {
      email,
      passwordHash,
      tokenVersion: { increment: 1 },
    },
    select: {
      id: true,
      email: true,
      name: true,
      passwordHash: true,
      active: true,
      tokenVersion: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return {
    token: signToken(updated),
    admin: toAdminDTO(updated),
  };
}

export async function updateAdminEmail(input: {
  adminUserId: string;
  currentPassword: string;
  email: string;
}): Promise<AuthResult> {
  const admin = await prisma.adminUser.findUnique({
    where: { id: input.adminUserId },
    select: {
      id: true,
      email: true,
      name: true,
      passwordHash: true,
      active: true,
      tokenVersion: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!admin || !admin.active) {
    throw new Error("Nao autenticado");
  }

  const currentPasswordMatches = await bcrypt.compare(
    input.currentPassword,
    admin.passwordHash
  );

  if (!currentPasswordMatches) {
    throw new Error("Senha atual invalida");
  }

  const email = normalizeEmail(input.email);

  if (!email) {
    throw new Error("Email invalido");
  }

  const existingWithEmail = await prisma.adminUser.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingWithEmail && existingWithEmail.id !== admin.id) {
    throw new Error("Email ja em uso");
  }

  const updated = await prisma.adminUser.update({
    where: { id: admin.id },
    data: {
      email,
      tokenVersion: { increment: 1 },
    },
    select: {
      id: true,
      email: true,
      name: true,
      passwordHash: true,
      active: true,
      tokenVersion: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return {
    token: signToken(updated),
    admin: toAdminDTO(updated),
  };
}

export async function getAdminUserById(id: string) {
  return prisma.adminUser.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      passwordHash: true,
      active: true,
      tokenVersion: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function getAdminUserByEmail(email: string) {
  return prisma.adminUser.findUnique({
    where: { email: normalizeEmail(email) },
    select: {
      id: true,
      email: true,
      name: true,
      passwordHash: true,
      active: true,
      tokenVersion: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export function verifyAdminToken(token: string) {
  return jwt.verify(token, getJwtSecret()) as {
    sub?: string;
    email?: string;
    role?: string;
    tokenVersion?: number;
    iat?: number;
  };
}
