import { Intent } from "../core/intents";
import { ConversationStep, ActiveFlow } from "./conversationTypes";

export type ConversationData = {
  step: ConversationStep;
  flow: ActiveFlow;
  serviceId?: string;
  date?: string;
  time?: string;
  pendingIntent?: Intent;
  paused?: boolean;
  lastInteraction?: number;
  address?: string;
  notes?: string;
};

const CONVERSATION_TTL = 60 * 60 * 1000;
const conversations = new Map<string, ConversationData>();

function createInitialConversation(): ConversationData {
  return {
    step: ConversationStep.START,
    flow: null,
    lastInteraction: Date.now(),
  };
}

export function setConversation(from: string, data: ConversationData) {
  conversations.set(from, data);
}

export function getConversation(userId: string): ConversationData {
  const now = Date.now();

  if (!conversations.has(userId)) {
    const initial = createInitialConversation();
    conversations.set(userId, initial);
    return initial;
  }

  const conversation = conversations.get(userId)!;

  if (
    conversation.lastInteraction &&
    now - conversation.lastInteraction > CONVERSATION_TTL
  ) {
    const reset = createInitialConversation();
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
  conversations.set(userId, createInitialConversation());
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
