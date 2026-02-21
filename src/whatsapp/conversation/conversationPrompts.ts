import { ConversationStep } from "./conversationTypes";
import { ConversationData } from "./conversationStore";

export function getPromptForStep(conversation: ConversationData): string {

    console.log("🧠 Step atual:", conversation.step);

    switch (conversation.step) {
        case ConversationStep.START:
            return "O que você gostaria de fazer? 😊";
        case ConversationStep.ASK_SERVICE:
            return "Qual serviço você deseja?\n1️⃣ Corte\n2️⃣ Barba";

        case ConversationStep.ASK_DATE:
            return `Qual dia você deseja marcar para ${conversation.serviceId}? (ex: 25/02)`;

        case ConversationStep.ASK_TIME:
            return `Qual horário para ${conversation.serviceId} em ${conversation.date}? (ex: 14:30)`;

        case ConversationStep.CONFIRM:
            return (
                "Confirme seu agendamento:\n\n" +
                `📌 Serviço: ${conversation.serviceId}\n` +
                `📅 Data: ${conversation.date}\n` +
                `⏰ Horário: ${conversation.time}\n\n` +
                "Digite 1️⃣ para confirmar ou 2️⃣ para cancelar"
            );
        
        case ConversationStep.ASK_ADDRESS:
            return ("Ótimo ⏰\nAgora me diga o endereço onde deseja ser atendido:")

        default:
            return "Vamos continuar 🙂 O que você gostaria de fazer?";
    }
}
