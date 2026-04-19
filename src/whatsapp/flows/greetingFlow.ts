import { replies } from "../replies";

export async function greetingFlow(_from: string): Promise<string | null> {
  return replies.greeting;
}