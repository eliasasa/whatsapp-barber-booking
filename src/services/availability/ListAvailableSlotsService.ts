import { prisma } from "../../lib/prisma";

export async function listAvailableSlots(dateStr: string): Promise<string[]> {

  const [day, month] = dateStr.split("/").map(Number);
  const year = new Date().getFullYear();

  const date = new Date(year, month! - 1, day);

  if (isNaN(date.getTime())) return [];

  const weekday = date.getDay();

  const availability = await prisma.availability.findFirst({
    where: { weekday },
  });

  if (!availability) return [];

  const dayStart = new Date(`${date.toISOString().split("T")[0]}T${availability.startTime}`);
  const dayEnd = new Date(`${date.toISOString().split("T")[0]}T${availability.endTime}`);

  const appointments = await prisma.appointment.findMany({
    where: {
      status: "CONFIRMED",
      startAt: { gte: dayStart, lt: dayEnd },
    },
  });

  const slots: string[] = [];
  const slotDuration = 30; // minutos

  let current = new Date(dayStart);

  while (current < dayEnd) {
    const end = new Date(current.getTime() + slotDuration * 60000);

    const conflict = appointments.some(a =>
      current < a.endAt && end > a.startAt
    );

    if (!conflict && end <= dayEnd) {
      slots.push(current.toTimeString().slice(0, 5));
    }

    current = new Date(current.getTime() + slotDuration * 60000);
  }

  return slots;
}