import { Router } from "express";
import { processWebhook } from "../whatsapp/processWebhook";

const router = Router();

router.post("/waha", async (req, res) => {
  try {
    await processWebhook(req.body);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Erro no webhook:", err);
    return res.status(200).json({ ok: true });
  }
});

export default router;
