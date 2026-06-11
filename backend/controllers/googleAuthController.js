/**
 * Google OAuth 2.0 (Authorization Code flow).
 *
 * Flow:
 *   1) GET /api/auth/google           -> 302 to Google with `state` cookie
 *   2) GET /api/auth/google/callback  -> exchange code, fetch profile,
 *      find-or-create User, mint JWT, redirect to frontend with token
 *
 * No external OAuth lib — only `fetch` (Node 18+). All token validation is
 * server-side. The id_token is exchanged at Google's token endpoint over
 * HTTPS, so we trust Google's response without re-verifying the JWT
 * signature; an attacker cannot forge it without Google's private key and
 * our client secret.
 */
const crypto = require("crypto");
const User = require("../models/User");
const { signToken } = require("../config/jwt");
const log = require("../utils/logger");

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

const STATE_COOKIE = "symdeals_g_state";
const STATE_TTL_MS = 10 * 60 * 1000;

function getConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const callbackUrl = process.env.GOOGLE_CALLBACK_URL;
  if (!clientId || !clientSecret || !callbackUrl) {
    return null;
  }
  return { clientId, clientSecret, callbackUrl };
}

function getFrontendBase(req) {
  const explicit = (process.env.CLIENT_URL || "").split(",")[0].trim();
  if (explicit) return explicit.replace(/\/+$/, "");
  const corsFirst = (process.env.CORS_ORIGIN || "").split(",")[0].trim();
  if (corsFirst) return corsFirst.replace(/\/+$/, "");
  const referer = req.get("referer");
  if (referer) {
    try {
      const u = new URL(referer);
      return `${u.protocol}//${u.host}`;
    } catch {
      /* ignore */
    }
  }
  const proto = (req.headers["x-forwarded-proto"] || req.protocol || "http")
    .toString()
    .split(",")[0]
    .trim();
  const host = req.get("host");
  return `${proto}://${host}`;
}

function safeNextPath(raw) {
  if (!raw || typeof raw !== "string") return "/dashboard";
  if (!/^\/[A-Za-z0-9\-_/?&=.%]*$/.test(raw)) return "/dashboard";
  if (raw.startsWith("//")) return "/dashboard";
  return raw;
}

function setStateCookie(res, payload, isProd) {
  res.cookie(STATE_COOKIE, payload, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    maxAge: STATE_TTL_MS,
    path: "/",
  });
}

function clearStateCookie(res, isProd) {
  res.clearCookie(STATE_COOKIE, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
  });
}

function redirectToFrontendError(res, base, message) {
  const url = new URL("/login", base);
  url.searchParams.set("auth_error", message);
  res.redirect(302, url.toString());
}

exports.start = (req, res) => {
  const cfg = getConfig();
  if (!cfg) {
    log.warn("google_oauth_not_configured");
    return res
      .status(503)
      .json({ success: false, message: "Google sign-in is not available." });
  }

  const isProd = process.env.NODE_ENV === "production";
  const next = safeNextPath(req.query.next);

  const nonce = crypto.randomBytes(24).toString("hex");
  const statePayload = `${nonce}|${encodeURIComponent(next)}`;
  setStateCookie(res, nonce, isProd);

  const url = new URL(GOOGLE_AUTH_URL);
  url.searchParams.set("client_id", cfg.clientId);
  url.searchParams.set("redirect_uri", cfg.callbackUrl);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("access_type", "online");
  url.searchParams.set("prompt", "select_account");
  url.searchParams.set("state", statePayload);

  return res.redirect(302, url.toString());
};

exports.callback = async (req, res) => {
  const cfg = getConfig();
  const isProd = process.env.NODE_ENV === "production";
  const frontend = getFrontendBase(req);

  if (!cfg) {
    return redirectToFrontendError(res, frontend, "google_unavailable");
  }

  const { code, state, error } = req.query;
  if (error) {
    log.warn("google_oauth_user_denied", { error: String(error) });
    clearStateCookie(res, isProd);
    return redirectToFrontendError(res, frontend, "google_cancelled");
  }
  if (!code || !state) {
    clearStateCookie(res, isProd);
    return redirectToFrontendError(res, frontend, "google_invalid_request");
  }

  const cookieNonce = req.cookies?.[STATE_COOKIE];
  const [stateNonce, encodedNext] = String(state).split("|");
  clearStateCookie(res, isProd);
  if (!cookieNonce || !stateNonce || cookieNonce !== stateNonce) {
    log.warn("google_oauth_state_mismatch");
    return redirectToFrontendError(res, frontend, "google_state_mismatch");
  }
  const next = safeNextPath(decodeURIComponent(encodedNext || "/dashboard"));

  let tokenJson;
  try {
    const body = new URLSearchParams({
      code: String(code),
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      redirect_uri: cfg.callbackUrl,
      grant_type: "authorization_code",
    });
    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    tokenJson = await tokenRes.json();
    if (!tokenRes.ok) {
      log.warn("google_oauth_token_exchange_failed", {
        status: tokenRes.status,
        error: tokenJson?.error,
      });
      return redirectToFrontendError(res, frontend, "google_token_exchange_failed");
    }
  } catch (err) {
    log.error("google_oauth_token_exchange_error", { reason: err.message });
    return redirectToFrontendError(res, frontend, "google_unavailable");
  }

  const accessToken = tokenJson.access_token;
  if (!accessToken) {
    return redirectToFrontendError(res, frontend, "google_token_missing");
  }

  let profile;
  try {
    const uiRes = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    profile = await uiRes.json();
    if (!uiRes.ok || !profile?.email) {
      log.warn("google_oauth_userinfo_failed", { status: uiRes.status });
      return redirectToFrontendError(res, frontend, "google_profile_failed");
    }
  } catch (err) {
    log.error("google_oauth_userinfo_error", { reason: err.message });
    return redirectToFrontendError(res, frontend, "google_unavailable");
  }

  if (profile.email_verified === false) {
    return redirectToFrontendError(res, frontend, "google_email_unverified");
  }

  const email = String(profile.email).trim().toLowerCase().slice(0, 255);
  const sub = String(profile.sub || "").slice(0, 128);
  const rawName = (profile.name || profile.given_name || email.split("@")[0] || "")
    .toString()
    .trim()
    .slice(0, 100);
  const name = rawName.replace(/[\u0000-\u001f\u007f]/g, "").trim() || "User";
  const picture = typeof profile.picture === "string" ? profile.picture.slice(0, 500) : null;

  if (!sub) {
    return redirectToFrontendError(res, frontend, "google_profile_failed");
  }

  let user;
  try {
    user = await User.findOne({ googleId: sub });
    if (!user) {
      user = await User.findOne({ email }).collation({ locale: "en", strength: 2 });
      if (user) {
        user.googleId = sub;
        if (!user.avatar && picture) user.avatar = picture;
        if (!user.isVerified) user.isVerified = true;
        await user.save();
      } else {
        user = await User.create({
          name,
          email,
          googleId: sub,
          avatar: picture,
          isVerified: true,
        });
      }
    } else if (picture && user.avatar !== picture) {
      user.avatar = picture;
      await user.save();
    }
  } catch (err) {
    if (err && err.code === 11000) {
      log.warn("google_oauth_dup_key", { reason: err.message });
      return redirectToFrontendError(res, frontend, "google_account_conflict");
    }
    log.error("google_oauth_user_persist_error", { reason: err.message });
    return redirectToFrontendError(res, frontend, "google_unavailable");
  }

  const token = signToken({
    sub: user._id.toString(),
    email: user.email,
    tv: user.tokenVersion || 0,
  });

  log.info("google_oauth_success", { userId: user._id.toString(), ip: req.ip });

  const dest = new URL("/auth/google/success", frontend);
  dest.searchParams.set("token", token);
  dest.searchParams.set("next", next);
  return res.redirect(302, dest.toString());
};
