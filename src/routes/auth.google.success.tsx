import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { fetchMe, saveSession, SESSION_TTL_MS } from "@/lib/api";

export const Route = createFileRoute("/auth/google/success")({
  component: GoogleSuccessPage,
  head: () => ({
    meta: [
      { title: "Signing you in… — SymDeals" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
});

function GoogleSuccessPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const next = params.get("next") || "/dashboard";

    // Strip the token from the URL immediately so it never lands in
    // history/referrer logs even if a downstream call fails.
    window.history.replaceState({}, "", "/auth/google/success");

    if (!token) {
      window.location.replace("/login?auth_error=google_token_missing");
      return;
    }

    const safeNext = /^\/[A-Za-z0-9\-_/?&=.%]*$/.test(next) ? next : "/dashboard";

    (async () => {
      try {
        // Persist the JWT first so fetchMe() picks it up.
        const expiry = Date.now() + SESSION_TTL_MS;
        localStorage.setItem("symdeals.token", token);
        localStorage.setItem("symdeals.token_expiry", String(expiry));

        const me = await fetchMe();
        if (cancelled) return;
        saveSession({ success: true, token, user: me.user });
        // navigate to next path (full reload not required — same SPA).
        window.location.replace(safeNext);
      } catch {
        if (cancelled) return;
        localStorage.removeItem("symdeals.token");
        localStorage.removeItem("symdeals.token_expiry");
        setError("Could not complete sign-in. Please try again.");
        setTimeout(() => {
          window.location.replace("/login?auth_error=google_unavailable");
        }, 1200);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-[13px] font-medium text-foreground">
          {error ? error : "Signing you in with Google…"}
        </p>
        <p className="text-[11.5px] text-muted-foreground">
          This will only take a moment.
        </p>
      </div>
    </div>
  );
}
