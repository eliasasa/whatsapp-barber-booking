import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

router.post('/', async (req, res) => {
    try {
        const {clientId, serviceId, startAt} = req.body;

        if (!clientId || !serviceId || !startAt) {
            return res.status(400).json({error: "Campos obrigatórios ausentes"});
        };

        const start = new Date(startAt);

        const service = await prisma.service.findUnique({
            where: {id: serviceId},
        });

        if (!service) {
            return res.status(400).json({error: "Serviço não encontrado"})
        };

        const end = new Date(start.getTime() + service.duration * 60000);

        const conflict = await prisma.appointment.findFirst({
            where: {
                status: "CONFIRMED",
                OR: [{
                    startAt: {
                        lt: end
                    },
                    endAt: {
                        gt: start
                    }
                }]
            }
        })

        if (conflict) {
            return res.status(409).json({ error: "Horário já ocupado" });
        }

        const appointment = await prisma.appointment.create({
            data: {
                clientId,
                serviceId,
                startAt: start,
                endAt: end,
                status: "CONFIRMED"

            }
        });

        return res.json(appointment);
    }

    catch (err) {
        console.error(err);
        return res.status(500).json({error: "Erro interno"})
    }
})

export default router;
