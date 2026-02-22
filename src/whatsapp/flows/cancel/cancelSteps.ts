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

  message += "\nDigite o número do agendamento que deseja cancelar.";

  return message;
}

/* -------------------------------------------------- */

export async function handleCancelSelection(from: string, message: string) {
  const conversation = getConversation(from);
  const ids: string[] = conversation.notes ? JSON.parse(conversation.notes) : [];

  const index = parseInt(message);

  if (isNaN(index) || index < 1 || index > ids.length) {
    return "Número inválido. Escolha um agendamento da lista.";
  }

  const appointmentId = ids[index - 1]!;

  updateConversation(from, {
    step: ConversationStep.CONFIRM_CANCEL,
    serviceId: appointmentId,
  });

  return "Tem certeza que deseja cancelar?\nDigite 1️⃣ para confirmar ou 2️⃣ para voltar.";
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

    return "Escolha novamente o número do agendamento.";
  }

  return "Digite 1️⃣ para confirmar ou 2️⃣ para voltar.";
}