import { Router } from "express";
import {
  getGreetingMessage,
  updateGreetingMessage,
} from "../services/botMessages/botMessageService";

const router = Router();

router.get("/greeting", async (_req, res) => {
  try {
    const content = await getGreetingMessage();
    return res.json({ key: "GREETING", content });
  } catch {
    return res.status(500).json({ error: "Erro interno" });
  }
});

router.patch("/greeting", async (req, res) => {
  try {
    const { content } = req.body;

    if (typeof content !== "string") {
      return res.status(400).json({ error: "Mensagem invalida" });
    }

    const updated = await updateGreetingMessage(content);
    return res.json({ key: "GREETING", content: updated.content });
  } catch (err: any) {
    if (err.message) {
      return res.status(400).json({ error: err.message });
    }

    return res.status(500).json({ error: "Erro interno" });
  }
});

export default router;
