import { Router } from "express";
import { CancelAppointmentService } from "../services/appointments/CancelAppointmentService";

const router = Router();

router.patch("/:id/cancel", async (req, res) => {
  try {
    const { id } = req.params;

    const service = new CancelAppointmentService();

    const updated = await service.execute(id);

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
