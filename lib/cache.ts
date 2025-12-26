// lib/cache.ts
import { db } from "@/db/client";
import { aiResponseCache } from "@/db/schema";
import { eq, and, gt, lt } from "drizzle-orm";

const CACHE_DURATIONS = {
  daily_plan: 60 * 60 * 1000, // 1 Stunde
  coach_analysis: 60 * 60 * 1000, // 1 Stunde
  alerts: 15 * 60 * 1000, // 15 Minuten
} as const;

type CacheKey = keyof typeof CACHE_DURATIONS;

/**
 * Holt einen gecachten AI-Response, falls vorhanden und nicht abgelaufen
 */
export async function getCachedResponse<T>(
  userId: string,
  cacheKey: CacheKey
): Promise<T | null> {
  try {
    const cached = await db
      .select()
      .from(aiResponseCache)
      .where(
        and(
          eq(aiResponseCache.userId, userId),
          eq(aiResponseCache.cacheKey, cacheKey),
          gt(aiResponseCache.expiresAt, new Date())
        )
      )
      .limit(1);

    if (cached.length > 0) {
      console.log(`✅ Cache-Hit für ${cacheKey} (User: ${userId.slice(0, 8)}...)`);
      return cached[0].response as T;
    }

    return null;
  } catch (err) {
    console.warn("Cache-Abfrage fehlgeschlagen:", err);
    return null;
  }
}

/**
 * Speichert einen AI-Response im Cache
 */
export async function setCachedResponse<T extends Record<string, unknown>>(
  userId: string,
  cacheKey: CacheKey,
  response: T
): Promise<void> {
  try {
    const duration = CACHE_DURATIONS[cacheKey];
    const expiresAt = new Date(Date.now() + duration);

    // Erst alten Eintrag löschen, dann neuen einfügen
    await db
      .delete(aiResponseCache)
      .where(
        and(
          eq(aiResponseCache.userId, userId),
          eq(aiResponseCache.cacheKey, cacheKey)
        )
      );
    
    await db.insert(aiResponseCache).values({
      userId,
      cacheKey,
      response: response,
      expiresAt,
    });

    console.log(`💾 Cache gespeichert für ${cacheKey} (gültig bis ${expiresAt.toLocaleTimeString()})`);
  } catch (err) {
    console.warn("Cache-Speicherung fehlgeschlagen:", err);
  }
}

/**
 * Invalidiert den Cache für einen bestimmten Schlüssel
 */
export async function invalidateCache(
  userId: string,
  cacheKey?: CacheKey
): Promise<void> {
  try {
    if (cacheKey) {
      await db
        .delete(aiResponseCache)
        .where(
          and(
            eq(aiResponseCache.userId, userId),
            eq(aiResponseCache.cacheKey, cacheKey)
          )
        );
    } else {
      // Alle Caches für diesen User löschen
      await db.delete(aiResponseCache).where(eq(aiResponseCache.userId, userId));
    }
  } catch (err) {
    console.warn("Cache-Invalidierung fehlgeschlagen:", err);
  }
}

/**
 * Bereinigt abgelaufene Cache-Einträge (sollte periodisch ausgeführt werden)
 */
export async function cleanupExpiredCache(): Promise<void> {
  try {
    await db
      .delete(aiResponseCache)
      .where(lt(aiResponseCache.expiresAt, new Date()));
    
    console.log("🧹 Abgelaufene Cache-Einträge bereinigt");
  } catch (err) {
    console.warn("Cache-Cleanup fehlgeschlagen:", err);
  }
}
