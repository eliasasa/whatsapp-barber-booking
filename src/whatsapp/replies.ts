export function getDefaultGreetingMessage() {
    return `Oi! 👋 Sou o assistente.

Você pode:
 - Agendar um horário
 - Ver horários disponíveis

É só me dizer o que você quer 😊`;
}

export const replies = {
    greeting: getDefaultGreetingMessage(),

    unknown:
        "Não entendi muito bem 😅\nVocê pode dizer:\n- Quero agendar\n- Ver horários\n- Cancelar",
};
