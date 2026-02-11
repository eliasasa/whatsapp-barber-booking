type RateLimitInfo = {
  count: number;
  windowStart: number;
  lastMessageAt: number;
  warned: boolean;
};

const RATE_LIMIT_WINDOW = 60_000; // 1 min
const MAX_MESSAGES = 10;
const COOLDOWN = 2_000;

const users = new Map<string, RateLimitInfo>();

export type RateLimitResult = "ALLOW" | "WARN" | "BLOCK";

export function checkRateLimit(userId: string): RateLimitResult {
  const now = Date.now();

  // Primeiro contato
  if (!users.has(userId)) {
    users.set(userId, {
      count: 1,
      windowStart: now,
      lastMessageAt: now,
      warned: false,
    });
    return "ALLOW";
  }

  const info = users.get(userId)!;

  // Reset da janela
  if (now - info.windowStart > RATE_LIMIT_WINDOW) {
    info.count = 0;
    info.windowStart = now;
    info.warned = false;
  }

  // Cooldown (bloqueia sem avisar)
  if (now - info.lastMessageAt < COOLDOWN) {
    return "BLOCK";
  }

  info.count++;
  info.lastMessageAt = now;

  // Estourou o limite
  if (info.count > MAX_MESSAGES) {
    if (!info.warned) {
      info.warned = true;
      return "WARN";
    }
    return "BLOCK";
  }

  return "ALLOW";
}
