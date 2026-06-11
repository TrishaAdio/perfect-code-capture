/**
 * Global IP whitelist — perimeter hard-block.
 *
 * Mounted FIRST in server.js, before CORS, body parsers, helmet response
 * headers, routes — everything. Any request not coming from a whitelisted IP
 * receives a single tiny plaintext line and nothing else: no JSON, no CORS,
 * no powered-by, no framework hints, no route info.
 *
 * Env:
 *   GLOBAL_IP_WHITELIST="13.236.80.206,1.2.3.4"
 *   GLOBAL_IP_WHITELIST_ENABLED="true"   (defaults to false)
 *
 * Set GLOBAL_IP_WHITELIST_ENABLED=false to disable (e.g. when you want the
 * public frontend to talk to the API again).
 *
 * IMPORTANT: this middleware is only safe for private/internal APIs. Public
 * browser clients often arrive from rotating IPs (including preview domains,
 * mobile networks, and CGNAT), so enabling this globally will break normal
 * user sessions after signup/login.
 */

const DEFAULT_WHITELIST = [];
const DECOY = "you are quite funny.";

function parseList(raw) {
  return String(raw || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function normalizeIp(ip) {
  if (!ip) return "";
  return ip.replace(/^::ffff:/, "").trim();
}

function getClientIp(req) {
  // express respects `trust proxy` for req.ip — must be set correctly upstream.
  return normalizeIp(req.ip || req.socket?.remoteAddress || "");
}

function stripHeaders(res) {
  // Remove every framework / negotiation hint before responding.
  try {
    res.removeHeader("X-Powered-By");
    res.removeHeader("ETag");
    res.removeHeader("Vary");
    res.removeHeader("Access-Control-Allow-Origin");
    res.removeHeader("Access-Control-Allow-Credentials");
    res.removeHeader("Access-Control-Allow-Methods");
    res.removeHeader("Access-Control-Allow-Headers");
    res.removeHeader("Access-Control-Expose-Headers");
    res.removeHeader("Cross-Origin-Resource-Policy");
    res.removeHeader("Cross-Origin-Opener-Policy");
    res.removeHeader("Cross-Origin-Embedder-Policy");
    res.removeHeader("Strict-Transport-Security");
    res.removeHeader("Content-Security-Policy");
    res.removeHeader("Referrer-Policy");
    res.removeHeader("X-Content-Type-Options");
    res.removeHeader("X-Frame-Options");
    res.removeHeader("X-DNS-Prefetch-Control");
    res.removeHeader("X-Download-Options");
    res.removeHeader("X-Permitted-Cross-Domain-Policies");
    res.removeHeader("Origin-Agent-Cluster");
  } catch {
    /* ignore */
  }
}

// Tiny in-process counter so very loud probes get an instant socket destroy
// instead of even the 8-byte decoy. Reset every minute.
const probes = new Map();
let lastSweep = Date.now();
function trackAndShouldDrop(ip) {
  const now = Date.now();
  if (now - lastSweep > 60_000) {
    probes.clear();
    lastSweep = now;
  }
  const n = (probes.get(ip) || 0) + 1;
  probes.set(ip, n);
  return n > 30; // >30 hits / minute from one IP => silent drop
}

function deny(req, res) {
  const ip = getClientIp(req);
  if (trackAndShouldDrop(ip)) {
    // No response at all — kill the socket. Cheapest outcome for scanners.
    try {
      req.socket?.destroy();
    } catch {
      /* ignore */
    }
    return;
  }
  stripHeaders(res);
  res.statusCode = 403;
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Content-Length", Buffer.byteLength(DECOY));
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Connection", "close");
  res.end(DECOY);
}

function build() {
  const list = parseList(process.env.GLOBAL_IP_WHITELIST || DEFAULT_WHITELIST.join(","))
    .map(normalizeIp);
  const explicit = String(process.env.GLOBAL_IP_WHITELIST_ENABLED || "")
    .toLowerCase()
    .trim();
  const enabled = explicit === "true";

  if (enabled) {
    console.log(
      `[security] global IP whitelist active (${list.length} entr${list.length === 1 ? "y" : "ies"})`
    );
  }

  return function globalWhitelist(req, res, next) {
    // Never perimeter-block health checks or public user auth/profile routes.
    // These are consumed directly by end-user browsers with unpredictable IPs.
    if (
      req.path === "/health" ||
      req.path.startsWith("/api/auth/") ||
      req.path === "/api/auth"
    ) {
      return next();
    }
    if (!enabled) return next();
    const ip = getClientIp(req);
    if (list.includes(ip)) return next();
    return deny(req, res);
  };
}

module.exports = build;
module.exports.DECOY = DECOY;
