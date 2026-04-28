import { prisma } from "../../lib/prisma";
import { getDefaultGreetingMessage } from "../../whatsapp/replies";

export async function getGreetingMessage(): Promise<string> {
  const message = await prisma.botMessage.findUnique({
    where: { key: "GREETING" },
  });

  return message?.content || getDefaultGreetingMessage();
}

export async function updateGreetingMessage(content: string) {
  const normalizedContent = content.trim();

  if (!normalizedContent) {
    throw new Error("Mensagem invalida");
  }

  return prisma.botMessage.upsert({
    where: { key: "GREETING" },
    update: { content: normalizedContent },
    create: {
      key: "GREETING",
      content: normalizedContent,
    },
  });
}
