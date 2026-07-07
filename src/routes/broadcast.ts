import { Router, Request, Response } from "express";
import { requireAdminAuth } from "../middleware/requireAdminAuth";
import { BroadcastService } from "../services/broadcast/broadcastService";

const router = Router();
const broadcastService = new BroadcastService();

// ── POST /broadcast ────────────────────────────────────────────────────────
// Inicia um broadcast. Retorna imediatamente com o id do broadcast criado.
router.post("/", requireAdminAuth, async (req: Request, res: Response) => {
  const { message, filter } = req.body;

  if (!message || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ error: "Mensagem é obrigatória." });
  }

  try {
    const broadcastId = await broadcastService.start({
      message: message.trim(),
      filter: filter ?? { all: true },
    });

    return res.status(202).json({
      id: broadcastId,
      message: "Broadcast iniciado com sucesso.",
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// ── GET /broadcast ─────────────────────────────────────────────────────────
// Lista histórico de broadcasts.
router.get("/", requireAdminAuth, async (_req: Request, res: Response) => {
  try {
    const broadcasts = await broadcastService.list();
    return res.json(broadcasts);
  } catch (err: any) {
    return res.status(500).json({ error: "Erro ao listar broadcasts." });
  }
});

// ── GET /broadcast/:id ─────────────────────────────────────────────────────
// Retorna detalhes e log de um broadcast específico.
router.get("/:id", requireAdminAuth, async (req: Request, res: Response) => {
  const { id } = req.params;

  if (typeof id !== "string") {
    return res.status(400).json({ error: "ID inválido." });
  }

  try {
    const broadcast = await broadcastService.getById(id);

    if (!broadcast) {
      return res.status(404).json({ error: "Broadcast não encontrado." });
    }

    return res.json(broadcast);
  } catch (err: any) {
    return res.status(500).json({ error: "Erro ao buscar broadcast." });
  }
});

export default router;