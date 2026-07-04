import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAdminAuth } from "../middleware/requireAdminAuth";

const router = Router();

router.get("/", requireAdminAuth, async (_req, res) => {
  const botState = await prisma.botState.findFirst();
  return res.json({
    serviceType: botState?.serviceType ?? "LOCAL",
  });
});

router.put("/", requireAdminAuth, async (req, res) => {
  const { serviceType } = req.body;

  if (serviceType !== "LOCAL" && serviceType !== "MOBILE") {
    return res.status(400).json({ error: "serviceType inválido." });
  }

  const botState = await prisma.botState.findFirst();

  if (!botState) {
    return res.status(404).json({ error: "BotState não encontrado." });
  }

  const updated = await prisma.botState.update({
    where: { id: botState.id },
    data: { serviceType },
  });

  return res.json({ serviceType: updated.serviceType });
});

export default router;