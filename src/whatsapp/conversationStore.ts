import { ConversationStep } from "./conversationTypes";

export type ConversationData = {
    step: ConversationStep;
    serviceId?: string;
    date?: string;
    time?: string;
    pendingIntent?: string;
    paused?: boolean;
    lastInteraction?: number;
    address?: string;
    notes?: string;
};

const CONVERSATION_TTL = 60 * 60 * 1000;

const conversations = new Map<string, ConversationData>();

export function setConversation(from: string, data: ConversationData) {
    conversations.set(from, data);
}

export function getConversation(userId: string): ConversationData {
    const now = Date.now();

    if (!conversations.has(userId)) {
        const data = {
            step: ConversationStep.START,
            lastInteraction: now,
        };
        conversations.set(userId, data);
        return data;
    }

    const conversation = conversations.get(userId)!;

    if (
        conversation.lastInteraction &&
        now - conversation.lastInteraction > CONVERSATION_TTL
    ) {
        const reset = {
            step: ConversationStep.START,
            lastInteraction: now,
        };
        conversations.set(userId, reset);
        return reset;
    }

    return conversation;
}

export function updateConversation(
  userId: string,
  data: Partial<ConversationData>
) {
  const current = getConversation(userId);
  conversations.set(userId, {
    ...current,
    ...data,
    lastInteraction: Date.now(),
  });
}

export function resetConversation(userId: string) {
    conversations.set(userId, {
        step: ConversationStep.START,
        lastInteraction: Date.now(),
    });
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
