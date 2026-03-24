import { prisma } from "../../lib/prisma";

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
  endAt: Date,
  address?: string,
  notes?: string
) {
  return prisma.appointment.create({
    data: {
      clientId,
      serviceId,
      startAt,
      endAt,
      address: address ?? null,
      notes: notes ?? null,
    },
  });
}
