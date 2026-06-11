/**
 * Tiny structured logger. Emits one JSON line per event so log scrapers
 * (Datadog, Loki, CloudWatch) can index it. Never logs request bodies,
 * tokens, passwords, or payment secrets — call sites must pre-redact.
 */
const REDACT_KEYS = new Set([
  "password",
  "newpassword",
  "currentpassword",
  "token",
  "authorization",
  "cookie",
  "x-api-key",
  "otp",
  "code",
  "secret",
]);

function redact(obj, depth = 0) {
  if (depth > 4 || obj == null) return obj;
  if (typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map((v) => redact(v, depth + 1));
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (REDACT_KEYS.has(k.toLowerCase())) {
      out[k] = "[REDACTED]";
    } else {
      out[k] = redact(v, depth + 1);
    }
  }
  return out;
}

function emit(level, event, fields = {}) {
  try {
    const line = JSON.stringify({
      ts: new Date().toISOString(),
      level,
      event,
      ...redact(fields),
    });
    if (level === "error") process.stderr.write(line + "\n");
    else process.stdout.write(line + "\n");
  } catch {
    /* never throw from logger */
  }
}

module.exports = {
  info: (event, fields) => emit("info", event, fields),
  warn: (event, fields) => emit("warn", event, fields),
  error: (event, fields) => emit("error", event, fields),
};
