import {
  getConversation,
  updateConversation,
  resetConversation,
} from "../conversation/conversationStore";
import { ConversationStep } from "../conversation/conversationTypes";
import { listAvailableSlots } from "../../services/availability/ListAvailableSlotsService";

export async function availabilityFlow(
  from: string,
  message?: string
): Promise<string | null> {
  const conversation = getConversation(from);
  const text = message?.toLowerCase().trim() || "";

  switch (conversation.step) {
    // --------------------------------------------------
    // START
    // --------------------------------------------------
    case ConversationStep.START: {
      const response =
        "Claro! 😊\nMe diga o dia que quer verificar.\n📅 (ex: 25/02)";

      updateConversation(from, {
        step: ConversationStep.ASK_DATE,
        lastBotMessage: response,
      });

      return response;
    }

    // --------------------------------------------------
    // ASK_DATE
    // --------------------------------------------------
    case ConversationStep.ASK_DATE: {
      if (!/^\d{2}\/\d{2}$/.test(text)) {
        const response =
          "📅 Data inválida.\nUse o formato DD/MM (ex: 25/02).";

        updateConversation(from, { lastBotMessage: response });
        return response;
      }

      try {
        const slots = await listAvailableSlots(text);

        if (!slots.length) {
          const response =
            "😕 Não há horários disponíveis nesse dia.\n\n" +
            "👉 Quer tentar outra data? Me diga o dia 😊";

          updateConversation(from, { lastBotMessage: response });
          return response;
        }

        const formatted = slots
          .map((s) => `🕒 ${s}`)
          .join("\n");

        const response =
          `📅 Horários disponíveis para ${text}:\n\n` +
          `${formatted}\n\n` +
          "👉 Para agendar, digite *Agendar*\n" +
          "👉 Ou me diga outra data para consultar 😊";

        // 🔥 FINALIZA O FLUXO
        resetConversation(from);

        // salva só pra fallback de UX
        updateConversation(from, {
          lastBotMessage: response,
        });

        return response;
      } catch (error) {
        resetConversation(from);
        return "❌ Erro ao buscar disponibilidade. Tente novamente.";
      }
    }

    // --------------------------------------------------
    // DEFAULT
    // --------------------------------------------------
    default:
      resetConversation(from);
      return "Vamos começar novamente 🙂";
  }
}