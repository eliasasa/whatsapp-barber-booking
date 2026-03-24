import { Router } from "express";
import { CreateAppointmentService } from "../services/appointments/createAppointmentService";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { clientId, serviceId, startAt } = req.body;

    const service = new CreateAppointmentService();

    const appointment = await service.execute({
      clientId,
      serviceId,
      startAt,
    });

    return res.json(appointment);
  } catch (err: any) {
    console.error(err);

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
