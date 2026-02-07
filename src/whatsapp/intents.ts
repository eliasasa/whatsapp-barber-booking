export type Intent = 
    | "GREETING"
    | "BOOK"
    | "CHECK_AVAILABILITY"
    | "CANCEL" 
    | "UNKNOWN";

const INTENT_KEYWORDS: Record<Intent, string[]> = {
  GREETING: ["oi", "ola", "eae", "eai", "opa", "bom dia", "boa tarde"],
  BOOK: ["agendar", "marcar", "reservar"],
  CHECK_AVAILABILITY: ["horario", "disponibilidade"],
  CANCEL: ["cancelar", "desmarcar"],
  UNKNOWN: [],
};

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function detectIntent(message: string): Intent {
  const text = normalize(message);

  for (const intent in INTENT_KEYWORDS) {
    const keywords = INTENT_KEYWORDS[intent as Intent];
    if (keywords.some(w => text.includes(w))) {
      return intent as Intent;
    }
  }

  return "UNKNOWN";
}