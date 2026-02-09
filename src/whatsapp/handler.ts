import { getConversation, updateConversation, resetConversation } from "./conversationStore";
import { ConversationStep } from "./conversationTypes";
import { detectIntent } from "./intents";
import { replies } from "./replies";

export function handleIncomingMessage(from: string, text: string): string {
    const message = text.trim().toLowerCase();
    let conversation = getConversation(from);

    // Detecta intenção
    const intent = detectIntent(message);

    // COMENTARIO PESSOAL: PRECISO FAZER COM QUE O BOT IDENTIFIQUE SE O USUÁRIO CITOU UM INTENT NO MEIO DE UM FLUXO // COMANDO DE BLOQUEAR RESPOSTAS AUTOMÁTICAS

    if (intent === "GREETING") {
        // Monta a mensagem base de saudação
        let reply = replies.greeting;

        // Adiciona dica do próximo passo do fluxo, se não estiver no START
        switch (conversation.step) {
            case ConversationStep.ASK_SERVICE:
                reply += "\nQual serviço você deseja?\n1️⃣ Corte\n2️⃣ Barba";
                break;
            case ConversationStep.ASK_DATE:
                reply += `\nÓtimo! Qual dia você deseja marcar para ${conversation.serviceId}? (ex: 25/02)`;
                break;
            case ConversationStep.ASK_TIME:
                reply += `\nAgora me diga o horário para ${conversation.serviceId} em ${conversation.date} (ex: 14:30)`;
                break;
            case ConversationStep.CONFIRM:
                reply += `\nConfirme seu agendamento:\n📌 Serviço: ${conversation.serviceId}\n📅 Data: ${conversation.date}\n⏰ Horário: ${conversation.time}\nDigite 1️⃣ para confirmar ou 2️⃣ para cancelar`;
                break;
            default:
                break;
        }

        return reply;
    }

    // --- Outras intenções ---
    switch (intent) {
        case "CANCEL":
            resetConversation(from);
            return "❌ Agendamento cancelado. Se quiser, é só chamar novamente.";
        case "CHECK_AVAILABILITY":
            return "Claro! Me diga o dia que quer verificar.";
        case "BOOK":
            if (conversation.step === ConversationStep.START) {
                updateConversation(from, { step: ConversationStep.ASK_SERVICE });
                return "Ótimo! 👋\nQual serviço você deseja?\n1️⃣ Corte\n2️⃣ Barba";
            }
            break;
        default:
            break;
    }

    // --- Fluxo baseado em step ---
    switch (conversation.step) {
        case ConversationStep.START:
            updateConversation(from, { step: ConversationStep.ASK_SERVICE });
            return "Olá! 👋\nQual serviço você deseja?\n1️⃣ Corte\n2️⃣ Barba";

        case ConversationStep.ASK_SERVICE:
            if (message === "1") {
                updateConversation(from, { step: ConversationStep.ASK_DATE, serviceId: "CORTE" });
                return "Perfeito ✂️\nQual dia você deseja? (ex: 25/02)";
            }
            if (message === "2") {
                updateConversation(from, { step: ConversationStep.ASK_DATE, serviceId: "BARBA" });
                return "Perfeito 🧔\nQual dia você deseja? (ex: 25/02)";
            }
            return "Por favor, escolha 1️⃣ Corte ou 2️⃣ Barba";

        case ConversationStep.ASK_DATE:
            updateConversation(from, { step: ConversationStep.ASK_TIME, date: message });
            return "Ótimo 📅\nAgora me diga o horário (ex: 14:30)";

        case ConversationStep.ASK_TIME:
            updateConversation(from, { step: ConversationStep.CONFIRM, time: message });
            conversation = getConversation(from); // pega versão atualizada
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
