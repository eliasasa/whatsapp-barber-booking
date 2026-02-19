import { prisma } from "../../lib/prisma";

export async function getOrCreateClient(phone: string, name?: string) {
  let client = await prisma.client.findUnique({
    where: { phone },
  });

  if (!client) {
    client = await prisma.client.create({
      data: {
        phone,
        name: name ?? null,
        }
    });
  }

  return client;
}
