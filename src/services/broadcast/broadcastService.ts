import { prisma } from "../../lib/prisma";
import { sendMessage } from "../../whatsapp/wahaClient";

// ── Tipos ──────────────────────────────────────────────────────────────────

export type BroadcastFilter = {
  all?: boolean;
  inactiveDays?: number;      // clientes sem agendamento há X dias
  serviceId?: string;         // clientes que fizeram determinado serviço
  neverUsedServiceId?: string; // clientes que NUNCA fizeram determinado serviço
};

type StartBroadcastInput = {
  message: string;
  filter?: BroadcastFilter;
  session?: string;
};

// ── Helpers ────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function delayBetweenMessages(): number {
  // 10 a 20 segundos com valor quebrado
  return Math.floor(Math.random() * 10_000 + 10_000);
}

function delayBetweenBatches(): number {
  // 25 a 40 segundos entre lotes
  return Math.floor(Math.random() * 15_000 + 25_000);
}

const BATCH_SIZE = 10;

// ── Filtro de clientes ─────────────────────────────────────────────────────

async function resolveClients(filter: BroadcastFilter) {
  // Clientes precisam ter phone cadastrado e bot ativo
  const base = {
    phone: { not: null },
    botDisabled: false,
  } as const;

  if (filter.inactiveDays) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - filter.inactiveDays);

    return prisma.client.findMany({
      where: {
        ...base,
        appointments: {
          none: { startAt: { gte: cutoff } },
        },
      },
      select: { id: true, phone: true },
    });
  }

  if (filter.serviceId) {
    return prisma.client.findMany({
      where: {
        ...base,
        appointments: {
          some: { serviceId: filter.serviceId, status: "CONFIRMED" },
        },
      },
      select: { id: true, phone: true },
    });
  }

  if (filter.neverUsedServiceId) {
    return prisma.client.findMany({
      where: {
        ...base,
        appointments: {
          none: { serviceId: filter.neverUsedServiceId },
        },
      },
      select: { id: true, phone: true },
    });
  }

  // Padrão: todos os clientes com phone
  return prisma.client.findMany({
    where: base,
    select: { id: true, phone: true },
  });
}

// ── Service principal ──────────────────────────────────────────────────────

export class BroadcastService {
  /**
   * Inicia um broadcast em background.
   * Retorna o id do Broadcast criado imediatamente.
   * O envio acontece de forma assíncrona — não bloqueia o bot.
   */
  async start(input: StartBroadcastInput): Promise<string> {
    const filter = input.filter ?? { all: true };
    const session = input.session ?? "default";

    const clients = await resolveClients(filter);

    if (!clients.length) {
      throw new Error("Nenhum cliente encontrado para os critérios informados.");
    }

    // Cria o registro do broadcast
    const broadcast = await prisma.broadcast.create({
      data: {
        message: input.message,
        filter: JSON.stringify(filter),
        status: "RUNNING",
        totalSent: 0,
      },
    });

    // Dispara em background sem bloquear
    this.runBroadcast(broadcast.id, clients, input.message, session).catch(
      async (err) => {
        console.error("❌ Erro durante broadcast:", err);
        await prisma.broadcast.update({
          where: { id: broadcast.id },
          data: { status: "FAILED", finishedAt: new Date() },
        });
      }
    );

    return broadcast.id;
  }

  private async runBroadcast(
    broadcastId: string,
    clients: { id: string; phone: string | null }[],
    message: string,
    session: string
  ): Promise<void> {
    let totalSent = 0;

    for (let i = 0; i < clients.length; i++) {
      const client = clients[i]!;

      if (!client.phone) continue;

      const chatId = `${client.phone}@c.us`;

      try {
        await sendMessage({ to: chatId, text: message, session });

        // Registra no log
        await prisma.broadcastLog.create({
          data: {
            broadcastId,
            clientId: client.id,
          },
        });

        totalSent++;

        // Atualiza contador em tempo real
        await prisma.broadcast.update({
          where: { id: broadcastId },
          data: { totalSent },
        });
      } catch (err) {
        console.error(`❌ Falha ao enviar para ${client.phone}:`, err);
      }

      const isLastInBatch = (i + 1) % BATCH_SIZE === 0;
      const isLast = i === clients.length - 1;

      if (!isLast) {
        const delay = isLastInBatch
          ? delayBetweenBatches()
          : delayBetweenMessages();
        await sleep(delay);
      }
    }

    // Finaliza
    await prisma.broadcast.update({
      where: { id: broadcastId },
      data: { status: "DONE", finishedAt: new Date(), totalSent },
    });

    console.log(`✅ Broadcast ${broadcastId} finalizado. Enviados: ${totalSent}`);
  }

  // ── Histórico ────────────────────────────────────────────────────────────

  async list() {
    return prisma.broadcast.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        message: true,
        filter: true,
        totalSent: true,
        status: true,
        createdAt: true,
        finishedAt: true,
      },
    });
  }

  async getById(id: string) {
    return prisma.broadcast.findUnique({
      where: { id },
      include: {
        logs: {
          include: { client: { select: { id: true, name: true, phone: true } } },
          orderBy: { sentAt: "asc" },
        },
      },
    });
  }
}