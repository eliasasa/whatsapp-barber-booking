import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

router.post("/", async(req, res) => {
    const {weekday, startTime, endTime} = req.body;

    if (
        weekday === undefined ||
        !startTime ||
        !endTime
    ) {
        return res.status(400).json({ error: "Dados inválidos" });
    }

    const availability = await prisma.availability.create({
        data: {
            weekday,
            startTime,
            endTime
        }
    })

    return res.json(availability);

})

export default router;