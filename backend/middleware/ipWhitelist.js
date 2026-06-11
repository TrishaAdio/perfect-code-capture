/**
 * IP whitelist middleware.
 *
 * Restricts sensitive routes (admin, product/notice management, payment admin)
 * to a configured list of trusted IPs. Returns a generic 403 with no hint
 * about whitelist existence. Denied attempts are logged silently for audit.
 *
 * Configure via env:
 *   ADMIN_IP_WHITELIST="13.236.80.206,1.2.3.4"
 *   ADMIN_IP_WHITELIST_ENABLED="true"   (defaults to true if list non-empty)
 *
 * If the list is empty AND ADMIN_IP_WHITELIST_ENABLED is not "true", the
 * middleware is a no-op (useful for local dev). In production, always set
 * the list — empty list + enabled = deny everything.
 */

function parseList(raw) {
  return String(raw || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function normalizeIp(ip) {
  if (!ip) return "";
  // Strip IPv4-mapped IPv6 prefix (::ffff:1.2.3.4 -> 1.2.3.4)
  return ip.replace(/^::ffff:/, "").trim();
}

function getClientIp(req) {
  // express handles X-Forwarded-For when trust proxy is set.
  return normalizeIp(req.ip || req.socket?.remoteAddress || "");
}

module.exports = function ipWhitelist({ label = "sensitive" } = {}) {
  const list = parseList(process.env.ADMIN_IP_WHITELIST).map(normalizeIp);
  const explicitEnabled = String(process.env.ADMIN_IP_WHITELIST_ENABLED || "")
    .toLowerCase()
    .trim();
  const enabled =
    explicitEnabled === "true" || (explicitEnabled !== "false" && list.length > 0);

  return function ipWhitelistMiddleware(req, res, next) {
    if (!enabled) return next();
    // CORS preflight carries no auth/body and must always succeed so the
    // browser can see the real response. The actual request that follows
    // will still be IP-checked.
    if (req.method === "OPTIONS") return next();
    const ip = getClientIp(req);
    if (list.includes(ip)) return next();

    // Silent audit log — never reveal to the caller.
    try {
      console.warn(
        `[security] denied ${label} ${req.method} ${req.originalUrl} from ${ip || "unknown"}`
      );
    } catch {
      /* ignore */
    }
    // Generic 403, no whitelist hint.
    return res.status(403).json({ success: false, message: "Forbidden" });
  };
};
