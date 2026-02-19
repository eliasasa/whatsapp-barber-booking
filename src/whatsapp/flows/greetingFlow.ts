import { replies } from "../replies";
import { getConversation } from "../conversation/conversationStore";
import { getPromptForStep } from "../conversation/conversationPrompts";

export function greetingFlow(from: string) {
  const conversation = getConversation(from);
  return replies.greeting + "\n" + getPromptForStep(conversation);
}
