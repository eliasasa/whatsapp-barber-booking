import { Router } from "express";
import { RescheduleAppointmentService } from "../services/RescheduleAppointmentService";

const router = Router();

router.patch("/:id/reschedule", async (req, res) => {
  try {
    const { id } = req.params;
    const { newStartAt } = req.body;

    const service = new RescheduleAppointmentService();

    const updated = await service.execute({
      id,
      newStartAt,
    });

    return res.json(updated);
  } catch (err: any) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }

    if (err.message) {
      return res.status(400).json({ error: err.message });
    }

    return res.status(500).json({ error: "Erro interno" });
  }
});

export default router;
