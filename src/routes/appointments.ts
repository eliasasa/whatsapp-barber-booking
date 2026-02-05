import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { clientId, serviceId, startAt } = req.body;

    if (!clientId || !serviceId || !startAt) {
      return res
        .status(400)
        .json({ error: "Campos obrigatórios ausentes" });
    }

    const start = new Date(startAt);

    if (isNaN(start.getTime())) {
      return res.status(400).json({ error: "Data inválida" });
    }

    // Buscar serviço
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      return res.status(400).json({ error: "Serviço não encontrado" });
    }

    const end = new Date(
      start.getTime() + service.duration * 60000
    );

    // Validar disponibilidade do dia
    const weekday = start.getDay();

    const availability = await prisma.availability.findFirst({
      where: { weekday },
    });

    if (!availability) {
      return res
        .status(400)
        .json({ error: "Barbearia fechada neste dia" });
    }

    const date = startAt.split("T")[0];

    const dayStart = new Date(
      `${date}T${availability.startTime}`
    );

    const dayEnd = new Date(
      `${date}T${availability.endTime}`
    );

    if (start < dayStart || end > dayEnd) {
      return res
        .status(400)
        .json({ error: "Horário fora do expediente" });
    }

    // Validar alinhamento de slot
    if (start.getMinutes() % 30 !== 0) {
      return res
        .status(400)
        .json({ error: "Horário inválido" });
    }

    // Verificar conflito
    const conflict = await prisma.appointment.findFirst({
      where: {
        status: "CONFIRMED",
        startAt: { lt: end },
        endAt: { gt: start },
      },
    });

    if (conflict) {
      return res
        .status(409)
        .json({ error: "Horário já ocupado" });
    }

    // Criar agendamento
    const appointment = await prisma.appointment.create({
      data: {
        clientId,
        serviceId,
        startAt: start,
        endAt: end,
        status: "CONFIRMED",
      },
    });

    return res.json(appointment);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro interno" });
  }
});

export default router;
