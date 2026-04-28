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

  const blocks = await prisma.availabilityBlock.findMany({
    where: {
      startAt: { lt: dayEnd },
      endAt: { gt: dayStart },
    },
  });

  const slots: string[] = [];
  const slotDuration = 30; // minutos

  let current = new Date(dayStart);

  while (current < dayEnd) {
    const end = new Date(current.getTime() + slotDuration * 60000);

    const conflictWithAppointment = appointments.some(a =>
      current < a.endAt && end > a.startAt
    );

    const conflictWithBlock = blocks.some(b =>
      current < b.endAt && end > b.startAt
    );

    const conflict = conflictWithAppointment || conflictWithBlock;

    if (!conflict && end <= dayEnd) {
      slots.push(current.toTimeString().slice(0, 5));
    }

    current = new Date(current.getTime() + slotDuration * 60000);
  }

  return slots;
}

export type DayAvailabilityStatus = "available" | "partial" | "unavailable" | "invalid";

export interface DayAvailabilityResult {
  status: DayAvailabilityStatus;
  dateLabel: string;
  slots: string[];
  reasons: string[];
}

export async function getDayAvailability(dateStr: string): Promise<DayAvailabilityResult> {
  const [day, month] = dateStr.split("/").map(Number);
  const year = new Date().getFullYear();

  const date = new Date(year, month! - 1, day);

  if (isNaN(date.getTime())) {
    return {
      status: "invalid",
      dateLabel: dateStr,
      slots: [],
      reasons: ["Data inválida"],
    };
  }

  const weekday = date.getDay();
  const availability = await prisma.availability.findFirst({
    where: { weekday },
  });

  if (!availability) {
    return {
      status: "unavailable",
      dateLabel: dateStr,
      slots: [],
      reasons: ["Não há expediente configurado para esse dia da semana"],
    };
  }

  const dayStart = new Date(`${date.toISOString().split("T")[0]}T${availability.startTime}`);
  const dayEnd = new Date(`${date.toISOString().split("T")[0]}T${availability.endTime}`);

  const appointments = await prisma.appointment.findMany({
    where: {
      status: "CONFIRMED",
      startAt: { gte: dayStart, lt: dayEnd },
    },
  });

  const blocks = await prisma.availabilityBlock.findMany({
    where: {
      startAt: { lt: dayEnd },
      endAt: { gt: dayStart },
    },
  });

  const slots: string[] = [];
  const slotDuration = 30;

  let current = new Date(dayStart);

  while (current < dayEnd) {
    const end = new Date(current.getTime() + slotDuration * 60000);

    const conflictWithAppointment = appointments.some((a) => current < a.endAt && end > a.startAt);
    const conflictWithBlock = blocks.some((b) => current < b.endAt && end > b.startAt);
    const conflict = conflictWithAppointment || conflictWithBlock;

    if (!conflict && end <= dayEnd) {
      slots.push(current.toTimeString().slice(0, 5));
    }

    current = new Date(current.getTime() + slotDuration * 60000);
  }

  const reasons = blocks.map((block) => {
    if (block.reason?.trim()) return block.reason.trim();

    const blockStart = block.startAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    const blockEnd = block.endAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    return `Bloqueado de ${blockStart} até ${blockEnd}`;
  });

  if (!slots.length) {
    return {
      status: "unavailable",
      dateLabel: dateStr,
      slots,
      reasons: reasons.length
        ? reasons
        : ["Não há horários disponíveis nesse dia"],
    };
  }

  return {
    status: blocks.length ? "partial" : "available",
    dateLabel: dateStr,
    slots,
    reasons,
  };
}