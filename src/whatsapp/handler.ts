import { getConversation, updateConversation, resetConversation, clearPendingIntent } from "./conversationStore";
import { ConversationStep } from "./conversationTypes";
import { detectIntent } from "./intents";
import { replies } from "./replies";
import { getPromptForStep } from "./conversationPrompts";
import { detectCommand } from "./commandDetector";
import { COMMANDS } from "./commands";
import { normalizePhone } from "../utils/phone";
import { getOrCreateClient } from "../services/clientService";
import { createAppointment, checkTimeConflict } from "../services/appointmentService";
import { prisma } from "../lib/prisma";


const FLOW_STARTING_INTENTS = ["BOOK", "CHECK_AVAILABILITY"];

export async function handleIncomingMessage(from: string, text: string): Promise<string | null>  {
    const message = text.trim().toLowerCase();
    let conversation = getConversation(from);

     updateConversation(from, { lastInteraction: Date.now() });

    // COMANDOS (#pause, #resume...)

    const command = detectCommand(message);

    if (command && COMMANDS[command]) {
        return COMMANDS[command]({
            from,
            isPaused: !!conversation.paused,
        });
    }

    // CONVERSA PAUSADA

    if (conversation.paused) {
        return null;
    }

    // Detecta intenção
    const intent = detectIntent(message);

    // CONFIRMAÇÃO DE TROCA DE FLUXO (pendingIntent)
    if (conversation.pendingIntent) {
        if (message === "1") {
            const newIntent = conversation.pendingIntent;
            resetConversation(from);

            if (newIntent === "BOOK") {
                updateConversation(from, { step: ConversationStep.ASK_SERVICE });
                return "Perfeito 👍\nQual serviço você deseja?\n1️⃣ Corte\n2️⃣ Barba";
            }

            if (newIntent === "CHECK_AVAILABILITY") {
                return "Claro 😊\nQual dia você deseja verificar?";
            }
        }

        if (message === "2") {
            clearPendingIntent(from);
            const updatedConversation = getConversation(from);

            return (
                "Beleza 😄 Vamos continuar de onde paramos.\n\n" +
                getPromptForStep(updatedConversation)
            );
        }


        return "Digite 1️⃣ para cancelar o fluxo atual ou 2️⃣ para continuar.";
    }

    // INTERCEPTA NOVO INTENT NO MEIO DO FLUXO
    if (
        conversation.step !== ConversationStep.START &&
        intent &&
        intent !== "GREETING" &&
        intent !== "CANCEL" &&
        FLOW_STARTING_INTENTS.includes(intent)
    ) {
        updateConversation(from, { pendingIntent: intent });

        return (
            "⚠️ Percebi que você quer iniciar outra ação.\n\n" +
            "Deseja cancelar o agendamento atual e começar um novo?\n" +
            "Digite 1️⃣ para sim ou 2️⃣ para continuar."
        );
    }

    // GREETING
    if (intent === "GREETING") {
        return replies.greeting + "\n" + getPromptForStep(conversation);
    }

    // INTENTS DIRETOS
    switch (intent) {
        case "CANCEL":
            resetConversation(from);
            return "❌ Agendamento cancelado. Se quiser, é só chamar novamente.";

        case "CHECK_AVAILABILITY":
            return "Claro! 😊 Me diga o dia que quer verificar.";

        case "BOOK":
            if (conversation.step === ConversationStep.START) {
                updateConversation(from, { step: ConversationStep.ASK_SERVICE });
                return "Ótimo! 👋\nQual serviço você deseja?\n1️⃣ Corte\n2️⃣ Barba";
            }
            break;
    }

    // FLUXO BASEADO EM STEP
    switch (conversation.step) {
        case ConversationStep.START:
            updateConversation(from, { step: ConversationStep.ASK_SERVICE });
            return "Olá! 👋\nQual serviço você deseja?\n1️⃣ Corte\n2️⃣ Barba";

        case ConversationStep.ASK_SERVICE:
            if (message === "1") {
                updateConversation(from, {
                    step: ConversationStep.ASK_DATE,
                    serviceId: "Corte",
                });
                return "Perfeito ✂️\nQual dia você deseja? (ex: 25/02)";
            }

            if (message === "2") {
                updateConversation(from, {
                    step: ConversationStep.ASK_DATE,
                    serviceId: "Barba",
                });
                return "Perfeito 🧔\nQual dia você deseja? (ex: 25/02)";
            }

            return "Por favor, escolha 1️⃣ Corte ou 2️⃣ Barba";

        case ConversationStep.ASK_DATE: {
            if (!/^\d{2}\/\d{2}$/.test(message)) {
                return "📅 Data inválida.\nUse o formato DD/MM (ex: 25/02).";}

            const [dayStr, monthStr] = message.split("/");
            const day = Number(dayStr);
            const month = Number(monthStr);
            const year = new Date().getFullYear();

            const testDate = new Date(year, month - 1, day);

            // Verifica se a data realmente existe
            if (
                testDate.getFullYear() !== year ||
                testDate.getMonth() !== month - 1 ||
                testDate.getDate() !== day
            ) {
                return "📅 Data inválida. Verifique o dia e o mês.";
            }

            // Bloquear datas passadas
            if (testDate < new Date()) {
                return "⚠️ Não é possível agendar para datas passadas.";
            }

            updateConversation(from, {
                step: ConversationStep.ASK_TIME,
                date: message,
            });

            return "Ótimo 📅\nAgora me diga o horário (ex: 14:30)";
        }


        case ConversationStep.ASK_TIME: {
            if (!/^\d{2}:\d{2}$/.test(message)) {
                return "⏰ Horário inválido.\nUse o formato HH:mm (ex: 14:30)";
            }

            const [hourStr, minuteStr] = message.split(":");
            const hour = Number(hourStr);
            const minute = Number(minuteStr);

            if (hour > 23 || minute > 59) {
                return "⏰ Horário inválido.";
            }

            // Horário comercial (Futuramente saira da DB)
            if (hour < 9 || hour >= 18) {
                return "🕒 Nosso horário é das 09:00 às 18:00.";
            }

            updateConversation(from, {
                step: ConversationStep.CONFIRM,
                time: message,
            });

            conversation = getConversation(from);

            return (
                "Confirme seu agendamento:\n\n" +
                `📌 Serviço: ${conversation.serviceId}\n` +
                `📅 Data: ${conversation.date}\n` +
                `⏰ Horário: ${conversation.time}\n\n` +
                "Digite 1️⃣ para confirmar ou 2️⃣ para cancelar"
            );
        }

        
        case ConversationStep.CONFIRM:
            if (message === "1") {
                const currentConversation = getConversation(from);

                try {
                    const phone = normalizePhone(from);

                    const client = await getOrCreateClient(phone);

                    const serviceName = currentConversation.serviceId;

                    if (!serviceName) return null;

                    const service = await prisma.service.findFirst({
                        where: {
                            name: {
                                equals: serviceName,
                                mode: "insensitive",
                            },
                        },
                    });

                    if (!service) {
                        resetConversation(from);
                        return "Serviço não encontrado. Vamos começar novamente.";
                    }

                    // Converter data (dd/mm) para formato ISO
                    const [day, month] = currentConversation.date!.split("/");
                    const year = new Date().getFullYear();

                    if (!currentConversation.date || !currentConversation.time) {
                        resetConversation(from);
                        return "Dados inválidos. Vamos começar novamente.";
                    }

                    const startAt = new Date(
                        `${year}-${month}-${day}T${currentConversation.time}:00`
                    );

                    // Calcular fim baseado na duração
                    const endAt = new Date(
                        startAt.getTime() + service.duration * 60000
                    );

                    // Verificar conflito
                    const hasConflict = await checkTimeConflict(startAt, endAt);

                    if (hasConflict) {
                        updateConversation(from, {
                            step: ConversationStep.ASK_TIME,
                        });

                        return "⚠️ Esse horário já está ocupado. Escolha outro horário.";
                    }

                    // Criar agendamento
                    await createAppointment(
                        client.id,
                        service.id,
                        startAt,
                        endAt
                    );

                    resetConversation(from);

                    return "✅ Agendamento confirmado com sucesso! 💈";

                } catch (error) {
                    console.error(error);
                    resetConversation(from);
                    return "Ocorreu um erro ao confirmar. Tente novamente.";
                }
            }

            if (message === "2") {
                resetConversation(from);
                return "❌ Agendamento cancelado. Se quiser, é só chamar novamente.";
            }

            return "Digite 1️⃣ para confirmar ou 2️⃣ para cancelar";



        default:
            resetConversation(from);
            return "Vamos começar de novo 🙂\nDigite qualquer coisa.";
    }
}
