import { ConversationData } from "../conversation/conversationStore";

export interface FlowContext {
  from: string;
  message: string;
  conversation: ConversationData;
}

export interface FlowResponse {
  message: string;
  endFlow?: boolean;
}