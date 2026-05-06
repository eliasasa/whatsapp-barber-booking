import { Router } from "express";
import { CreateAppointmentService } from "../services/appointments/createAppointmentService";
import { GetAppointmentByIdService } from "../services/appointments/GetAppointmentByIdService";
import { ListAppointmentsService } from "../services/appointments/ListAppointmentsService";
import { requireAdminAuth } from "../middleware/requireAdminAuth";

const router = Router();

router.use(requireAdminAuth);

router.get("/", async (_req, res) => {
  try {
    const service = new ListAppointmentsService();
    const appointments = await service.execute();

    return res.json(appointments);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro interno" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const service = new GetAppointmentByIdService();
    const appointment = await service.execute(id);

    if (!appointment) {
      return res.status(404).json({ error: "Agendamento nao encontrado" });
    }

    return res.json(appointment);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro interno" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { clientId, serviceId, startAt, address } = req.body;

    const service = new CreateAppointmentService();

    const appointment = await service.execute({
      clientId,
      serviceId,
      startAt,
      address,
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
