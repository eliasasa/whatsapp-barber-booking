export enum ConversationStep {
  START = "START",

  //Booking
  ASK_SERVICE = "ASK_SERVICE",
  ASK_DATE = "ASK_DATE",
  ASK_TIME = "ASK_TIME",
  ASK_ADDRESS = "ASK_ADDRESS",
  CONFIRM = "CONFIRM",
  DONE = "DONE",

  //Cancel
  ASK_CANCEL_SELECTION = "ASK_CANCEL_SELECTION",
  CONFIRM_CANCEL = "CONFIRM_CANCEL",
}

export type ActiveFlow =
  | "BOOKING"
  | "CANCEL"
  | "AVAILABILITY"
  | "SERVICES"
  | null;