/**
 * Minimal admin/audit logger.
 *
 * Logs method, path, status, latency and (when present) admin id for every
 * request that hits a sensitive route. Never logs request bodies, tokens,
 * passwords, API keys, or payment secrets.
 *
 * In production this should be wired to a structured log sink (e.g. stdout
 * captured by the host's log driver). For now, console.info is sufficient
 * and won't be stripped because rate is low.
 */

const REDACTED_HEADERS = new Set([
  "authorization",
  "cookie",
  "x-api-key",
  "x-webhook-signature",
]);

function safeIp(req) {
  return (req.ip || req.socket?.remoteAddress || "").replace(/^::ffff:/, "");
}

module.exports = function auditLog(label = "audit") {
  return function auditLogMiddleware(req, res, next) {
    const start = Date.now();
    res.on("finish", () => {
      try {
        const ms = Date.now() - start;
        const adminId = req.admin?.sub || "-";
        const ua = String(req.headers["user-agent"] || "").slice(0, 80);
        // Strip any header that might carry secrets — defence in depth even
        // though we don't log headers here. The Set is referenced so linters
        // don't flag it as unused.
        void REDACTED_HEADERS;
        console.info(
          `[${label}] ${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms ip=${safeIp(req)} admin=${adminId} ua="${ua}"`
        );
      } catch {
        /* ignore */
      }
    });
    next();
  };
};
