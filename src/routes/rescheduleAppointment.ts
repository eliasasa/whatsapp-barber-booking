import { Router } from "express";
import { prisma } from "../lib/prisma";
import { error } from "node:console";

const router = Router();

router.patch("/:id/reschedule", async (req, res) => {
    const {id} = req.params;
    const {newStartAt} = req.body;

    if (!newStartAt) {
        return res.status(400).json({ error: "Nova data inválida" });
    }

    const appointment = await prisma.appointment.findUnique({
        where: {id},
        include: {service: true}
    })

    if (!appointment) {
        return res.status(404).json({ error: "Agendamento não encontrado" });
    }

    if (appointment.status === "CANCELED") {
        return res.status(400).json({error: "Agendamento cancelado"});
    }

    const start = new Date(newStartAt);
    const end = new Date(start.getTime() + appointment.service.duration * 60000);

    const conflict = await prisma.appointment.findFirst({
        where: {
            id: {not: id},
            status: "CONFIRMED",
            startAt: {lt: end},
            endAt: {gt: start}
        }
    })

    if (conflict) {
        return res.status(409).json({error: "Horário ocupado"})
    }

    const updated = await prisma.appointment.update({
        where: {id},
        data: {
            startAt: start,
            endAt: end
        }
    })

    return res.json(updated);
})

export default router;