import {
  getConversation,
  updateConversation,
  clearPendingIntent,
  resetConversation,
} from "../conversation/conversationStore";

import { detectIntent, Intent } from "./intents";
import { detectCommand } from "./commandDetector";
import { COMMANDS } from "./commands";

import { ConversationStep, ActiveFlow } from "../conversation/conversationTypes";
import { getPromptForStep } from "../conversation/conversationPrompts";

import { bookingFlow } from "../flows/booking/bookingFlow";
import { availabilityFlow } from "../flows/availabilityFlow";
import { cancelFlow } from "../flows/cancel/cancelFlow";
import { greetingFlow } from "../flows/greetingFlow";
import { servicesFlow } from "../flows/servicesFlow";

// ============================================================
//  FLOW REGISTRY
// ============================================================ 

type FlowHandler = (from: string, text?: string) => Promise<string | null>;

const FLOW_HANDLERS: Record<NonNullable<ActiveFlow>, FlowHandler> = {
  BOOKING: bookingFlow,
  CANCEL: cancelFlow,
  AVAILABILITY: availabilityFlow,
  SERVICES: servicesFlow,
};

const FLOW_TO_INTENT: Record<NonNullable<ActiveFlow>, Intent> = {
  BOOKING: "BOOK",
  CANCEL: "CANCEL",
  AVAILABILITY: "CHECK_AVAILABILITY",
  SERVICES: "LIST_SERVICES",
};

const INTENT_TO_FLOW: Record<Intent, ActiveFlow> = {
  BOOK: "BOOKING",
  CHECK_AVAILABILITY: "AVAILABILITY",
  CANCEL: "CANCEL",
  LIST_SERVICES: "SERVICES",
  GREETING: null,
  UNKNOWN: null,
};

const FLOW_STARTING_INTENTS: Intent[] = [
  "BOOK",
  "CHECK_AVAILABILITY",
  "CANCEL",
  "LIST_SERVICES",
];

export async function handleIncomingMessage(
  from: string,
  text: string
): Promise<string | null> {
  const conversation = getConversation(from);
  const messageRaw = text.trim();
  const message = messageRaw.toLowerCase();

  updateConversation(from, { lastInteraction: Date.now() });

  // ------------------------------------------------------------
  // Commands
  // ------------------------------------------------------------

  const command = detectCommand(message);
  if (command && COMMANDS[command]) {
    return COMMANDS[command]({
      from,
      isPaused: !!conversation.paused,
    });
  }

  if (conversation.paused) return null;

  // ------------------------------------------------------------
  //   Confirmação de intenção
  // ------------------------------------------------------------

  if (conversation.pendingIntent) {
    if (message === "1") {
      const newIntent = conversation.pendingIntent;
      resetConversation(from);

      const newFlow = INTENT_TO_FLOW[newIntent];
      if (newFlow) {
        updateConversation(from, {
          flow: newFlow,
          step: ConversationStep.START,
        });

        const handler = FLOW_HANDLERS[newFlow];
        return handler(from, messageRaw);
      }

      return greetingFlow(from);
    }

    if (message === "2") {
      clearPendingIntent(from);
      return (
        "Beleza 😄 Vamos continuar de onde paramos.\n\n" +
        getPromptForStep(conversation)
      );
    }

    return "Digite 1️⃣ para cancelar o fluxo atual ou 2️⃣ para continuar.";
  }

  // ------------------------------------------------------------
  //   Checa conflito de intenção (mid-flow switch)
  // ------------------------------------------------------------ 

  const detectedIntent = detectIntent(message);

  if (
    conversation.flow &&
    detectedIntent &&
    FLOW_STARTING_INTENTS.includes(detectedIntent)
  ) {
    const currentIntent = FLOW_TO_INTENT[conversation.flow];

    if (detectedIntent !== currentIntent) {
      updateConversation(from, { pendingIntent: detectedIntent });

      return (
        "⚠️ Percebi que você quer iniciar outra ação.\n\n" +
        "Deseja cancelar o fluxo atual e começar um novo?\n" +
        "Digite 1️⃣ para sim ou 2️⃣ para continuar."
      );
    }
  }

  // ------------------------------------------------------------
  //  Continua fluxo ativo
  // ------------------------------------------------------------ 

  if (conversation.flow) {
    const handler = FLOW_HANDLERS[conversation.flow];
    return handler(from, messageRaw);
  }

  // ------------------------------------------------------------
  //  Novo fluxo
  // ------------------------------------------------------------ 

  if (detectedIntent && FLOW_STARTING_INTENTS.includes(detectedIntent)) {
    const newFlow = INTENT_TO_FLOW[detectedIntent];

    if (newFlow) {
      updateConversation(from, {
        flow: newFlow,
        step: ConversationStep.START,
      });

      const handler = FLOW_HANDLERS[newFlow];
      return handler(from, messageRaw);
    }
  }

  // ------------------------------------------------------------
  //  Saudação padrão
  // ------------------------------------------------------------

  return greetingFlow(from);
}