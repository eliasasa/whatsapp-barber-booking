import { prisma } from "../lib/prisma";

class CancelAppointmentService {
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

    const updated = await prisma.appointment.update({
      where: { id },
      data: { status: "CANCELED" },
    });

    return updated;
  }
}

export { CancelAppointmentService };
