import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAdminAuth } from "../middleware/requireAdminAuth";

const router = Router();

router.use(requireAdminAuth);

router.get("/", async (req, res) => {
  try {
    const services = await prisma.service.findMany({
      orderBy: { name: "asc" },
    });

    return res.json(services);
  } catch (err: any) {
    if (err.message) return res.status(400).json({ error: err.message });
    return res.status(500).json({ error: "Erro interno" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const service = await prisma.service.findUnique({ where: { id } });

    if (!service) return res.status(404).json({ error: "Serviço não encontrado" });
    return res.json(service);
  } catch (err: any) {
    if (err.message) return res.status(400).json({ error: err.message });
    return res.status(500).json({ error: "Erro interno" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, duration, price } = req.body;

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "Nome inválido" });
    }

    const durationNum = Number(duration);
    if (!Number.isFinite(durationNum) || durationNum <= 0) {
      return res.status(400).json({ error: "Duration inválida" });
    }

    let priceNum: number | null = null;
    if (price !== undefined && price !== null) {
      priceNum = Number(price);
      if (!Number.isFinite(priceNum) || priceNum < 0) {
        return res.status(400).json({ error: "Price inválido" });
      }
    }

    const created = await prisma.service.create({
      data: {
        name: name.trim(),
        duration: durationNum,
        price: priceNum,
      },
    });

    return res.status(201).json(created);
  } catch (err: any) {
    if (err.message) return res.status(400).json({ error: err.message });
    return res.status(500).json({ error: "Erro interno" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, duration, price, paused } = req.body;

    const data: any = {};

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) return res.status(400).json({ error: "Nome inválido" });
      data.name = name.trim();
    }

    if (duration !== undefined) {
      const durationNum = Number(duration);
      if (!Number.isFinite(durationNum) || durationNum <= 0) return res.status(400).json({ error: "Duration inválida" });
      data.duration = durationNum;
    }

    if (price !== undefined) {
      if (price === null) data.price = null;
      else {
        const priceNum = Number(price);
        if (!Number.isFinite(priceNum) || priceNum < 0) return res.status(400).json({ error: "Price inválido" });
        data.price = priceNum;
      }
    }

    if (paused !== undefined) {
      if (typeof paused !== "boolean") return res.status(400).json({ error: "paused inválido" });
      data.paused = paused;
    }

    const updated = await prisma.service.update({ where: { id }, data });
    return res.json(updated);
  } catch (err: any) {
    if (err.code === "P2025") return res.status(404).json({ error: "Serviço não encontrado" });
    if (err.message) return res.status(400).json({ error: err.message });
    return res.status(500).json({ error: "Erro interno" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.service.delete({ where: { id } });
    return res.status(204).send();
  } catch (err: any) {
    if (err.code === "P2025") return res.status(404).json({ error: "Serviço não encontrado" });
    if (err.message) return res.status(400).json({ error: err.message });
    return res.status(500).json({ error: "Erro interno" });
  }
});

router.post("/:id/pause", async (req, res) => {
  try {
    const { id } = req.params;
    const { pause } = req.body;
    if (typeof pause !== "boolean") return res.status(400).json({ error: "pause inválido" });

    const updated = await prisma.service.update({ where: { id }, data: ({ paused: pause } as any) });
    return res.json(updated);
  } catch (err: any) {
    if (err.code === "P2025") return res.status(404).json({ error: "Serviço não encontrado" });
    if (err.message) return res.status(400).json({ error: err.message });
    return res.status(500).json({ error: "Erro interno" });
  }
});

export default router;
