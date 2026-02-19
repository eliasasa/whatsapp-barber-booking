import {
  getConversation,
  resetConversation,
  updateConversation,
} from "../../conversation/conversationStore";
import { ConversationStep } from "../../conversation/conversationTypes";
import { confirmBooking } from "../booking/bookingDomain";

// START
export function handleStart(from: string): string {
  updateConversation(from, { step: ConversationStep.ASK_SERVICE });

  return "Olá! 👋\nQual serviço você deseja?\n1️⃣ Corte\n2️⃣ Barba";
}

// ASK_SERVICE
export function handleServiceStep(
  from: string,
  messageRaw: string
): string {
  const message = messageRaw.toLowerCase();

  if (message === "1" || message === "2") {
    const serviceId = message === "1" ? "Corte" : "Barba";

    updateConversation(from, {
      step: ConversationStep.ASK_DATE,
      serviceId,
    });

    return `Perfeito ${
      serviceId === "Corte" ? "✂️" : "🧔"
    }\nQual dia você deseja? (ex: 25/02)`;
  }

  return "Por favor, escolha 1️⃣ Corte ou 2️⃣ Barba";
}

// ASK_DATE
export function handleDateStep(
  from: string,
  messageRaw: string
): string {
  const message = messageRaw.toLowerCase();

  if (!/^\d{2}\/\d{2}$/.test(message)) {
    return "📅 Data inválida.\nUse o formato DD/MM (ex: 25/02).";
  }

  updateConversation(from, {
    step: ConversationStep.ASK_TIME,
    date: message,
  });

  return "Ótimo 📅\nAgora me diga o horário (ex: 14:30)";
}

// ASK_TIME
export function handleTimeStep(
  from: string,
  messageRaw: string
): string {
  const message = messageRaw.toLowerCase();

  if (!/^\d{2}:\d{2}$/.test(message)) {
    return "⏰ Horário inválido.\nUse o formato HH:mm (ex: 14:30)";
  }

  updateConversation(from, {
    step: ConversationStep.ASK_ADDRESS,
    time: message,
  });

  return "Ótimo ⏰\nAgora me diga o endereço onde deseja ser atendido:";
}

// ASK_ADDRESS
export function handleAddressStep(
  from: string,
  messageRaw: string
): string {
  if (!messageRaw.trim()) {
    return "Endereço inválido. Por favor, envie novamente:";
  }

  updateConversation(from, {
    address: messageRaw.trim(),
    step: ConversationStep.CONFIRM,
  });

  const conversation = getConversation(from);

  return (
    "Quase pronto! Confirme seu agendamento:\n\n" +
    `📌 Serviço: ${conversation.serviceId}\n` +
    `📅 Data: ${conversation.date}\n` +
    `⏰ Horário: ${conversation.time}\n` +
    `📍 Endereço: ${conversation.address}\n\n` +
    "Digite 1️⃣ para confirmar ou 2️⃣ para cancelar"
  );
}

// CONFIRM
export async function handleConfirmStep(
  from: string,
  messageRaw: string
): Promise<string> {
  const message = messageRaw.toLowerCase();

  if (message === "2") {
    resetConversation(from);
    return "❌ Agendamento cancelado.";
  }

  if (message !== "1") {
    return "Digite 1️⃣ para confirmar ou 2️⃣ para cancelar";
  }

  const conversation = getConversation(from);

  try {
    const result = await confirmBooking(from, conversation);

    if (result.error) {
      resetConversation(from);
      return result.error;
    }

    if (result.conflict) {
      updateConversation(from, {
        step: ConversationStep.ASK_TIME,
      });

      return "⚠️ Esse horário já está ocupado. Escolha outro horário.";
    }

    resetConversation(from);
    return "✅ Agendamento confirmado com sucesso! 💈";
  } catch (error) {
    resetConversation(from);
    return "Ocorreu um erro ao confirmar. Tente novamente.";
  }
}
