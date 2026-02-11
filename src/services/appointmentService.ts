import { prisma } from "../lib/prisma";

export async function checkTimeConflict(startAt: Date, endAt: Date) {
  const conflict = await prisma.appointment.findFirst({
    where: {
      status: "CONFIRMED",
      OR: [
        {
          startAt: { lt: endAt },
          endAt: { gt: startAt },
        },
      ],
    },
  });

  return !!conflict;
}

export async function createAppointment(
  clientId: string,
  serviceId: string,
  startAt: Date,
  endAt: Date
) {
  return prisma.appointment.create({
    data: {
      clientId,
      serviceId,
      startAt,
      endAt,
    },
  });
}
