import { Router } from "express";

const router = Router();

router.post("/waha", (req, res) => {
  console.log("📩 Webhook recebido");
  console.log("Headers:", req.headers);
  console.log("Body:", req.body);

  if (!req.body) {
    return res.status(200).json({ ok: true });
  }

  const event = req.body.event;

  if (event === "message") {
    const message = req.body.payload?.body;
    const from = req.body.payload?.from;

    console.log("💬 Mensagem recebida:", message, "de", from);
  }

  if (event === "session.status") {
    console.log("📶 Status da sessão:", req.body.payload);
  }

  return res.status(200).json({ ok: true });
});

export default router;
