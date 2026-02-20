import { getConversation, updateConversation, clearPendingIntent, resetConversation } from "../conversation/conversationStore";
import { detectIntent, Intent } from "./intents";
import { detectCommand } from "./commandDetector";
import { COMMANDS } from "./commands";
import { ConversationStep, ActiveFlow } from "../conversation/conversationTypes";
import { getPromptForStep } from "../conversation/conversationPrompts";

import { bookingFlow } from "../flows/booking/bookingFlow";
import { availabilityFlow } from "../flows/availabilityFlow";
import { cancelFlow } from "../flows/cancelFlow";
import { greetingFlow } from "../flows/greetingFlow";
import { servicesFlow } from "../flows/servicesFlow";

// 🔹 Mapeamento de tipos com assinatura explícita
type FlowHandler = (from: string, text?: string) => Promise<string | null>;

const FLOW_HANDLERS: Record<NonNullable<ActiveFlow>, FlowHandler> = {
  BOOKING: bookingFlow,
  CANCEL: cancelFlow,
  AVAILABILITY: availabilityFlow,
  SERVICES: servicesFlow,
};

// 🔹 Mapeamento de Flow para Intent correspondente
const FLOW_TO_INTENT: Record<NonNullable<ActiveFlow>, Intent> = {
  BOOKING: "BOOK",
  CANCEL: "CANCEL",
  AVAILABILITY: "CHECK_AVAILABILITY",
  SERVICES: "LIST_SERVICES"
};

const FLOW_STARTING_INTENTS: Intent[] = ["BOOK", "CHECK_AVAILABILITY", "CANCEL", "LIST_SERVICES"];

export async function handleIncomingMessage(
  from: string,
  text: string
): Promise<string | null> {
  const conversation = getConversation(from);
  const messageRaw = text.trim();
  const message = messageRaw.toLowerCase();

  updateConversation(from, { lastInteraction: Date.now() });

  // COMANDOS
  const command = detectCommand(message);
  if (command && COMMANDS[command]) {
    return COMMANDS[command]({
      from,
      isPaused: !!conversation.paused,
    });
  }

  if (conversation.paused) return null;

  // VERIFICA INTENÇÃO CONFLITANTE (mesmo durante fluxo ativo)
  if (conversation.flow || conversation.step !== ConversationStep.START) {
    const intent = detectIntent(message);
    
    // Se detectou uma intenção de iniciar novo fluxo E não está em confirmação de pendingIntent
    if (intent && FLOW_STARTING_INTENTS.includes(intent) && !conversation.pendingIntent) {
      
      // Se a intenção for a MESMA do fluxo atual, permite continuar normal
      if (conversation.flow) {
        const currentFlowIntent = FLOW_TO_INTENT[conversation.flow];
        
        if (currentFlowIntent === intent) {
          // Continua no fluxo atual (não conflita)
          const handler = FLOW_HANDLERS[conversation.flow];
          return handler(from, messageRaw);
        }
      }
      
      // Intenção diferente do fluxo atual: pergunta se quer trocar
      updateConversation(from, { pendingIntent: intent });
      
      return (
        "⚠️ Percebi que você quer iniciar outra ação.\n\n" +
        "Deseja cancelar o fluxo atual e começar um novo?\n" +
        "Digite 1️⃣ para sim ou 2️⃣ para continuar."
      );
    }
    
    // Se não detectou intenção conflitante, continua no fluxo normal
    if (conversation.flow) {
      const handler = FLOW_HANDLERS[conversation.flow];
      return handler(from, messageRaw);
    }
  }

  // CASO TENHA pendingIntent
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
        
        default:
          return greetingFlow(from);
      }
    }

    if (message === "2") {
      // Usuário decide continuar o fluxo atual
      clearPendingIntent(from);
      return "Beleza 😄 Vamos continuar de onde paramos.\n\n" + getPromptForStep(conversation);
    }

    return "Digite 1️⃣ para cancelar o fluxo atual ou 2️⃣ para continuar.";
  }

  // CONTINUAR FLUXO ATIVO (sem intenção conflitante)
  if (conversation.flow !== null && conversation.flow !== undefined) {
    const flow = conversation.flow as NonNullable<ActiveFlow>;
    const handler = FLOW_HANDLERS[flow];
    return handler(from, messageRaw);
  }

  // INICIAR NOVO FLUXO
  const intent = detectIntent(message);

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