import { prisma } from "../src/lib/prisma";
import { BOT_NAME } from "../src/global/botConfig";
import bcrypt from "bcryptjs";

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD?.trim();
  const adminName = process.env.ADMIN_NAME?.trim() || null;

  if (adminEmail && adminPassword) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);

    await prisma.adminUser.upsert({
      where: { email: adminEmail },
      update: {
        name: adminName,
        passwordHash,
        active: true,
      },
      create: {
        email: adminEmail,
        name: adminName,
        passwordHash,
      },
    });
  }

  // Services
  await prisma.service.createMany({
    data: [
      { name: "Corte", duration: 30, price: 30 },
      { name: "Barba", duration: 20, price: 20 },
      { name: "Corte + Barba", duration: 50, price: 45 },
    ],
    skipDuplicates: true,
  });

  // Availability
  await prisma.availability.createMany({
    data: [
      // Segunda a Sexta
      { weekday: 1, startTime: "09:00:00", endTime: "18:00:00" },
      { weekday: 2, startTime: "09:00:00", endTime: "18:00:00" },
      { weekday: 3, startTime: "09:00:00", endTime: "18:00:00" },
      { weekday: 4, startTime: "09:00:00", endTime: "18:00:00" },
      { weekday: 5, startTime: "09:00:00", endTime: "18:00:00" },

      // Sábado
      { weekday: 6, startTime: "09:00:00", endTime: "13:00:00" },
    ],
    skipDuplicates: true,
  });

  await prisma.botMessage.upsert({
    where: { key: "GREETING" },
    update: {},
    create: {
      key: "GREETING",
      content:
        `Oi! 👋 Sou o assistente do ${BOT_NAME}.\n\nVocê pode:\n - Agendar um horário\n - Ver horários disponíveis\n\nÉ só me dizer o que você quer 😊`,
    },
  });

  // Availability blocks (holidays / partial days)
  const year = new Date().getFullYear();

  // Full day blocked: Christmas (25 Dec)
  const christmasStart = new Date(year, 11, 25, 0, 0, 0);
  const christmasEnd = new Date(year, 11, 26, 0, 0, 0);

  // Partial day: only 09:00-13:00 available (block from 13:00 onwards)
  const partialDay = new Date(year, 11, 24, 0, 0, 0);
  const partialBlockStart = new Date(year, 11, 24, 13, 0, 0);
  const partialBlockEnd = new Date(year, 11, 24, 23, 59, 59);

  // Remove any existing blocks for those ranges and insert
  await prisma.availabilityBlock.deleteMany({
    where: {
      OR: [
        { startAt: { gte: christmasStart, lt: christmasEnd } },
        { startAt: { gte: partialDay, lt: new Date(year, 11, 25, 0, 0, 0) } },
      ],
    },
  });

  await prisma.availabilityBlock.createMany({
    data: [
      {
        startAt: christmasStart,
        endAt: christmasEnd,
        reason: "Natal - fechado",
      },
      {
        startAt: partialBlockStart,
        endAt: partialBlockEnd,
        reason: "Abertura parcial — somente 09:00-13:00",
      },
    ],
  });
}

main().finally(() => prisma.$disconnect());
