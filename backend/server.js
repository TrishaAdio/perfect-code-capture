/**
 * SymDeals backend entrypoint.
 *
 * Run on a VPS:
 *   cd backend
 *   cp .env.example .env   # edit values
 *   npm install
 *   node server.js
 *
 * If MONGODB_URI is empty, the process prompts for it interactively.
 */
require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

const { connectDB } = require("./config/db");
const { uploadsDir } = require("./middleware/upload");
const sanitize = require("./middleware/sanitize");
const auditLog = require("./middleware/auditLog");
const requestId = require("./middleware/requestId");
const globalWhitelist = require("./middleware/globalWhitelist");
const log = require("./utils/logger");
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const productRoutes = require("./routes/products");
const userRoutes = require("./routes/user");
const paymentRoutes = require("./routes/payments");
const orderRoutes = require("./routes/orders");
const noticeRoutes = require("./routes/notices");
const cartRoutes = require("./routes/cart");

function getTrustProxySetting() {
  // Pinned to a single hop by default. Set TRUST_PROXY explicitly when running
  // behind multiple proxies (e.g. CDN -> Nginx -> app => "2"). Avoid `true` in
  // production: rate-limit can be spoofed via X-Forwarded-For.
  const value = (process.env.TRUST_PROXY || "1").trim();
  if (value === "true") return 1;
  if (value === "false") return false;
  const numeric = Number(value);
  return Number.isNaN(numeric) ? value : numeric;
}

function getMongoUri() {
  // Accept the canonical name and the historical MONGO_URI alias. We never
  // prompt interactively — silent / scripted boots are mandatory in prod.
  const uri = (process.env.MONGODB_URI || process.env.MONGO_URI || "").trim();
  if (!uri) {
    console.error(
      "MONGODB_URI is not set. Add it to backend/.env and restart."
    );
    process.exit(1);
  }
  process.env.MONGODB_URI = uri;
  return uri;
}

function buildApp() {
  const app = express();
  const isProd = process.env.NODE_ENV === "production";

  app.disable("x-powered-by");
  app.disable("etag");
  app.set("trust proxy", getTrustProxySetting());

  // ===== PERIMETER: global IP whitelist =====
  // Mounted before EVERYTHING else (helmet, cors, body parser, routes). Any
  // non-whitelisted IP gets a single tiny plaintext line and the connection
  // is closed — no JSON, no CORS hints, no framework fingerprint.
  app.use(globalWhitelist());

  // ---------- Security headers ----------
  app.use(
    helmet({
      // Allow cross-origin <img> loads from /uploads when frontend lives on
      // a different origin.
      crossOriginResourcePolicy: { policy: "cross-origin" },
      // Strict CSP for any HTML the API serves directly. APIs return JSON,
      // but defence-in-depth doesn't hurt.
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          defaultSrc: ["'none'"],
          imgSrc: ["'self'", "data:", "blob:"],
          connectSrc: ["'self'"],
          frameAncestors: ["'none'"],
        },
      },
      referrerPolicy: { policy: "no-referrer" },
      hsts: isProd
        ? { maxAge: 60 * 60 * 24 * 365, includeSubDomains: true, preload: true }
        : false,
    })
  );

  // Correlate every request — req.id is exposed for downstream handlers and
  // echoed back via X-Request-Id so clients/log scrapers can join traces.
  app.use(requestId);

  // Tight body limit — auth/order payloads are tiny.
  app.use(express.json({ limit: "32kb" }));
  app.use(cookieParser());

  // NoSQL injection / prototype pollution sanitizer.
  app.use(sanitize);

  // ---------- CORS ----------
  // Allowed origins are built ENTIRELY from environment variables — no
  // hardcoded hosts. Set either:
  //   CLIENT_URL=https://example.com
  // or a comma-separated list:
  //   CORS_ORIGIN=https://example.com,https://www.example.com
  // (both are merged). In non-production, http://localhost:* and
  // http://127.0.0.1:* are always allowed for local dev.
  const parseOrigins = (raw) =>
    String(raw || "")
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s && s !== "*")
      .map((s) => s.replace(/\/+$/, ""));
  const getRequestHost = (req) => {
    const forwardedHost = String(req.headers["x-forwarded-host"] || "")
      .split(",")[0]
      .trim();
    return forwardedHost || req.headers.host || "";
  };
  const sameHostnameAsApi = (origin, req) => {
    try {
      const originUrl = new URL(origin);
      const hostHeader = getRequestHost(req);
      const apiUrl = new URL(`${originUrl.protocol}//${hostHeader}`);

      return originUrl.hostname === apiUrl.hostname;
    } catch {
      return false;
    }
  };
  const allowWildcard =
    String(process.env.CORS_ALLOW_WILDCARD || "").toLowerCase() === "true";
  const allowed = Array.from(
    new Set([
      ...parseOrigins(process.env.CLIENT_URL),
      ...parseOrigins(process.env.CORS_ORIGIN),
    ])
  );
  // Local dev: allow http(s)://localhost:* and 127.0.0.1:* on any port.
  const localhostRe = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;
  // Lovable preview / published origins (sandbox subdomains rotate per project).
  const lovableRe =
    /^https:\/\/([a-z0-9-]+\.)*(lovable\.app|lovableproject\.com|lovable\.dev)$/i;
  const corsOptions = {
    origin(origin, req, cb) {
      // Same-origin / curl / server-to-server have no Origin — allow.
      if (!origin) return cb(null, true);
      const normalized = origin.replace(/\/+$/, "");
      if (allowed.includes(normalized)) return cb(null, true);
      if (sameHostnameAsApi(normalized, req)) return cb(null, true);
      if (lovableRe.test(normalized)) return cb(null, true);
      if (!isProd && localhostRe.test(normalized)) return cb(null, true);
      if (allowWildcard) return cb(null, true);
      return cb(null, false); // generic rejection, no error detail
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-API-Key",
      "X-Requested-With",
      "ngrok-skip-browser-warning",
    ],
    maxAge: 86400,
  };
  app.use((req, res, next) => {
    cors({
      ...corsOptions,
      origin(origin, cb) {
        corsOptions.origin(origin, req, cb);
      },
    })(req, res, next);
  });


  // Serve uploaded images publicly with long cache. Magic-byte validation at
  // upload time guarantees these are real images — but we still pin the
  // content-type, refuse MIME-sniffing, and lock the CORP so the files can
  // never be turned into an XSS sink.
  const IMAGE_TYPES = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
  };
  app.use(
    "/uploads",
    express.static(uploadsDir, {
      maxAge: "7d",
      fallthrough: true,
      index: false,
      // Refuse path traversal / dotfiles.
      dotfiles: "deny",
      setHeaders(res, filePath) {
        const ext = path.extname(filePath).toLowerCase();
        const ct = IMAGE_TYPES[ext];
        if (ct) res.setHeader("Content-Type", ct);
        else res.setHeader("Content-Type", "application/octet-stream");
        res.setHeader("X-Content-Type-Options", "nosniff");
        res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
        res.setHeader("Content-Security-Policy", "default-src 'none'");
        // Inline display is required for <img> previews in the dashboard.
        // Magic-byte enforcement above means only real images land here.
        res.setHeader(
          "Content-Disposition",
          `inline; filename="${path.basename(filePath)}"`
        );
      },
    })
  );

  if (process.env.NODE_ENV !== "test") {
    // Compact log line, no request bodies — never accidentally leaks tokens.
    app.use(morgan("tiny"));
  }

  app.get("/health", (_req, res) =>
    res.json({ success: true, status: "ok", uptime: process.uptime() })
  );

  // ---------- Routes ----------
  app.use("/api/auth", authRoutes);
  // Admin routes carry their own ipWhitelist + audit middleware.
  app.use("/api/admin", auditLog("admin"), adminRoutes);
  app.use("/api/products", productRoutes);
  app.use("/api/user", userRoutes);
  app.use("/api/payments", paymentRoutes);
  app.use("/api/orders", orderRoutes);
  app.use("/api/notices", noticeRoutes);
  app.use("/api/cart", cartRoutes);

  app.use((_req, res) =>
    res.status(404).json({ success: false, message: "Not found" })
  );

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, _next) => {
    // Never leak stack traces or internal messages to the client.
    log.error("unhandled_error", {
      reqId: req.id,
      method: req.method,
      path: req.originalUrl,
      reason: err.message,
    });
    const status = err.status || 500;
    const safeMessage =
      status >= 500 ? "Server error" : err.message || "Request failed";
    res.status(status).json({ success: false, message: safeMessage });
  });

  return app;
}

async function start() {
  try {
    const uri = getMongoUri();
    await connectDB(uri);

    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      console.warn(
        "⚠  JWT_SECRET is missing or weaker than 32 chars. Generate one with:\n" +
          "    node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\""
      );
    }
    if (
      process.env.NODE_ENV === "production" &&
      !process.env.ADMIN_IP_WHITELIST
    ) {
      console.warn(
        "⚠  ADMIN_IP_WHITELIST is not set in production — admin routes are open to any IP."
      );
    }

    const app = buildApp();
    const port = Number(process.env.PORT) || 5000;
    const host = process.env.HOST || "0.0.0.0";
    app.listen(port, host, () => {
      console.log(`✓ SymDeals API listening on http://${host}:${port}`);
      console.log("  GET  /health");
    });
  } catch (err) {
    console.error("Failed to start server:", err.message || err);
    process.exit(1);
  }
}

start();
