// Synchronous client-side auth guards for protected routes.
//
// Used from `beforeLoad` so that no protected component ever mounts (and
// no protected data ever fetches) for an unauthenticated visitor. Pair with
// `ssr: false` on the route so the server never renders protected markup
// either — the browser sees a blank shell, the guard runs, then the
// redirect throws before any UI paints.

import { redirect } from "@tanstack/react-router";

const TOKEN_KEY = "symdeals.token";
const TOKEN_EXPIRY_KEY = "symdeals.token_expiry";
const USER_KEY = "symdeals.user";

type CachedUser = {
  id?: string;
  email?: string;
  isVerified?: boolean;
};

function readToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    const expiryRaw = localStorage.getItem(TOKEN_EXPIRY_KEY);
    if (expiryRaw) {
      const expiry = Number(expiryRaw);
      if (Number.isFinite(expiry) && Date.now() > expiry) {
        try {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(TOKEN_EXPIRY_KEY);
          localStorage.removeItem(USER_KEY);
        } catch {
          /* ignore */
        }
        return null;
      }
    }
    return token;
  } catch {
    return null;
  }
}

function readCachedUser(): CachedUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CachedUser;
  } catch {
    return null;
  }
}

/**
 * Block access to a route unless the visitor has a valid local session.
 * SSR is a no-op (the route should also set `ssr: false`); on the client
 * an unauthenticated visitor is redirected to `/login` BEFORE the
 * component mounts, so no protected UI ever paints.
 */
export function requireAuthBeforeLoad() {
  if (typeof window === "undefined") return;
  if (!readToken()) {
    throw redirect({ to: "/login" });
  }
}

/**
 * Guard for `/verify-email`:
 *   - not signed in  → redirect to "/"
 *   - already verified → redirect to "/dashboard"
 *   - otherwise allow render
 */
export function requireUnverifiedBeforeLoad() {
  if (typeof window === "undefined") return;
  if (!readToken()) {
    throw redirect({ to: "/" });
  }
  const user = readCachedUser();
  if (user?.isVerified === true) {
    throw redirect({ to: "/dashboard" });
  }
}

/**
 * Redirect already-authenticated users away from public auth pages
 * (login, signup, forgot-password) so they can't double-back into
 * the auth flow once signed in.
 */
export function redirectIfAuthenticated(to: "/dashboard" | "/verify-email" = "/dashboard") {
  if (typeof window === "undefined") return;
  if (readToken()) {
    throw redirect({ to });
  }
}
