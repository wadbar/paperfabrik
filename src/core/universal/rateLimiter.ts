import { Request, Response, NextFunction } from "express";

/**
 * Universal Rate Limiter (Token Bucket Algorithm)
 * Completely decoupled, unopinionated configuration via Dependency Injection or default fallbacks.
 */
export class RateLimiter {
  private buckets: Map<string, { tokens: number; lastRefill: number }> = new Map();
  private readonly capacity: number;
  private readonly refillRatePerSec: number;
  private cleanupInterval: NodeJS.Timeout;

  constructor(capacity = 50, refillRatePerSec = 10) {
    this.capacity = capacity;
    this.refillRatePerSec = refillRatePerSec;
    
    // Memory leak prevention: Clean up stale IPs every 5 minutes
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const expirationMs = 5 * 60 * 1000;
      for (const [ip, bucket] of this.buckets.entries()) {
        if (now - bucket.lastRefill > expirationMs) {
          this.buckets.delete(ip);
        }
      }
    }, 5 * 60 * 1000);
  }

  // Ensure graceful shutdown of intervals
  public destroy() {
    clearInterval(this.cleanupInterval);
  }

  public middleware = (req: Request, res: Response, next: NextFunction) => {
    const ip = (req.ip || req.socket.remoteAddress || "unknown_ip") as string;
    const now = Date.now();

    if (!this.buckets.has(ip)) {
      this.buckets.set(ip, { tokens: this.capacity, lastRefill: now });
    }

    const bucket = this.buckets.get(ip)!;
    const timePassedMs = now - bucket.lastRefill;
    const tokensToAdd = (timePassedMs / 1000) * this.refillRatePerSec;

    bucket.tokens = Math.min(this.capacity, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      next();
    } else {
      res.status(429).json({
        error: "TOO_MANY_REQUESTS",
        message: "Rate limit exceeded. Exponential backoff triggered.",
        retryAfterMs: Math.ceil(1000 / this.refillRatePerSec)
      });
    }
  };
}
