import { Router } from "express";
import { getBotState, updateBotState } from "../services/botState/botStateService";
import { clearAllConversations } from "../whatsapp/conversation/conversationStore";
import { requireAdminAuth } from "../middleware/requireAdminAuth";

const router = Router();

router.use(requireAdminAuth);

router.get("/state", async (_req, res) => {
  try {
    const state = await getBotState();

    const status = state.paused ? "paused" : "active";

    return res.json({ status, paused: state.paused, lastPing: state.lastPing });
  } catch (err: any) {
    return res.status(500).json({ error: "Erro interno" });
  }
});

router.patch("/state", async (req, res) => {
  try {
    const { paused } = req.body;
    if (typeof paused !== "boolean") return res.status(400).json({ error: "paused inválido" });

    const updated = await updateBotState(paused);
    const status = updated.paused ? "paused" : "active";
    return res.json({ status, paused: updated.paused, lastPing: updated.lastPing });
  } catch (err: any) {
    return res.status(500).json({ error: "Erro interno" });
  }
});

router.post("/restart", async (_req, res) => {
  try {
    const cleared = clearAllConversations();
    return res.json({ ok: true, cleared });
  } catch (err: any) {
    return res.status(500).json({ error: "Erro interno" });
  }
});

export default router;
