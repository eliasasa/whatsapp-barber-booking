import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAdminAuth } from "../middleware/requireAdminAuth";

const router = Router();

router.use(requireAdminAuth);

// GET /availability - List all availability schedules
router.get("/", async (_req, res) => {
  try {
    const availabilities = await prisma.availability.findMany({
      orderBy: { weekday: "asc" },
    });
    return res.json(availabilities);
  } catch (err: any) {
    if (err.message) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: "Erro interno" });
  }
});

// GET /availability/:id - Get specific schedule
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const availability = await prisma.availability.findUnique({
      where: { id },
    });

    if (!availability) {
      return res.status(404).json({ error: "Horario nao encontrado" });
    }

    return res.json(availability);
  } catch (err: any) {
    if (err.message) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: "Erro interno" });
  }
});

// POST /availability - Create new schedule
router.post("/", async (req, res) => {
  try {
    const { weekday, startTime, endTime } = req.body;

    if (weekday === undefined || !startTime || !endTime) {
      return res.status(400).json({ error: "Dados invalidos" });
    }

    if (weekday < 0 || weekday > 6) {
      return res
        .status(400)
        .json({ error: "Weekday deve ser entre 0 (domingo) e 6 (sabado)" });
    }

    const availability = await prisma.availability.create({
      data: {
        weekday,
        startTime,
        endTime,
      },
    });

    return res.json(availability);
  } catch (err: any) {
    if (err.message) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: "Erro interno" });
  }
});

// PATCH /availability/:id - Update schedule
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { startTime, endTime, weekday } = req.body;

    const hasStartTime = startTime !== undefined;
    const hasEndTime = endTime !== undefined;
    const hasWeekday = weekday !== undefined;

    if (!hasStartTime && !hasEndTime && !hasWeekday) {
      return res
        .status(400)
        .json({ error: "Envie startTime, endTime e/ou weekday" });
    }

    if (hasWeekday && (weekday < 0 || weekday > 6)) {
      return res
        .status(400)
        .json({ error: "Weekday deve ser entre 0 (domingo) e 6 (sabado)" });
    }

    const updateData: any = {};

    if (hasStartTime) {
      updateData.startTime = startTime;
    }

    if (hasEndTime) {
      updateData.endTime = endTime;
    }

    if (hasWeekday) {
      updateData.weekday = weekday;
    }

    const availability = await prisma.availability.update({
      where: { id },
      data: updateData,
    });

    return res.json(availability);
  } catch (err: any) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Horario nao encontrado" });
    }

    if (err.message) {
      return res.status(400).json({ error: err.message });
    }

    return res.status(500).json({ error: "Erro interno" });
  }
});

// DELETE /availability/:id - Delete schedule
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await prisma.availability.delete({
      where: { id },
    });

    return res.json({ ok: true, deleted });
  } catch (err: any) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Horario nao encontrado" });
    }

    if (err.message) {
      return res.status(400).json({ error: err.message });
    }

    return res.status(500).json({ error: "Erro interno" });
  }
});

export default router;