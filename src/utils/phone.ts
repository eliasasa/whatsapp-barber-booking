export function normalizePhone(whatsappId: string): string {
  // remove @c.us ou qualquer sufixo
  return whatsappId.replace(/@.*/, "");
}
