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
  createdAt: Date;
  updatedAt: Date;
}): AdminUserDTO {
  return {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    active: admin.active,
    createdAt: admin.createdAt,
    updatedAt: admin.updatedAt,
  };
}

function signToken(admin: { id: string; email: string }): string {
  const signOptions = {
    expiresIn: JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  } as jwt.SignOptions;

  return jwt.sign(
    { sub: admin.id, email: admin.email, role: "ADMIN" },
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

export async function getAdminUserById(id: string) {
  return prisma.adminUser.findUnique({
    where: { id },
  });
}

export async function getAdminUserByEmail(email: string) {
  return prisma.adminUser.findUnique({
    where: { email: normalizeEmail(email) },
  });
}

export function verifyAdminToken(token: string) {
  return jwt.verify(token, getJwtSecret()) as {
    sub?: string;
    email?: string;
    role?: string;
  };
}
