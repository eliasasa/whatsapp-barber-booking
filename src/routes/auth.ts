import { Router } from "express";
import {
  loginAdminUser,
  setupFirstAdminUser,
} from "../services/auth/authService";
import { requireAdminAuth } from "../middleware/requireAdminAuth";
import { loginRateLimiter } from "../middleware/loginRateLimiter";

const router = Router();

router.post("/setup", async (req, res) => {
  try {
    const { name, email, password, setupKey } = req.body;

    if (typeof email !== "string" || !email.trim()) {
      return res.status(400).json({ error: "Email invalido" });
    }

    if (typeof password !== "string" || !password.trim()) {
      return res.status(400).json({ error: "Senha invalida" });
    }

    if (name !== undefined && name !== null && typeof name !== "string") {
      return res.status(400).json({ error: "Nome invalido" });
    }

    if (setupKey !== undefined && setupKey !== null && typeof setupKey !== "string") {
      return res.status(400).json({ error: "Chave de setup invalida" });
    }

    const result = await setupFirstAdminUser({
      name,
      email,
      password,
      setupKey,
    });

    return res.status(201).json(result);
  } catch (err: any) {
    if (err.message) {
      const statusCode =
        err.message === "Admin ja configurado" ? 409 :
        err.message === "Chave de setup invalida" ? 403 :
        400;

      return res.status(statusCode).json({ error: err.message });
    }

    return res.status(500).json({ error: "Erro interno" });
  }
});

router.post("/login", loginRateLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (typeof email !== "string" || !email.trim()) {
      return res.status(400).json({ error: "Email invalido" });
    }

    if (typeof password !== "string" || !password.trim()) {
      return res.status(400).json({ error: "Senha invalida" });
    }

    const result = await loginAdminUser({ email, password });
    return res.json(result);
  } catch (err: any) {
    if (err.message === "Credenciais invalidas") {
      return res.status(401).json({ error: err.message });
    }

    if (err.message) {
      return res.status(400).json({ error: err.message });
    }

    return res.status(500).json({ error: "Erro interno" });
  }
});

router.get("/me", requireAdminAuth, async (req, res) => {
  return res.json({ admin: req.adminUser });
});

export default router;
