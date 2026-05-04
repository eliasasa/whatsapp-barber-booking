import { prisma } from "../../lib/prisma";

export async function listServices() {
  const services = await prisma.service.findMany({
    where: { paused: false },
    orderBy: { name: "asc" },
  });

  return services;
}
