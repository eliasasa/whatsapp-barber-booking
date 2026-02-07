import { detectIntent } from "./intents";
import { replies } from "./replies";

export function handleIncomingMessage(message: string) {
    const intent = detectIntent(message);

    switch (intent) {
        case "GREETING":
            return replies.greeting;
        case "BOOK": 
            return "Perfeito! 😊 Para qual dia você gostaria de agendar?";
        case "CHECK_AVAILABILITY":
            return "Claro! Me diga o dia que você quer verificar.";
        case "CANCEL":
            return "Sem problema! Me diga qual horário deseja cancelar.";
        default:
            return replies.unknown;
    }

}