import { prisma } from "../src/lib/prisma";

async function main() {
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
}

main().finally(() => prisma.$disconnect());
