import { prisma } from "../../lib/prisma";

const SINGLETON_ID = "global";

export async function getBotState() {
  let state = await prisma.botState.findUnique({ where: { id: SINGLETON_ID } });

  if (!state) {
    state = await prisma.botState.create({ data: { id: SINGLETON_ID, paused: false } });
  }

  return state;
}

export async function updateBotState(paused: boolean) {
  const updated = await prisma.botState.upsert({
    where: { id: SINGLETON_ID },
    create: { id: SINGLETON_ID, paused },
    update: { paused },
  });

  return updated;
}

export async function touchBotPing() {
  const now = new Date();
  const updated = await prisma.botState.upsert({
    where: { id: SINGLETON_ID },
    create: { id: SINGLETON_ID, paused: false, lastPing: now },
    update: { lastPing: now },
  });
  return updated;
}
