// Lightweight in-memory rate limiter for auth endpoints.
// For multi-instance production deployments, swap this for Redis-backed
// storage (e.g. rate-limit-redis) so limits are shared across instances.
const buckets = new Map();

/**
 * @param {{ windowMs: number, max: number, message?: string }} options
 */
export const rateLimit = ({ windowMs, max, message = "Too many requests. Please try again later." }) => {
  return (req, res, next) => {
    const key = `${req.ip || req.socket?.remoteAddress || "unknown"}:${req.path}`;
    const now = Date.now();
    let bucket = buckets.get(key);

    if (!bucket || now - bucket.start >= windowMs) {
      bucket = { start: now, count: 0 };
      buckets.set(key, bucket);
    }

    bucket.count += 1;
    if (bucket.count > max) {
      const retryAfter = Math.ceil((bucket.start + windowMs - now) / 1000);
      res.set("Retry-After", String(Math.max(retryAfter, 1)));
      return res.status(429).json({ success: false, message });
    }
    next();
  };
};

// Periodically drop stale buckets so the map cannot grow without bound.
const STALE_MS = 30 * 60 * 1000;
const sweeper = setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (now - bucket.start >= STALE_MS) buckets.delete(key);
  }
}, STALE_MS);
sweeper.unref?.();

export default rateLimit;
