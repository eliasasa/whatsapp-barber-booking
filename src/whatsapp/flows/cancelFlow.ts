import { resetConversation } from "../conversation/conversationStore";

export async function cancelFlow(from: string): Promise<string | null> {
  resetConversation(from);
  return "❌ Agendamento cancelado. Se quiser, é só chamar novamente.";
}
