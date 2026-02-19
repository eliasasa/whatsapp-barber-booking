import { resetConversation } from "../conversation/conversationStore";

export function cancelFlow(from: string) {
  resetConversation(from);
  return "❌ Agendamento cancelado. Se quiser, é só chamar novamente.";
}
