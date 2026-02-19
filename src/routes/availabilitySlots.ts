import { Router } from "express";
import { ListAvailableSlotsService } from "../services/services/ListAvailableSlotsService";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { date, serviceId } = req.query;

    const service = new ListAvailableSlotsService();

    const slots = await service.execute({
      date: String(date),
      serviceId: String(serviceId),
    });

    return res.json(slots);
  } catch (err: any) {
    if (err.message) {
      return res.status(400).json({ error: err.message });
    }

    return res.status(500).json({ error: "Erro interno" });
  }
});

export default router;
