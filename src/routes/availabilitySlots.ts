import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

router.get("/", async (req, res) => {
    const {date, serviceId} = req.query;

    if (!date || !serviceId) {
        return res.status(400).json({ error: "Parâmetros inválidos" });
    }

    const day = new Date(date as string);
    const weekday = day.getDay();

    const availability = await prisma.availability.findFirst({
        where: {weekday}
    })

    if (!availability) {
        return res.json([]);
    }

    const service = await prisma.service.findUnique({
        where: {id: String(serviceId)}
    })

    if (!service) {
        return res.status(400).json({ error: "Serviço inválido" });
    }

    const appointments = await prisma.appointment.findMany({
        where: {
            startAt: {
                gte: new Date(`${date}T00:00:00`),
                lt: new Date(`${date}T23:59:59`),
            },
            status: "CONFIRMED"
        }
    })

    const slots: string[] = [];

    let current = new Date(`${date}T${availability.startTime}`);
    const end = new Date(`${date}T${availability.endTime}`);

    while (current.getTime() + service.duration * 60000 <= end.getTime()) {
        const slotEnd = new Date(
            current.getTime() + service.duration * 60000
        )

        const conflict = appointments.some((appointment) => {
            return (
                current < appointment.endAt && 
                slotEnd > appointment.startAt
            )
        })

        if (!conflict) {
            slots.push(current.toISOString());
        }
        
        current = new Date(current.getTime() + 30 * 60000)
    }

    return res.json(slots);

})

export default router