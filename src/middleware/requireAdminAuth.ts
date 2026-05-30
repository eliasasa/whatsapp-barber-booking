import { Request, Response, NextFunction } from "express";
import { getAdminUserById, verifyAdminToken } from "../services/auth/authService";

export async function requireAdminAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Nao autenticado" });
    }

    const token = authorization.slice(7).trim();

    if (!token) {
      return res.status(401).json({ error: "Nao autenticado" });
    }

    const payload = verifyAdminToken(token);

    if (!payload.sub) {
      return res.status(401).json({ error: "Token invalido" });
    }

    const adminUser = await getAdminUserById(payload.sub);

    if (!adminUser || !adminUser.active) {
      return res.status(401).json({ error: "Nao autenticado" });
    }

    if ((payload.tokenVersion ?? 0) !== adminUser.tokenVersion) {
      return res.status(401).json({ error: "Token invalido" });
    }

    req.adminUser = adminUser;
    return next();
  } catch {
    return res.status(401).json({ error: "Nao autenticado" });
  }
}
