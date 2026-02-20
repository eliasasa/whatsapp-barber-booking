export enum ConversationStep {
  START = "START",
  ASK_SERVICE = "ASK_SERVICE",
  ASK_DATE = "ASK_DATE",
  ASK_TIME = "ASK_TIME",
  ASK_ADDRESS = "ASK_ADDRESS",
  CONFIRM = "CONFIRM",
  DONE = "DONE",
}

export type ActiveFlow =
  | "BOOKING"
  | "CANCEL"
  | "AVAILABILITY"
  | "SERVICES"
  | null;