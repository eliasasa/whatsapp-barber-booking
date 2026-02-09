import { Router } from "express";
import { handleIncomingMessage } from "../whatsapp/handler";
import { sendMessage } from "../whatsapp/wahaClient";
import { BOT_START_TIME } from "../global/botState";

const router = Router();

router.post("/waha", async (req, res) => {
  const body = req.body;

  console.log("📩 Webhook recebido");

  if (!body) {
    return res.status(200).json({ ok: true });
  }

  const { event, payload, session } = body;

  // ---- Mensagens ----
  if (event === "message") {
    const text: string | undefined = payload?.body;
    const from: string | undefined = payload?.from;
    const fromMe: boolean | undefined = payload?.fromMe;

    const receivedTime = Date.now();
    if (receivedTime < BOT_START_TIME) {
      console.log("🚫 Ignorado (mensagem anterior ao início do bot)");
      return res.sendStatus(200);
    }

    // Evita loop
    if (fromMe) {
      console.log("🚫 Ignorado (fromMe)");
      return res.sendStatus(200);
    }

    // Ignora mensagens inválidas
    if (!text || !from) {
      console.log("🚫 Ignorado (mensagem inválida)");
      return res.sendStatus(200);
    }

    // Ignora grupos
    if (from.endsWith("@g.us")) {
      console.log("🚫 Ignorado (grupo)");
      return res.sendStatus(200);
    }

    console.log("💬 Mensagem recebida:", text);

    const reply = handleIncomingMessage(from, text);

    console.log("🤖 Resposta:", reply);

    // Envia a resposta pelo WAHA
    await sendMessage({
      to: from,
      text: reply,
      session: session || "default",
    });
  }

  // ---- Status da sessão ----
  if (event === "session.status") {
    console.log("📶 Status da sessão:", payload);
  }

  return res.status(200).json({ ok: true });
});

export default router;
