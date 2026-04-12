import { prisma } from "../../lib/prisma";

class GetAppointmentByIdService {
  async execute(id: string) {
    return prisma.appointment.findUnique({
      where: { id },
      include: {
        client: true,
        service: true,
      },
    });
  }
}

export { GetAppointmentByIdService };