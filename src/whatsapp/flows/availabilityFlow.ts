import { getConversation, updateConversation, resetConversation } from "../conversation/conversationStore";
import { ConversationStep } from "../conversation/conversationTypes";
import { listAvailableSlots } from "../../services/availability/ListAvailableSlotsService";

export async function availabilityFlow(
  from: string,
  message?: string
): Promise<string | null> {
  const conversation = getConversation(from);

  switch (conversation.step) {
    case ConversationStep.START:
      updateConversation(from, { step: ConversationStep.ASK_DATE });
      return "Claro! 😊 Me diga o dia que quer verificar. (ex: 25/02)";

    case ConversationStep.ASK_DATE: {
      const text = message?.toLowerCase() || "";

      if (!/^\d{2}\/\d{2}$/.test(text)) {
        return "📅 Data inválida.\nUse o formato DD/MM (ex: 25/02).";
      }

      try {
        const slots = await listAvailableSlots(text);

        if (!slots.length) {
          resetConversation(from);
          return "😕 Não há horários disponíveis nesse dia.";
        }

        const formatted = slots.map(s => `🕒 ${s}`).join("\n");

        resetConversation(from);

        return (
          `📅 Horários disponíveis:\n\n${formatted}\n\n` +
          "Se quiser agendar, é só me avisar 😉"
        );

      } catch (error) {
        resetConversation(from);
        return "Erro ao buscar disponibilidade.";
      }
    }

    default:
      resetConversation(from);
      return "Vamos começar novamente 🙂";
  }
}