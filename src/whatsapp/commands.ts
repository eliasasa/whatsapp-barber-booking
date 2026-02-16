import { resetConversation, resumeConversation, pauseConversation } from "./conversationStore";

export type CommandContext = {
    from: string;
    isPaused: boolean;
};

export type CommandHandler = (ctx: CommandContext) => string;

export const COMMANDS: Record<string, CommandHandler> = {
    "#pause": ({ from }) => {
        pauseConversation(from);
        return "⏸️ Atendimento pausado. Um barbeiro vai continuar a conversa por aqui.";
    },

    "#resume": ({ from }) => {
        resumeConversation(from);
        return "▶️ Atendimento automático retomado 😊";
    },

    "#reset": ({ from }) => {
        resetConversation(from);
        return "🔄 Conversa resetada. Podemos começar novamente.";
    },

    // "#commands": ({ from }) => {
    //     return "";
    // },
};
