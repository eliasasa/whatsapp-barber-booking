import { prisma } from "../../lib/prisma";

interface Request {
  date: string; // YYYY-MM-DD
  serviceId: string;
}

class ListAvailableSlotsService {
  async execute({ date, serviceId }: Request) {
    if (!date || !serviceId) {
      throw new Error("Parâmetros inválidos");
    }

    const day = new Date(date + "T00:00:00");
    const weekday = day.getDay();

    const availability = await prisma.availability.findFirst({
      where: { weekday },
    });

    if (!availability) return [];

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) throw new Error("Serviço inválido");

    const appointments = await prisma.appointment.findMany({
      where: {
        startAt: {
          gte: new Date(`${date}T00:00:00`),
          lt: new Date(`${date}T23:59:59`),
        },
        status: "CONFIRMED",
      },
    });

    const slots: string[] = [];

    let current = new Date(`${date}T${availability.startTime}`);
    const end = new Date(`${date}T${availability.endTime}`);

    const SLOT_INTERVAL = 30;

    while (current.getTime() + service.duration * 60000 <= end.getTime()) {
      const slotEnd = new Date(
        current.getTime() + service.duration * 60000
      );

      const conflict = appointments.some((appointment) => {
        return current < appointment.endAt && slotEnd > appointment.startAt;
      });

      if (!conflict) {
        slots.push(
          current.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })
        );
      }

      current = new Date(current.getTime() + SLOT_INTERVAL * 60000);
    }

    return slots;
  }
}

export { ListAvailableSlotsService };