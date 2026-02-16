import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

router.get('/', async (req, res) => {
    const { date } = req.query;

    if (!date) {
        return res.status(400).json({ error: "Data não informada" });
    }

    const start = new Date(`${date}T00:00:00`);
    const end = new Date(`${date}T23:59:59`);

    const appointments = await prisma.appointment.findMany({
        where: {
        startAt: {
            gte: start,
            lte: end,
        },
        },
        orderBy: {
        startAt: "asc",
        },
        include: {
        client: true,
        service: true,
        },
    });

    return res.json(
        appointments.map((a) => ({
        id: a.id,
        startAt: a.startAt,
        endAt: a.endAt,
        status: a.status,
        client: a.client.name,
        service: a.service.name,
        }))
    );
})

export default router