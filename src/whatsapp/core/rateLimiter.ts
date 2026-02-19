type RateLimitInfo = {
  count: number;
  windowStart: number;
  lastMessageAt: number;
  warned: boolean;          
  repeatWarned: boolean;    
  lastMessages: string[];
  repeatCount: number;
};

const MAX_HISTORY = 3;
const REPEAT_LIMIT = 3;
const RATE_LIMIT_WINDOW = 60_000;
const MAX_MESSAGES = 15;
const COOLDOWN = 500;

const users = new Map<string, RateLimitInfo>();

export type RateLimitResult = "ALLOW" | "WARN" | "BLOCK" | "REPEAT_WARN" | "REPEAT_BLOCK";

export function checkRateLimit(userId: string, text?: string): RateLimitResult {
  const now = Date.now();

  if (!users.has(userId)) {
    users.set(userId, {
      count: 1,
      windowStart: now,
      lastMessageAt: now,
      warned: false,
      repeatWarned: false,    
      lastMessages: text ? [text] : [],
      repeatCount: 0,
    });
    return "ALLOW";
  }

  const info = users.get(userId)!;

  // ===== RATE LIMIT PADRÃO =====
  if (now - info.windowStart > RATE_LIMIT_WINDOW) {
    info.count = 1;
    info.windowStart = now;
    info.warned = false;
    info.repeatWarned = false; 
    info.lastMessageAt = now;
    info.repeatCount = 0;
    info.lastMessages = text ? [text] : [];
    return "ALLOW";
  }

  if (now - info.lastMessageAt < COOLDOWN) {
    return "ALLOW";
  }

  info.count++;
  info.lastMessageAt = now;

  const normalizeText = (str: string) => str.trim().toLowerCase().replace(/\s+/g, ' ');

  if (text) {
    const lastMsg = info.lastMessages[0] ?? '';
    
    // Verifica se é repetição
    if (normalizeText(text) === normalizeText(lastMsg)) {
      info.repeatCount++;
    } else {
      info.repeatCount = 0;
      info.repeatWarned = false;
    }
    
    info.lastMessages = [text, ...info.lastMessages].slice(0, MAX_HISTORY);

    if (info.repeatCount >= REPEAT_LIMIT) {
      if (!info.repeatWarned) {
        info.repeatWarned = true; 
        return "REPEAT_WARN";
      }
      return "REPEAT_BLOCK";
    }
  }

  if (info.count > MAX_MESSAGES) {
    if (!info.warned) {
      info.warned = true;
      return "WARN";
    }
    return "BLOCK";
  }

  return "ALLOW";
}