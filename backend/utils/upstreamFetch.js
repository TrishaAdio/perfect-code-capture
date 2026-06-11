/**
 * Authenticated server-to-server fetch.
 *
 * Adds HMAC-SHA256 signature + timestamp + nonce headers to every outbound
 * request to PAY/ORDER/EMAIL upstream services. The upstream side must verify:
 *   X-Symdeals-Timestamp  — UTC seconds, must be within 300s of now
 *   X-Symdeals-Nonce      — random 16 bytes hex (rejected on replay)
 *   X-Symdeals-Signature  — hex(HMAC_SHA256(secret, `${ts}.${nonce}.${method}.${path}.${bodyHash}`))
 *
 * If UPSTREAM_HMAC_SECRET is unset, the headers are still added (empty signature)
 * so the upstream can choose to ignore them in development. In production,
 * always set UPSTREAM_HMAC_SECRET on BOTH sides.
 */
const crypto = require("crypto");

const SECRET = (process.env.UPSTREAM_HMAC_SECRET || "").trim();
const ENABLED = SECRET.length >= 32;

function sha256(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function signRequest({ method, urlObj, bodyText }) {
  const ts = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomBytes(16).toString("hex");
  const bodyHash = sha256(bodyText || "");
  const path = urlObj.pathname + (urlObj.search || "");
  const base = `${ts}.${nonce}.${method.toUpperCase()}.${path}.${bodyHash}`;
  const signature = ENABLED
    ? crypto.createHmac("sha256", SECRET).update(base).digest("hex")
    : "";
  return {
    "X-Symdeals-Timestamp": ts,
    "X-Symdeals-Nonce": nonce,
    "X-Symdeals-Signature": signature,
    "X-Symdeals-Client": "symdeals-api",
  };
}

/**
 * fetch wrapper that injects signed headers and a hard timeout.
 * Returns the raw Response so callers keep current parsing logic.
 */
async function upstreamFetch(rawUrl, opts = {}) {
  const { method = "GET", headers = {}, body, timeoutMs = 15_000 } = opts;
  const urlObj = new URL(rawUrl);
  const bodyText =
    body == null
      ? ""
      : typeof body === "string"
        ? body
        : Buffer.isBuffer(body)
          ? body.toString("utf8")
          : JSON.stringify(body);

  const signed = signRequest({ method, urlObj, bodyText });
  const finalHeaders = { ...headers, ...signed };
  if (bodyText && !finalHeaders["Content-Type"] && !finalHeaders["content-type"]) {
    finalHeaders["Content-Type"] = "application/json";
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(rawUrl, {
      method,
      headers: finalHeaders,
      body: bodyText || undefined,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { upstreamFetch, UPSTREAM_HMAC_ENABLED: ENABLED };
