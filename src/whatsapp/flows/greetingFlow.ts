import { replies } from "../replies";
import { getConversation } from "../conversation/conversationStore";

export async function greetingFlow(from: string): Promise<string | null> {
  const conversation = getConversation(from);
  
  const prompt = conversation.lastBotMessage || "O que você gostaria de fazer? 😊";

  return replies.greeting + "\n\n" + prompt;
}