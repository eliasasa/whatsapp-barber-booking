import { updateConversation, resetConversation, getConversation } from "../../conversation/conversationStore";
import { ConversationStep } from "../../conversation/conversationTypes";
import { normalizePhone } from "../../../utils/phone";
import { CancelAppointmentService } from "../../../services/appointments/CancelAppointmentService";

const service = new CancelAppointmentService();

/* -------------------------------------------------- */

export async function handleStartCancel(from: string) {
  const phone = normalizePhone(from);

  const appointments = await service.listClientAppointments(phone);

  if (!appointments.length) {
    resetConversation(from);
    return "Você não possui agendamentos futuros para cancelar.";
  }

  updateConversation(from, {
    step: ConversationStep.ASK_CANCEL_SELECTION,
    notes: JSON.stringify(appointments.map(a => a.id)), // guarda ids temporariamente
  });

  let message = "📅 Seus próximos agendamentos:\n\n";

  appointments.forEach((a, index) => {
    const date = a.startAt.toLocaleDateString("pt-BR");
    const time = a.startAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    message += `${index + 1}️. ${a.service.name} - ${date} às ${time}\n`;
  });

  message += "\nDigite o número do agendamento que deseja cancelar.\nOu digite 0 para desistir.";

  return message;
}

/* -------------------------------------------------- */

export async function handleCancelSelection(from: string, message: string) {
  const conversation = getConversation(from);
  const ids: string[] = conversation.notes ? JSON.parse(conversation.notes) : [];

  // Opção para desistir de cancelar
  if (message === "0") {
    resetConversation(from);
    return "Cancelamento desistido. O que você gostaria de fazer? 😊";
  }

  const index = parseInt(message);

  if (isNaN(index) || index < 1 || index > ids.length) {
    return "Número inválido. Escolha um agendamento da lista ou digite 0 para desistir.";
  }

  const appointmentId = ids[index - 1]!;

  updateConversation(from, {
    step: ConversationStep.CONFIRM_CANCEL,
    serviceId: appointmentId,
  });

  return "Tem certeza que deseja cancelar?\nDigite 1 para confirmar, 2 para voltar à lista, ou 3 para desistir.";
}

/* -------------------------------------------------- */

export async function handleCancelConfirmation(from: string, message: string) {
  const conversation = getConversation(from);

  if (message === "1") {
    if (!conversation.serviceId) {
      resetConversation(from);
      return "Erro inesperado. Tente novamente.";
    }

    await service.execute(conversation.serviceId);

    resetConversation(from);
    return "✅ Agendamento cancelado com sucesso.";
  }

  if (message === "2") {
    updateConversation(from, {
      step: ConversationStep.ASK_CANCEL_SELECTION,
    });

    return "Escolha novamente o número do agendamento ou digite 0 para desistir.";
  }

  if (message === "3") {
    resetConversation(from);
    return "Cancelamento desistido. O que você gostaria de fazer? 😊";
  }

  return "Digite 1 para confirmar, 2 para voltar à lista, ou 3 para desistir.";
}