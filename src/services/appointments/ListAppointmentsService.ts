import { prisma } from "../../lib/prisma";

class ListAppointmentsService {
  async execute() {
    return prisma.appointment.findMany({
      orderBy: { startAt: "asc" },
      include: {
        client: true,
        service: true,
      },
    });
  }
}

export { ListAppointmentsService };
