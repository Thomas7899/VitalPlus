// lib/rate-limit.ts

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-Memory Rate Limiting (für Produktion: Redis verwenden)
const rateLimitStore = new Map<string, RateLimitEntry>();

interface RateLimitConfig {
  maxRequests: number; // Maximale Anfragen
  windowMs: number; // Zeitfenster in Millisekunden
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  "ai:plan": { maxRequests: 10, windowMs: 60 * 60 * 1000 }, // 10 Pläne pro Stunde
  "ai:coach": { maxRequests: 20, windowMs: 60 * 60 * 1000 }, // 20 Coach-Analysen pro Stunde
  "ai:alert": { maxRequests: 30, windowMs: 60 * 60 * 1000 }, // 30 Alert-Checks pro Stunde
  "ai:embedding": { maxRequests: 50, windowMs: 60 * 60 * 1000 }, // 50 Embedding-Updates pro Stunde
};

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfterMs?: number;
}

/**
 * Prüft und aktualisiert das Rate-Limit für einen Benutzer und Endpunkt
 */
export function checkRateLimit(
  userId: string,
  endpoint: keyof typeof RATE_LIMITS
): RateLimitResult {
  const config = RATE_LIMITS[endpoint];
  if (!config) {
    // Kein Limit konfiguriert - erlauben
    return {
      allowed: true,
      remaining: Infinity,
      resetAt: new Date(),
    };
  }

  const key = `${userId}:${endpoint}`;
  const now = Date.now();
  let entry = rateLimitStore.get(key);

  // Eintrag abgelaufen oder nicht vorhanden
  if (!entry || entry.resetAt <= now) {
    entry = {
      count: 0,
      resetAt: now + config.windowMs,
    };
  }

  const remaining = Math.max(0, config.maxRequests - entry.count - 1);
  const resetAt = new Date(entry.resetAt);

  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt,
      retryAfterMs: entry.resetAt - now,
    };
  }

  // Anfrage zählen
  entry.count++;
  rateLimitStore.set(key, entry);

  return {
    allowed: true,
    remaining,
    resetAt,
  };
}

/**
 * Setzt das Rate-Limit für einen Benutzer zurück
 */
export function resetRateLimit(userId: string, endpoint?: string): void {
  if (endpoint) {
    rateLimitStore.delete(`${userId}:${endpoint}`);
  } else {
    // Alle Limits für diesen User zurücksetzen
    for (const key of rateLimitStore.keys()) {
      if (key.startsWith(`${userId}:`)) {
        rateLimitStore.delete(key);
      }
    }
  }
}

/**
 * Bereinigt abgelaufene Rate-Limit-Einträge
 */
export function cleanupRateLimits(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
}

// Periodisches Cleanup (alle 5 Minuten)
if (typeof setInterval !== "undefined") {
  setInterval(cleanupRateLimits, 5 * 60 * 1000);
}
