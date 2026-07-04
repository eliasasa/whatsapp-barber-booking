import { prisma } from "../lib/prisma";

export const BOT_NAME = process.env.BOT_NAME || "Elias";

export async function getServiceType(): Promise<"LOCAL" | "MOBILE"> {
  const botState = await prisma.botState.findFirst();
  return botState?.serviceType ?? "LOCAL";
}