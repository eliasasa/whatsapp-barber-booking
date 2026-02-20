import { replies } from "../replies";
import { getConversation } from "../conversation/conversationStore";
import { getPromptForStep } from "../conversation/conversationPrompts";

export async function greetingFlow(from: string): Promise<string | null> {
  const conversation = getConversation(from);
  return replies.greeting + "\n" + getPromptForStep(conversation);
}
