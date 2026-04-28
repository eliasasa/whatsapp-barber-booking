import { BOT_NAME } from "../global/botConfig";

export function getDefaultGreetingMessage() {
    return `Oi! 👋 Sou o assistente do ${BOT_NAME}.\n\nVocê pode:\n - Agendar um horário\n - Ver horários disponíveis\n\nÉ só me dizer o que você quer 😊`;
}

export const replies = {
    greeting: getDefaultGreetingMessage(),

    unknown:
        "Não entendi muito bem 😅\nVocê pode dizer:\n- Quero agendar\n- Ver horários\n- Cancelar",
};
