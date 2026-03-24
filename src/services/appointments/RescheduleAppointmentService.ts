import { prisma } from "../../lib/prisma";

interface Request {
  id: string;
  newStartAt: string;
}

class RescheduleAppointmentService {
  async execute({ id, newStartAt }: Request) {
    if (!newStartAt) {
      throw new Error("Nova data inválida");
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { service: true },
    });

    if (!appointment) {
      const error: any = new Error("Agendamento não encontrado");
      error.statusCode = 404;
      throw error;
    }

    if (appointment.status === "CANCELED") {
      throw new Error("Agendamento cancelado");
    }

    const start = new Date(newStartAt);
    const end = new Date(
      start.getTime() + appointment.service.duration * 60000
    );

    const conflict = await prisma.appointment.findFirst({
      where: {
        id: { not: id },
        status: "CONFIRMED",
        startAt: { lt: end },
        endAt: { gt: start },
      },
    });

    if (conflict) {
      const error: any = new Error("Horário ocupado");
      error.statusCode = 409;
      throw error;
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        startAt: start,
        endAt: end,
      },
    });

    return updated;
  }
}

export { RescheduleAppointmentService };
