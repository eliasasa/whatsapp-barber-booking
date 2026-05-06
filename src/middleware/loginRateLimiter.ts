import { Request, Response, NextFunction } from "express";

interface RateLimitEntry {
  count: number;
  blockUntil: number;
  firstAttemptAt: number;
}

const WINDOW_MS = 15 * 60 * 1000; // 15 minutos
const MAX_ATTEMPTS = 5; // máximo de tentativas
const BLOCK_DURATION_MS = 15 * 60 * 1000; // bloqueia por 15 minutos

const attempts = new Map<string, RateLimitEntry>();

/**
 * Middleware de rate limiting para proteção contra brute force no login
 * Limite: 5 tentativas a cada 15 minutos por IP
 */
export function loginRateLimiter(
  req: Request,
  res: Response,
  next: NextFunction
): Response | void {
  const ip = (req.ip || req.socket.remoteAddress || "unknown").toString();
  const now = Date.now();

  // Limpar entradas antigas
  for (const [key, value] of attempts.entries()) {
    if (now - value.firstAttemptAt > WINDOW_MS && now > value.blockUntil) {
      attempts.delete(key);
    }
  }

  const entry = attempts.get(ip);

  // Se IP está bloqueado, retornar 429
  if (entry && now < entry.blockUntil) {
    const retryAfterSeconds = Math.ceil((entry.blockUntil - now) / 1000);
    res.set("Retry-After", retryAfterSeconds.toString());
    return res.status(429).json({
      error: "Muitas tentativas de login. Tente novamente em breve.",
      retryAfterSeconds,
    });
  }

  // Se janela passou, resetar contador
  if (!entry || now - entry.firstAttemptAt > WINDOW_MS) {
    attempts.set(ip, {
      count: 1,
      blockUntil: 0,
      firstAttemptAt: now,
    });
    next();
    return;
  }

  // Incrementar contador
  entry.count++;

  // Se ultrapassou limite, bloquear
  if (entry.count > MAX_ATTEMPTS) {
    entry.blockUntil = now + BLOCK_DURATION_MS;
    const retryAfterSeconds = Math.ceil(BLOCK_DURATION_MS / 1000);
    res.set("Retry-After", retryAfterSeconds.toString());
    return res.status(429).json({
      error: `Muitas tentativas de login. Bloqueado por ${retryAfterSeconds} segundos.`,
      retryAfterSeconds,
    });
  }

  // Registrar tentativa neste header para logging (opcional)
  res.set("X-RateLimit-Remaining", (MAX_ATTEMPTS - entry.count).toString());
  res.set("X-RateLimit-Reset", (entry.firstAttemptAt + WINDOW_MS).toString());

  next();
}
