import { ConversationStep } from "./conversationTypes";

type ConversationData = {
    step: ConversationStep;
    serviceId?: string;
    date?: string;
    time?: string;
};

const conversations = new Map<string, ConversationData>();

export function getConversation(userId: string): ConversationData {
    if (!conversations.has(userId)) {
        conversations.set(userId, {step: ConversationStep.START})
    }

    return conversations.get(userId)!;
}

export function updateConversation(userId: string, data: Partial<ConversationData>) {
    const current = getConversation(userId);
    conversations.set(userId, {...current, ...data});
}

export function resetConversation(userId: string) {
    conversations.set(userId, {step: ConversationStep.START})
}