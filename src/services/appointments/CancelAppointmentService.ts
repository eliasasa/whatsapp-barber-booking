import { prisma } from "../../lib/prisma";

class CancelAppointmentService {
  async listClientAppointments(phone: string) {
    const now = new Date();

    return prisma.appointment.findMany({
      where: {
        client: { phone },
        status: "CONFIRMED",
        startAt: { gte: now },
      },
      include: {
        service: true,
      },
      orderBy: { startAt: "asc" },
    });
  }

  async execute(id: string) {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      const error: any = new Error("Agendamento não encontrado");
      error.statusCode = 404;
      throw error;
    }

    if (appointment.status === "CANCELED") {
      throw new Error("Agendamento já cancelado");
    }

    return prisma.appointment.update({
      where: { id },
      data: { status: "CANCELED" },
    });
  }
}

export { CancelAppointmentService };