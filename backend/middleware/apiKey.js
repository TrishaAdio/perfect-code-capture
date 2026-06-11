/**
 * API key middleware (timing-safe).
 *
 * Optional layer on top of admin auth. When INTERNAL_API_KEY is set, every
 * protected request must include a matching X-API-Key header. Multiple keys
 * may be set (comma-separated) to support rotation without downtime.
 *
 * Configure:
 *   INTERNAL_API_KEY="key1,key2"   (rotate by adding new key, then removing old)
 *
 * If unset, the middleware is a no-op so existing flows keep working.
 */
const crypto = require("crypto");

function parseKeys(raw) {
  return String(raw || "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length >= 16); // refuse weak keys
}

function timingSafeEq(a, b) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  try {
    return crypto.timingSafeEqual(ab, bb);
  } catch {
    return false;
  }
}

module.exports = function requireApiKey() {
  const keys = parseKeys(process.env.INTERNAL_API_KEY);
  const enabled = keys.length > 0;

  return function apiKeyMiddleware(req, res, next) {
    if (!enabled) return next();
    const provided =
      req.headers["x-api-key"] || req.headers["X-API-Key"] || "";
    const ok =
      typeof provided === "string" &&
      provided.length >= 16 &&
      keys.some((k) => timingSafeEq(provided, k));
    if (!ok) {
      try {
        console.warn(
          `[security] invalid/missing API key ${req.method} ${req.originalUrl}`
        );
      } catch {
        /* ignore */
      }
      // Generic — never disclose whether the header is missing or invalid.
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    next();
  };
};
