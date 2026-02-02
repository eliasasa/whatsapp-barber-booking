import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

router.patch("/:id/cancel", async (req, res)=> {
    const {id} = req.params;

    const appointment = await prisma.appointment.findUnique({
        where: {id}
    })

    if (!appointment) {
        return res.status(404).json({ error: "Agendamento não encontrado" });
    }

    if (appointment.status === "CANCELED") {
        return res
        .status(400)
        .json({ error: "Agendamento já cancelado" });
    }

    const updated = await prisma.appointment.update({
        where: {id},
        data: {status: "CANCELED"}
    })

    return res.json(updated)

})

export default router;