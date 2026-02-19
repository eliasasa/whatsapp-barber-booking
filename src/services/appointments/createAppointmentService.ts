import { prisma } from "../../lib/prisma";

interface CreateAppointmentRequest {
  clientId: string;
  serviceId: string;
  startAt: string;
}

class CreateAppointmentService {
  async execute({ clientId, serviceId, startAt }: CreateAppointmentRequest) {
    if (!clientId || !serviceId || !startAt) {
      throw new Error("Campos obrigatórios ausentes");
    }

    const start = new Date(startAt);

    if (isNaN(start.getTime())) {
      throw new Error("Data inválida");
    }

    // Buscar serviço
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      throw new Error("Serviço não encontrado");
    }

    const end = new Date(start.getTime() + service.duration * 60000);

    // Validar disponibilidade do dia
    const weekday = start.getDay();

    const availability = await prisma.availability.findFirst({
      where: { weekday },
    });

    if (!availability) {
      throw new Error("Barbearia fechada neste dia");
    }

    const date = startAt.split("T")[0];

    const dayStart = new Date(`${date}T${availability.startTime}`);
    const dayEnd = new Date(`${date}T${availability.endTime}`);

    if (start < dayStart || end > dayEnd) {
      throw new Error("Horário fora do expediente");
    }

    // Validar alinhamento de slot
    if (start.getMinutes() % 30 !== 0) {
      throw new Error("Horário inválido");
    }

    // Verificar conflito
    const conflict = await prisma.appointment.findFirst({
      where: {
        status: "CONFIRMED",
        startAt: { lt: end },
        endAt: { gt: start },
      },
    });

    if (conflict) {
      const error: any = new Error("Horário já ocupado");
      error.statusCode = 409;
      throw error;
    }

    // Criar agendamento
    const appointment = await prisma.appointment.create({
      data: {
        clientId,
        serviceId,
        startAt: start,
        endAt: end,
        status: "CONFIRMED",
      },
    });

    return appointment;
  }
}

export { CreateAppointmentService };
