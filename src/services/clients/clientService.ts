import { prisma } from "../../lib/prisma";
import { normalizePhone } from "../../utils/phone";
import { resolvePhoneFromLid } from "../../whatsapp/wahaClient";

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

export async function getOrCreateClientFromChatId(
  chatId: string,
  session = "default",
  name?: string
) {
  const fallbackKey = normalizePhone(chatId);

  // Fluxo clássico com @c.us
  if (chatId.endsWith("@c.us")) {
    return getOrCreateClient(fallbackKey, name);
  }

  // Quando vier @lid, tentamos resolver para número real via WAHA Lids.
  const resolvedPhone = chatId.endsWith("@lid")
    ? await resolvePhoneFromLid(chatId, session)
    : null;

  if (resolvedPhone) {
    const existingByRealPhone = await prisma.client.findUnique({
      where: { phone: resolvedPhone },
    });

    if (existingByRealPhone) {
      return existingByRealPhone;
    }

    const existingByFallback = await prisma.client.findUnique({
      where: { phone: fallbackKey },
    });

    if (existingByFallback) {
      return prisma.client.update({
        where: { id: existingByFallback.id },
        data: {
          phone: resolvedPhone,
          ...(name ? { name } : {}),
        },
      });
    }

    return getOrCreateClient(resolvedPhone, name);
  }

  // Fallback quando não foi possível resolver para número real.
  return getOrCreateClient(fallbackKey, name);
}

export async function updateClientName(clientId: string, name: string) {
  return prisma.client.update({
    where: { id: clientId },
    data: { name },
  });
}

type UpdateClientFromPanelInput = {
  clientId: string;
  name?: string;
  notes?: string | null;
};

export async function updateClientFromPanel({
  clientId,
  name,
  notes,
}: UpdateClientFromPanelInput) {
  const data: { name?: string; notes?: string | null } = {};

  if (typeof name === "string") {
    data.name = name;
  }

  if (typeof notes === "string" || notes === null) {
    data.notes = notes;
  }

  return prisma.client.update({
    where: { id: clientId },
    data,
  });
}

export async function getClientById(clientId: string) {
  return prisma.client.findUnique({
    where: { id: clientId },
    include: {
      appointments: {
        orderBy: {
          startAt: "desc",
        },
        include: {
          service: true,
        },
      },
    },
  });
}
