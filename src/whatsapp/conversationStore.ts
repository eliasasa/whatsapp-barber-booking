import { ConversationStep } from "./conversationTypes";

export type ConversationData = {
    step: ConversationStep;
    serviceId?: string;
    date?: string;
    time?: string;
    pendingIntent?: string;
    paused?: boolean;
};

const conversations = new Map<string, ConversationData>();

export function setConversation(from: string, data: ConversationData) {
    conversations.set(from, data);
}

export function getConversation(userId: string): ConversationData {
    if (!conversations.has(userId)) {
        conversations.set(userId, { step: ConversationStep.START });
    }

    return conversations.get(userId)!;
}

export function updateConversation(
    userId: string,
    data: Partial<ConversationData>
) {
    const current = getConversation(userId);
    conversations.set(userId, { ...current, ...data });
}


export function resetConversation(userId: string) {
    conversations.set(userId, { step: ConversationStep.START });
}

export function clearPendingIntent(from: string) {
    const conversation = getConversation(from);
    const { pendingIntent, ...rest } = conversation;
    setConversation(from, rest);
}

export function pauseConversation(from: string) {
    updateConversation(from, { paused: true });
}

export function resumeConversation(from: string) {
    const conversation = getConversation(from);
    const { paused, ...rest } = conversation;
    setConversation(from, rest);
}
