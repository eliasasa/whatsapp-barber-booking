import { prisma } from "../../lib/prisma";

interface CreateAppointmentRequest {
  clientId: string;
  serviceId: string;
  startAt: string; // formato esperado: YYYY-MM-DDTHH:mm
  address: string;
}

class CreateAppointmentService {
  async execute({ clientId, serviceId, startAt, address }: CreateAppointmentRequest) {
    if (!clientId || !serviceId || !startAt || !address) {
      throw new Error("Campos obrigatórios ausentes");
    }

    console.log("START_AT RECEBIDO:", startAt);

    const [datePart, timePart] = startAt.split("T");

    if (!datePart || !timePart) {
      throw new Error("Formato de data inválido");
    }

    const [year, month, day] = datePart.split("-").map(Number);
    const [hour, minute] = timePart.split(":").map(Number);

    const start = new Date();
    start.setFullYear(year!);
    start.setMonth(month! - 1);
    start.setDate(day!);
    start.setHours(hour!, minute, 0, 0);

    if (isNaN(start.getTime())) {
      throw new Error("Data inválida");
    }

    // Impedir agendamento no passado
    const now = new Date();
    if (start < now) {
      throw new Error("Não é possível agendar no passado");
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

    // Criar horário de expediente
    const dayStart = new Date(start);
    dayStart.setHours(
      Number(availability.startTime.split(":")[0]),
      Number(availability.startTime.split(":")[1]),
      0,
      0
    );

    const dayEnd = new Date(start);
    dayEnd.setHours(
      Number(availability.endTime.split(":")[0]),
      Number(availability.endTime.split(":")[1]),
      0,
      0
    );

    // Validar expediente
    if (start < dayStart || end > dayEnd) {
      throw new Error("Horário fora do expediente");
    }

    // SLOT FIXO (alinhado ao início do expediente)
    const SLOT_INTERVAL = 30; // minutos

    const diffFromOpening =
      (start.getTime() - dayStart.getTime()) / 60000;

    if (diffFromOpening % SLOT_INTERVAL !== 0) {
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
        address,
        status: "CONFIRMED",
      },
    });

    return appointment;
  }
}

export { CreateAppointmentService };