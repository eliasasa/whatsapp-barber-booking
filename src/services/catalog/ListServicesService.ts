import { prisma } from "../../lib/prisma";

export async function listServices() {
  const services = await prisma.service.findMany({
    orderBy: { name: "asc" },
  });

  return services;
}
