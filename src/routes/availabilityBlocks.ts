import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAdminAuth } from "../middleware/requireAdminAuth";

const router = Router();

router.use(requireAdminAuth);

// GET /availability-blocks - List all availability blocks
router.get("/", async (_req, res) => {
  try {
    const blocks = await prisma.availabilityBlock.findMany({
      orderBy: { startAt: "asc" },
    });
    return res.json(blocks);
  } catch (err: any) {
    if (err.message) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: "Erro interno" });
  }
});

// GET /availability-blocks/:id - Get specific block
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const block = await prisma.availabilityBlock.findUnique({
      where: { id },
    });

    if (!block) {
      return res.status(404).json({ error: "Bloqueio nao encontrado" });
    }

    return res.json(block);
  } catch (err: any) {
    if (err.message) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: "Erro interno" });
  }
});

// POST /availability-blocks - Create new block
router.post("/", async (req, res) => {
  try {
    const { startAt, endAt, reason } = req.body;

    if (!startAt || !endAt) {
      return res
        .status(400)
        .json({ error: "startAt e endAt sao obrigatorios" });
    }

    const start = new Date(startAt);
    const end = new Date(endAt);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: "Datas invalidas" });
    }

    if (start >= end) {
      return res
        .status(400)
        .json({ error: "startAt deve ser anterior a endAt" });
    }

    const block = await prisma.availabilityBlock.create({
      data: {
        startAt: start,
        endAt: end,
        reason: reason || null,
      },
    });

    return res.json(block);
  } catch (err: any) {
    if (err.message) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: "Erro interno" });
  }
});

// PATCH /availability-blocks/:id - Update block
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { startAt, endAt, reason } = req.body;

    const hasStartAt = startAt !== undefined;
    const hasEndAt = endAt !== undefined;
    const hasReason = reason !== undefined;

    if (!hasStartAt && !hasEndAt && !hasReason) {
      return res
        .status(400)
        .json({ error: "Envie startAt, endAt e/ou reason" });
    }

    const updateData: any = {};

    if (hasStartAt) {
      const start = new Date(startAt);
      if (isNaN(start.getTime())) {
        return res.status(400).json({ error: "startAt invalido" });
      }
      updateData.startAt = start;
    }

    if (hasEndAt) {
      const end = new Date(endAt);
      if (isNaN(end.getTime())) {
        return res.status(400).json({ error: "endAt invalido" });
      }
      updateData.endAt = end;
    }

    if (hasReason) {
      updateData.reason = reason;
    }

    const block = await prisma.availabilityBlock.update({
      where: { id },
      data: updateData,
    });

    return res.json(block);
  } catch (err: any) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Bloqueio nao encontrado" });
    }

    if (err.message) {
      return res.status(400).json({ error: err.message });
    }

    return res.status(500).json({ error: "Erro interno" });
  }
});

// DELETE /availability-blocks/:id - Delete block
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await prisma.availabilityBlock.delete({
      where: { id },
    });

    return res.json({ ok: true, deleted });
  } catch (err: any) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Bloqueio nao encontrado" });
    }

    if (err.message) {
      return res.status(400).json({ error: err.message });
    }

    return res.status(500).json({ error: "Erro interno" });
  }
});

export default router;
