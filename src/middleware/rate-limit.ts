import type { Request, Response } from "express";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  windowMs: number;
  max: number;
  keyPrefix?: string;
};

const store = new Map<string, RateLimitEntry>();

function resolveClientIp(req: Request): string {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string") {
    return forwardedFor.split(",")[0]?.trim() || req.ip || "unknown";
  }

  return req.ip || "unknown";
}

export function createRateLimit(options: RateLimitOptions) {
  return (req: Request, res: Response, next: () => void) => {
    const key = `${options.keyPrefix ?? "global"}:${resolveClientIp(req)}`;
    const now = Date.now();
    const current = store.get(key);

    if (!current || current.resetAt <= now) {
      store.set(key, { count: 1, resetAt: now + options.windowMs });
      next();
      return;
    }

    current.count += 1;
    if (current.count > options.max) {
      res.status(429).json({
        ok: false,
        error: {
          message: "Too many requests"
        }
      });
      return;
    }

    next();
  };
}
