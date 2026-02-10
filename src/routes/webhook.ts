import { Router } from "express";
import { handleIncomingMessage } from "../whatsapp/handler";
import { sendMessage } from "../whatsapp/wahaClient";
import { BOT_START_TIME } from "../global/botState";
import { checkRateLimit } from "../whatsapp/rateLimiter";

type ConversationState = {
  lastReply?: string;
  lastReplyAt?: number;
};

const conversations = new Map<string, ConversationState>();
const router = Router();

router.post("/waha", async (req, res) => {
  const body = req.body;

  console.log("📩 Webhook recebido");

  if (!body) {
    return res.status(200).json({ ok: true });
  }

  const { event, payload, session } = body;

  if (event === "message") {
    const text: string | undefined = payload?.body;
    const from: string | undefined = payload?.from;
    const fromMe: boolean | undefined = payload?.fromMe;

    const receivedTime = Date.now();
    if (receivedTime < BOT_START_TIME) {
      console.log("🚫 Ignorado (mensagem anterior ao início do bot)");
      return res.sendStatus(200);
    }

    if (fromMe) {
      console.log("🚫 Ignorado (fromMe)");
      return res.sendStatus(200);
    }

    if (!text || !from) {
      console.log("🚫 Ignorado (mensagem inválida)");
      return res.sendStatus(200);
    }

    if (from.endsWith("@g.us")) {
      console.log("🚫 Ignorado (grupo)");
      return res.sendStatus(200);
    }

    console.log("💬 Mensagem recebida:", text);

    const rate = checkRateLimit(from);

    if (rate === "WARN") {
      await sendMessage({
        to: from,
        text:
          "⚠️ Opa! Você está mandando mensagens muito rápido.\n" +
          "Vamos continuar em alguns instantes 😉",
        session: session || "default",
      });
      return res.json({ ok: true });
    }

    if (rate === "BLOCK") {
      console.log("⏳ Rate limit ativo para", from);
      return res.json({ ok: true });
    }

    const reply = handleIncomingMessage(from, text);

    if (!reply) {
      return res.sendStatus(200);
    }

    const state = conversations.get(from);

    if (state?.lastReply === reply) {
      console.log("🔁 Resposta repetida ignorada");
      return res.sendStatus(200);
    }

    conversations.set(from, {
      lastReply: reply,
      lastReplyAt: Date.now(),
    });

    console.log("🤖 Resposta:", reply);

    await sendMessage({
      to: from,
      text: reply,
      session: session || "default",
    });
  }

  if (event === "session.status") {
    console.log("📶 Status da sessão:", payload);
  }

  return res.status(200).json({ ok: true });
});

export default router;
