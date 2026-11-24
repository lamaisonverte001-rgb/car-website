/**
 * Lightweight sliding-window rate limiter keyed by IP and normalized phone number
 * to guard COD checkout against automated spam & fake orders.
 */
interface Bucket {
  timestamps: number[];
}

const buckets = new Map<string, Bucket>();

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_BY_IP = 8;
const MAX_BY_PHONE = 4;

function pruneAndCheck(key: string, limit: number): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < WINDOW_MS);

  if (bucket.timestamps.length >= limit) {
    const oldest = bucket.timestamps[0] ?? now;
    const retryAfterSec = Math.max(1, Math.ceil((WINDOW_MS - (now - oldest)) / 1000));
    buckets.set(key, bucket);
    return { allowed: false, retryAfterSec };
  }

  bucket.timestamps.push(now);
  buckets.set(key, bucket);
  return { allowed: true, retryAfterSec: 0 };
}

export function checkOrderRateLimit(ip: string, phone: string) {
  const normalizedPhone = phone.replace(/[^\d]/g, "");
  const ipCheck = pruneAndCheck(`ip:${ip}`, MAX_BY_IP);
  if (!ipCheck.allowed) return ipCheck;

  const phoneCheck = pruneAndCheck(`phone:${normalizedPhone}`, MAX_BY_PHONE);
  if (!phoneCheck.allowed) return phoneCheck;

  return { allowed: true, retryAfterSec: 0 };
}
