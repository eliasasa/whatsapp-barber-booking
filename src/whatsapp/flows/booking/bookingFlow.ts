import { getConversation } from "../../conversation/conversationStore";
import { ConversationStep } from "../../conversation/conversationTypes";
import {
  handleAddressStep,
  handleConfirmStep,
  handleDateStep,
  handleServiceStep,
  handleStart,
  handleTimeStep,
} from "../booking/bookingSteps";

export async function bookingFlow(
  from: string,
  messageRaw: string
): Promise<string | null> {

  const conversation = getConversation(from);

  switch (conversation.step) {
    case ConversationStep.START:
      return handleStart(from);

    case ConversationStep.ASK_SERVICE:
      return handleServiceStep(from, messageRaw);

    case ConversationStep.ASK_DATE:
      return handleDateStep(from, messageRaw);

    case ConversationStep.ASK_TIME:
      return handleTimeStep(from, messageRaw);

    case ConversationStep.ASK_ADDRESS:
      return handleAddressStep(from, messageRaw);

    case ConversationStep.CONFIRM:
      return handleConfirmStep(from, messageRaw);

    default:
      return handleStart(from);
  }
}
