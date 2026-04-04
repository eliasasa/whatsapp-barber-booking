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
import { FlowContext, FlowResponse } from "./flowTypes";

import { bookingFlow } from "../flows/booking/bookingFlow";
import { availabilityFlow } from "../flows/availabilityFlow";
import { cancelFlow } from "../flows/cancel/cancelFlow";
import { greetingFlow } from "../flows/greetingFlow";
import { servicesFlow } from "../flows/servicesFlow";

type FlowHandler = (from: string, message?: string) => Promise<string | null | FlowResponse>;

const FLOW_HANDLERS: Record<NonNullable<ActiveFlow>, FlowHandler> = {
  BOOKING: bookingFlow as any, 
  CANCEL: cancelFlow as any,
  AVAILABILITY: availabilityFlow as any,
  SERVICES: servicesFlow as any,
};

const FLOW_TO_INTENT: Record<NonNullable<ActiveFlow>, Intent> = {
  BOOKING: "BOOK",
  CANCEL: "CANCEL",
  AVAILABILITY: "CHECK_AVAILABILITY",
  SERVICES: "LIST_SERVICES",
};

const INTENT_TO_FLOW: Record<Intent, ActiveFlow | null> = {
  BOOK: "BOOKING",
  CANCEL: "CANCEL",
  CHECK_AVAILABILITY: "AVAILABILITY",
  LIST_SERVICES: "SERVICES",
  GREETING: null,
  UNKNOWN: null,
};

const FLOW_STARTING_INTENTS: Intent[] = [
  "BOOK",
  "CANCEL",
  "CHECK_AVAILABILITY",
  "LIST_SERVICES",
];

export async function handleMessage(
  from: string,
  messageRaw: string
): Promise<string | null> {
  const message = messageRaw.trim();
  const conversation = getConversation(from);

  // Executa comandos diretos (#pause, #resume, #reset, #commands)
  const command = detectCommand(message);
  if (command) {
    const handler = COMMANDS[command];
    if (handler) {
      return handler({ from, isPaused: Boolean(conversation.paused) });
    }
  }

  if (conversation.paused) {
    return null;
  }

  const detectedIntent = await detectIntent(message);

  // Se o usuário está no meio de uma confirmação para trocar de assunto
  if (conversation.pendingIntent) {
    if (message === "1") {
      const newFlow = INTENT_TO_FLOW[conversation.pendingIntent];
      clearPendingIntent(from);

      if (newFlow) {
        updateConversation(from, {
          flow: newFlow,
          step: ConversationStep.START,
        });

        const ctx: FlowContext = { from, message: messageRaw, conversation: getConversation(from) };
        const handler = FLOW_HANDLERS[newFlow];
        const response = await handler(from, messageRaw);

        if (response) {
          const msgText = typeof response === 'string' ? response : response.message;
          if (typeof response === 'object' && response.endFlow) {
            resetConversation(from);
          } else {
            updateConversation(from, { lastBotMessage: msgText });
          }
          return msgText;
        }
      }
      return "Entendido. Vamos recomeçar. O que deseja fazer?";
    }

    if (message === "2") {
      clearPendingIntent(from);
      const lastMessage = conversation.lastBotMessage || "O que você gostaria de fazer?";
      return "Beleza 😄 Vamos continuar de onde paramos.\n\n" + lastMessage;
    }

    return "Por favor, digite 1️⃣ para mudar de assunto ou 2️⃣ para continuar o que estávamos fazendo.";
  }

  // Percebeu que o usuário quer mudar de assunto do nada
  if (
    detectedIntent !== "UNKNOWN" &&
    detectedIntent !== "GREETING" &&
    conversation.flow
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

  const ctx: FlowContext = { from, message: messageRaw, conversation };

  // Continua o assunto que já estava rolando
  if (conversation.flow) {
    const handler = FLOW_HANDLERS[conversation.flow];
    const response = await handler(from, messageRaw);

    if (response !== null) {
      const msgText = typeof response === 'string' ? response : response.message;
      if (typeof response === 'object' && response.endFlow) {
        resetConversation(from);
      } else {
        updateConversation(from, { lastBotMessage: msgText });
      }
      return msgText;
    }

    return conversation.lastBotMessage || "Vamos continuar 🙂 O que você gostaria de fazer?";
  }

  // Começa um assunto novo do zero
  if (detectedIntent && FLOW_STARTING_INTENTS.includes(detectedIntent)) {
    const newFlow = INTENT_TO_FLOW[detectedIntent];

    if (newFlow) {
      updateConversation(from, {
        flow: newFlow,
        step: ConversationStep.START,
      });

      ctx.conversation = getConversation(from); 
      
      const handler = FLOW_HANDLERS[newFlow];
      const response = await handler(from, messageRaw);
      
      if (response !== null) {
        const msgText = typeof response === 'string' ? response : response.message;
        if (typeof response === 'object' && response.endFlow) {
          resetConversation(from);
        } else {
          updateConversation(from, { lastBotMessage: msgText });
        }
        return msgText;
      }
    }
  }

  // Se for um oi, saudação ou se não tiver nada ativo
  if (detectedIntent === "GREETING" || !conversation.flow) {
    // Como greetingFlow ainda usa a estrutura antiga, passamos apenas o 'from'
    const response = await greetingFlow(from); 
    const msg = response || "Olá! Como posso ajudar?";
    
    updateConversation(from, { lastBotMessage: msg });
    return msg;
  }

  const lastMessage = conversation.lastBotMessage || "O que você gostaria de fazer?";
  return "Desculpe, não entendi. 😅\n\n" + lastMessage;
}