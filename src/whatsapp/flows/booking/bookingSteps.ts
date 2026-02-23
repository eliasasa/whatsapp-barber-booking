import {
  getConversation,
  resetConversation,
  updateConversation,
} from "../../conversation/conversationStore";
import { ConversationStep } from "../../conversation/conversationTypes";
import { confirmBooking } from "../booking/bookingDomain";
import {
  getOrCreateClient,
  updateClientName,
} from "../../../services/clients/clientService";
import { ListAvailableSlotsService } from "../../../services/catalog/ListAvailableSlotsService";
import { prisma } from "../../../lib/prisma";

/* ======================================================
   HELPER: BUILD SERVICE MENU
====================================================== */

const MAX_VISIBLE_SERVICES = 10;

async function buildServiceMenu(clientName: string) {
  const services = await prisma.service.findMany({
    orderBy: { name: "asc" },
  });

  if (!services.length) {
    return { message: "Nenhum serviço disponível.", map: null };
  }

  const serviceMap: Record<string, { id: string; name: string }> = {};
  let message = `Olá, ${clientName}! 👋\nQual serviço você deseja?\n\n`;

  // Mostra apenas os primeiros 5
  const visibleServices = services.slice(0, MAX_VISIBLE_SERVICES);

  visibleServices.forEach((service, index) => {
    const option = String(index + 1);
    serviceMap[option] = {
      id: service.id,
      name: service.name,
    };

    message += `*${option}.* ${service.name}\n`;
  });

  // Guarda TODOS os serviços com chave especial
  services.forEach((service) => {
    serviceMap[service.name.toLowerCase()] = {
      id: service.id,
      name: service.name,
    };
  });

  message +=
    '\nSe preferir, você também pode digitar o nome do serviço.\n\nDigite "Serviços" para ver todos os serviços disponíveis.';

  return { message, map: serviceMap };
}

/* ======================================================
   START
====================================================== */

export async function handleStart(from: string): Promise<string | null> {
  const phone = from.replace("@c.us", "");
  const client = await getOrCreateClient(phone);

  if (!client.name) {
    updateConversation(from, {
      step: ConversationStep.ASK_NAME,
      clientId: client.id,
    });
    return "Antes de continuarmos 😊\nQual é o seu nome?";
  }

  const { message, map } = await buildServiceMenu(client.name);

  if (!map) return message;

  updateConversation(from, {
    step: ConversationStep.ASK_SERVICE,
    serviceOptions: map,
  });

  return message;
}

/* ======================================================
   ASK_NAME
====================================================== */

export async function handleNameStep(
  from: string,
  messageRaw: string
): Promise<string | null> {
  const name = messageRaw.trim();
  const nameRegex = /^[A-Za-zÀ-ÿ\s'-]+$/;

  if (name.length < 2 || name.length > 40) {
    return "Digite um nome válido 🙂";
  }

  if (!/[AEIOUaeiouÀ-ÿ]/.test(name) || !nameRegex.test(name)) {
    return "Digite um nome válido 🙂";
  }

  const invalidNames = ["teste", "test", "admin", "null", "undefined"];
  if (invalidNames.includes(name.toLowerCase())) {
    return "Digite seu nome real 🙂";
  }

  const conversation = getConversation(from);

  if (!conversation.clientId) {
    resetConversation(from);
    return "Erro inesperado. Vamos começar novamente.";
  }

  await updateClientName(conversation.clientId, name);

  const { message, map } = await buildServiceMenu(name);
  if (!map) return message;

  updateConversation(from, {
    step: ConversationStep.ASK_SERVICE,
    serviceOptions: map,
  });

  return message;
}

/* ======================================================
   ASK_SERVICE
====================================================== */

export async function handleServiceStep(
  from: string,
  messageRaw: string
): Promise<string | null> {
  const conversation = getConversation(from);
  const input = messageRaw.trim();

  if (!conversation.serviceOptions) {
    resetConversation(from);
    return "Erro inesperado. Vamos começar novamente.";
  }

  // Tenta por número
  let selectedService = conversation.serviceOptions[input];

  // Se não encontrou, tenta por nome (case insensitive)
  if (!selectedService) {
    selectedService =
      conversation.serviceOptions[input.toLowerCase()];
  }

  if (!selectedService) {
    return "Escolha uma opção válida ou digite o nome do serviço.";
  }

  updateConversation(from, {
    step: ConversationStep.ASK_DATE,
    serviceId: selectedService.id,
    serviceName: selectedService.name,
  });

  return `Perfeito! ✂️ ${selectedService.name}\nQual dia você deseja? (ex: 25/02)`;
}

/* ======================================================
   ASK_DATE
====================================================== */

export async function handleDateStep(
  from: string,
  messageRaw: string
): Promise<string | null> {
  const message = messageRaw.trim();

  if (!/^\d{2}\/\d{2}$/.test(message)) {
    return "📅 Data inválida.\nUse o formato DD/MM.";
  }

  const [dayStr, monthStr] = message.split("/");
  const day = Number(dayStr);
  const month = Number(monthStr);
  const year = new Date().getFullYear();

  const dateObj = new Date(year, month - 1, day);

  if (
    dateObj.getFullYear() !== year ||
    dateObj.getMonth() !== month - 1 ||
    dateObj.getDate() !== day
  ) {
    return "📅 Data inválida.";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (dateObj < today) {
    return "📅 Não é possível agendar para uma data passada.";
  }

  const conversation = getConversation(from);

  if (!conversation.serviceId) {
    resetConversation(from);
    return "Erro inesperado. Vamos começar novamente.";
  }

  const isoDate = dateObj.toISOString().split("T")[0];

  const slotService = new ListAvailableSlotsService();
  const slots = await slotService.execute({
    date: isoDate!,
    serviceId: conversation.serviceId,
  });

  if (!slots.length) {
    return "⚠️ Não há horários disponíveis nesta data. Escolha outra.";
  }

  const slotMap: Record<string, string> = {};
  let response = "Horários disponíveis:\n\n";

  slots.forEach((time, index) => {
    const option = String(index + 1);
    slotMap[option] = time;
    response += `${option}. ${time}\n`;
  });

  updateConversation(from, {
    step: ConversationStep.ASK_TIME,
    date: message,
    slotOptions: slotMap,
  });

  return response + "\nEscolha uma opção:";
}

/* ======================================================
   ASK_TIME
====================================================== */

export async function handleTimeStep(
  from: string,
  messageRaw: string
): Promise<string | null> {
  const conversation = getConversation(from);
  const input = messageRaw.trim();

  const slotOptions = conversation.slotOptions;
  if (!slotOptions) {
    resetConversation(from);
    return "Erro inesperado. Vamos começar novamente.";
  }

  if (slotOptions[input]) {
    updateConversation(from, {
      step: ConversationStep.ASK_ADDRESS,
      time: slotOptions[input],
    });

    return "Perfeito ⏰\nAgora me diga o endereço:";
  }

  const matchedSlot = Object.values(slotOptions).find(
    (time) => time === input
  );

  if (matchedSlot) {
    updateConversation(from, {
      step: ConversationStep.ASK_ADDRESS,
      time: matchedSlot,
    });

    return "Perfeito ⏰\nAgora me diga o endereço:";
  }

  return "⚠️ Esse horário não está disponível.\nEscolha uma opção da lista.";
}

/* ======================================================
   ASK_ADDRESS
====================================================== */

export async function handleAddressStep(
  from: string,
  messageRaw: string
): Promise<string | null> {
  const address = messageRaw.trim();

  if (!address) {
    return "Endereço inválido. Por favor, envie novamente:";
  }

  updateConversation(from, {
    address,
    step: ConversationStep.CONFIRM,
  });

  const conversation = getConversation(from);

  return (
    "Quase pronto! Confirme seu agendamento:\n\n" +
    `📌 Serviço: ${conversation.serviceName ?? "-"}\n` +
    `📅 Data: ${conversation.date ?? "-"}\n` +
    `⏰ Horário: ${conversation.time ?? "-"}\n` +
    `📍 Endereço: ${address}\n\n` +
    "Digite 1️⃣ para confirmar ou 2️⃣ para cancelar"
  );
}

/* ======================================================
   CONFIRM
====================================================== */

export async function handleConfirmStep(
  from: string,
  messageRaw: string
): Promise<string | null> {
  const message = messageRaw.trim();

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
      const errorMessage = result.error.toLowerCase();

      if (
        errorMessage.includes("data") ||
        errorMessage.includes("dia fechado")
      ) {
        updateConversation(from, {
          step: ConversationStep.ASK_DATE,
        });

        return `⚠️ ${result.error}\n\nEscolha outra data (ex: 25/02).`;
      }

      if (
        errorMessage.includes("horário") ||
        errorMessage.includes("ocupado") ||
        errorMessage.includes("expediente")
      ) {
        updateConversation(from, {
          step: ConversationStep.ASK_TIME,
        });

        return `⚠️ ${result.error}\n\nEscolha outro horário.`;
      }

      resetConversation(from);
      return `⚠️ ${result.error}`;
    }

    resetConversation(from);
    return "✅ Agendamento confirmado com sucesso! 💈";
  } catch {
    resetConversation(from);
    return "Ocorreu um erro inesperado. Tente novamente.";
  }
}