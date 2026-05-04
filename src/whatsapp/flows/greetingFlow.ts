import { getGreetingMessage } from "../../services/botMessages/botMessageService";

export async function greetingFlow(_from: string): Promise<string | null> {
  return getGreetingMessage();
}