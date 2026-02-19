import { normalizePhone } from "../../../utils/phone";
import { getOrCreateClient } from "../../../services/clients/clientService";
import {
  createAppointment,
  checkTimeConflict,
} from "../../../services/appointments/appointmentService";
import { prisma } from "../../../lib/prisma";

export async function confirmBooking(from: string, conversation: any) {
  const phone = normalizePhone(from);
  const client = await getOrCreateClient(phone);

  if (!conversation.serviceId) {
    return { error: "Serviço inválido." };
  }

  const service = await prisma.service.findFirst({
    where: {
      name: { equals: conversation.serviceId, mode: "insensitive" },
    },
  });

  if (!service) {
    return { error: "Serviço não encontrado." };
  }

  if (!conversation.date || !conversation.time) {
    return { error: "Dados inválidos." };
  }

  const [day, month] = conversation.date.split("/");
  const year = new Date().getFullYear();

  const startAt = new Date(
    `${year}-${month}-${day}T${conversation.time}:00`
  );

  const endAt = new Date(
    startAt.getTime() + service.duration * 60000
  );

  const hasConflict = await checkTimeConflict(startAt, endAt);

  if (hasConflict) {
    return { conflict: true };
  }

  await createAppointment(
    client.id,
    service.id,
    startAt,
    endAt,
    conversation.address ?? undefined
  );

  return { success: true };
}
