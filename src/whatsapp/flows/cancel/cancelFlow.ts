import { getConversation } from "../../conversation/conversationStore";
import { ConversationStep } from "../../conversation/conversationTypes";
import {
  handleStartCancel,
  handleCancelSelection,
  handleCancelConfirmation,
} from "./cancelSteps";

export async function cancelFlow(
  from: string,
  messageRaw?: string
): Promise<string | null> {
  const conversation = getConversation(from);

  switch (conversation.step) {
    case ConversationStep.START:
      return handleStartCancel(from);

    case ConversationStep.ASK_CANCEL_SELECTION:
      return handleCancelSelection(from, messageRaw ?? "");

    case ConversationStep.CONFIRM_CANCEL:
      return handleCancelConfirmation(from, messageRaw ?? "");

    default:
      return handleStartCancel(from);
  }
}