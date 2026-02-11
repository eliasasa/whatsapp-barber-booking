import { prisma } from "../src/lib/prisma";

async function main() {
  await prisma.service.createMany({
    data: [
      { name: "Corte", duration: 30, price: 30 },
      { name: "Barba", duration: 20, price: 20 },
      { name: "Corte + Barba", duration: 50, price: 45 },
    ],
    skipDuplicates: true,
  });
}

main().finally(() => prisma.$disconnect());
