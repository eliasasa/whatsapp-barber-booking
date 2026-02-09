import { getConversation, updateConversation, resetConversation, clearPendingIntent } from "./conversationStore";
import { ConversationStep } from "./conversationTypes";
import { detectIntent } from "./intents";
import { replies } from "./replies";
import { getPromptForStep } from "./conversationPrompts";
import { detectCommand } from "./commandDetector";
import { COMMANDS } from "./commands";

const FLOW_STARTING_INTENTS = ["BOOK", "CHECK_AVAILABILITY"];

export function handleIncomingMessage(from: string, text: string): string | null  {
    const message = text.trim().toLowerCase();
    let conversation = getConversation(from);

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
                    serviceId: "CORTE",
                });
                return "Perfeito ✂️\nQual dia você deseja? (ex: 25/02)";
            }

            if (message === "2") {
                updateConversation(from, {
                    step: ConversationStep.ASK_DATE,
                    serviceId: "BARBA",
                });
                return "Perfeito 🧔\nQual dia você deseja? (ex: 25/02)";
            }

            return "Por favor, escolha 1️⃣ Corte ou 2️⃣ Barba";

        case ConversationStep.ASK_DATE:
            updateConversation(from, {
                step: ConversationStep.ASK_TIME,
                date: message,
            });
            return "Ótimo 📅\nAgora me diga o horário (ex: 14:30)";

        case ConversationStep.ASK_TIME:
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

        case ConversationStep.CONFIRM:
            if (message === "1") {
                resetConversation(from);
                return "✅ Agendamento confirmado! Até lá 👊";
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
