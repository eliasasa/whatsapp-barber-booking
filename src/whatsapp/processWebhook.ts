import { handleMessage } from "./core/handler";
import { sendMessage } from "./wahaClient";
import { BOT_START_TIME } from "../global/botState";
import { checkRateLimit } from "./core/rateLimiter";
import { isClientBotDisabledByChatId } from "../services/clients/clientService";
import {
  getConversation,
  updateConversation,
  resetConversation,
} from "./conversation/conversationStore";

export async function processWebhook(body: any) {
  // console.log("📩 Webhook recebido");

  if (!body) return;

  const { event, payload, session } = body;

  const isPrivateChatId = (chatId?: string): boolean => {
    if (!chatId) return false;
    return chatId.endsWith("@c.us") || chatId.endsWith("@lid");
  };

  if (event === "message") {
    const text: string | undefined = payload?.body;
    const from: string | undefined = payload?.from;
    const fromMe: boolean | undefined = payload?.fromMe;
    const receivedTime = Date.now();

    if (!from || !text) {
      console.log("🚫 Ignorado (mensagem inválida)");
      return;
    }

    if (receivedTime < BOT_START_TIME) {
      console.log("🚫 Ignorado (mensagem anterior ao início do bot)");
      return;
    }

    if (fromMe) {
      console.log("🚫 Ignorado (fromMe)");
      return;
    }

    if (from.endsWith("@g.us") || from.endsWith("@broadcast") || !isPrivateChatId(from)) {
      console.log("🚫 Origem não permitida:", from);
      return;
    }

    if (from.endsWith("@lid")) {
      console.log("ℹ️ Mensagem recebida via LID:", from);
    }

    const isBlockedByPanel = await isClientBotDisabledByChatId(
      from,
      session || "default"
    );

    if (isBlockedByPanel) {
      console.log("⛔ Bot desativado para este numero (painel):", from);
      return;
    }

    console.log("💬 Mensagem recebida:", text);

    // ===== RATE LIMIT + REPETIÇÃO =====
    const rate = checkRateLimit(from, text);

    if (rate === "WARN") {
      await sendMessage({
        to: from,
        text:
          "⚠️ Opa! Você está mandando mensagens muito rápido.\n" +
          "Vamos continuar em alguns instantes 😉",
        session: session || "default",
      });
      return;
    }

    if (rate === "BLOCK") {
      console.log("⏳ Rate limit ativo para", from);
      return;
    }

    if (rate === "REPEAT_WARN") {
      await sendMessage({
        to: from,
        text:
          "⚠️ Você está enviando a mesma mensagem repetidamente. Por favor, aguarde ou envie algo diferente.",
        session: session || "default",
      });
      return;
    }

    if (rate === "REPEAT_BLOCK") {
      console.log("🔁 Mensagem repetida ignorada para", from);
      return;
    }

    const conversation = getConversation(from);

    // ===== FLUXO NORMAL =====
    const reply = await handleMessage(from, text);
    
    if (!reply) return;

    updateConversation(from, {
      lastInteraction: Date.now(),
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
}
