const crypto = require("crypto");

// Lightweight request correlation. Uses inbound X-Request-Id when present and
// safe (alnum/dash, <= 64 chars), otherwise mints a random one. Echoes back
// in the response header so frontend/log scrapers can correlate.
const SAFE = /^[A-Za-z0-9_-]{6,64}$/;

module.exports = function requestId(req, res, next) {
  const inbound = String(req.headers["x-request-id"] || "").trim();
  const id = SAFE.test(inbound) ? inbound : crypto.randomBytes(12).toString("hex");
  req.id = id;
  res.setHeader("X-Request-Id", id);
  next();
};
