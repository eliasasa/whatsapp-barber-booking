import { getConversation, updateConversation, clearPendingIntent, resetConversation } from "../conversation/conversationStore";
import { detectIntent } from "./intents";
import { detectCommand } from "./commandDetector";
import { COMMANDS } from "./commands";
import { ConversationStep } from "../conversation/conversationTypes";
import { getPromptForStep } from "../conversation/conversationPrompts";

import { bookingFlow } from "../flows/booking/bookingFlow";
import { availabilityFlow } from "../flows/availabilityFlow";
import { cancelFlow } from "../flows/cancelFlow";
import { greetingFlow } from "../flows/greetingFlow";
import { servicesFlow } from "../flows/servicesFlow";

const FLOW_HANDLERS = {
  BOOKING: bookingFlow,
  CANCEL: cancelFlow,
  AVAILABILITY: availabilityFlow,
  SERVICES: servicesFlow,
} as const;

const FLOW_STARTING_INTENTS = ["BOOK", "CHECK_AVAILABILITY", "CANCEL", "LIST_SERVICES"];

export async function handleIncomingMessage(
  from: string,
  text: string
): Promise<string | null> {
  const conversation = getConversation(from);
  const messageRaw = text.trim();
  const message = messageRaw.toLowerCase();

  updateConversation(from, { lastInteraction: Date.now()});

  // COMANDOS
  const command = detectCommand(message);
  if (command && COMMANDS[command]) {
    return COMMANDS[command]({
      from,
      isPaused: !!conversation.paused,
    });
  }

  if (conversation.paused) return null;

  // 🔹 CASO TENHA pendingIntent
  if (conversation.pendingIntent) {
    if (message === "1") {
      // Usuário confirma cancelar o fluxo atual
      const newIntent = conversation.pendingIntent;
      resetConversation(from);
      clearPendingIntent(from);

      switch (newIntent) {
        case "BOOK":
          updateConversation(from, { flow: "BOOKING", step: ConversationStep.START });
          return bookingFlow(from, messageRaw);

        case "CHECK_AVAILABILITY":
          updateConversation(from, { flow: "AVAILABILITY", step: ConversationStep.START });
          return availabilityFlow(from, messageRaw);

        case "CANCEL":
          updateConversation(from, { flow: "CANCEL", step: ConversationStep.START });
          return cancelFlow(from);

        case "LIST_SERVICES":
          updateConversation(from, { flow: "SERVICES", step: ConversationStep.START });
          return servicesFlow();
      }
    }

    if (message === "2") {
      // Usuário decide continuar o fluxo atual
      clearPendingIntent(from);
      return "Beleza 😄 Vamos continuar de onde paramos.\n\n" + getPromptForStep(conversation);
    }

    return "Digite 1️⃣ para cancelar o fluxo atual ou 2️⃣ para continuar.";
  }

  // 🔹 CONTINUAR FLUXO ATIVO
  if (conversation.flow) {
    const handler = FLOW_HANDLERS[conversation.flow];
    return handler(from, messageRaw);
  }

  // 🔹 DETECTAR NOVA INTENÇÃO
  const intent = detectIntent(message);

  if (
    conversation.step &&
    conversation.step !== ConversationStep.START &&
    intent &&
    FLOW_STARTING_INTENTS.includes(intent)
  ) {
    // salva pendingIntent
    updateConversation(from, { pendingIntent: intent });

    return (
      "⚠️ Percebi que você quer iniciar outra ação.\n\n" +
      "Deseja cancelar o fluxo atual e começar um novo?\n" +
      "Digite 1️⃣ para sim ou 2️⃣ para continuar."
    );
  }

  // 🔹 INICIAR NOVO FLUXO
  switch (intent) {
    case "BOOK":
      updateConversation(from, { flow: "BOOKING", step: ConversationStep.START });
      return bookingFlow(from, messageRaw);

    case "CHECK_AVAILABILITY":
      updateConversation(from, { flow: "AVAILABILITY", step: ConversationStep.START });
      return availabilityFlow(from, messageRaw);

    case "CANCEL":
      updateConversation(from, { flow: "CANCEL", step: ConversationStep.START });
      return cancelFlow(from);

    case "LIST_SERVICES":
      updateConversation(from, { flow: "SERVICES", step: ConversationStep.START });
      return servicesFlow();

    case "GREETING":
    default:
      return greetingFlow(from);
  }
}
