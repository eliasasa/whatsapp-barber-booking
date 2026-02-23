import { normalizePhone } from "../../../utils/phone";
import { getOrCreateClient } from "../../../services/clients/clientService";
import { CreateAppointmentService } from "../../../services/appointments/createAppointmentService";
import { prisma } from "../../../lib/prisma";

export async function confirmBooking(from: string, conversation: any) {
  const phone = normalizePhone(from);
  const client = await getOrCreateClient(phone);

  if (!conversation.serviceId) {
    return { error: "Serviço inválido." };
  }

  const service = await prisma.service.findUnique({
    where: { id: conversation.serviceId },
  });

  if (!service) {
    return { error: "Serviço não encontrado." };
  }

  if (!conversation.date || !conversation.time) {
    return { error: "Dados inválidos." };
  }

  const [day, month] = conversation.date.split("/");
  const year = new Date().getFullYear();

  const formattedDay = day.padStart(2, "0");
  const formattedMonth = month.padStart(2, "0");

  const startAtString = `${year}-${formattedMonth}-${formattedDay}T${conversation.time}`;

  const appointmentService = new CreateAppointmentService();

  try {
    await appointmentService.execute({
      clientId: client.id,
      serviceId: service.id,
      startAt: startAtString,
      address: conversation.address,
    });

    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}