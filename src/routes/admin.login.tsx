import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2, Lock, ShieldCheck, ArrowRight } from "lucide-react";
import { adminLogin, getAdminToken, saveAdminSession } from "@/lib/api";
import symdealsLogo from "@/assets/symdeals-logo.png";

export const Route = createFileRoute("/admin/login")({
  component: AdminLoginPage,
  head: () => ({
    meta: [
      { title: "Admin Login — SymDeals" },
      { name: "description", content: "SymDeals admin panel login." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Already signed in? Skip straight to dashboard.
  useEffect(() => {
    if (getAdminToken()) navigate({ to: "/admin/dashboard" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError("Email and password are required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await adminLogin({ email: email.trim(), password });
      saveAdminSession(res);
      navigate({ to: "/admin/dashboard" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link to="/" aria-label="SymDeals home" className="group flex items-center">
            <img
              src={symdealsLogo}
              alt="SymDeals"
              className="h-5 w-auto object-contain transition-all duration-300 ease-out group-hover:scale-[1.03] sm:h-6"
              style={{ filter: "drop-shadow(0 0 6px rgba(0, 255, 170, 0.2))" }}
            />
          </Link>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <ShieldCheck className="h-3 w-3 text-primary" />
            Admin
          </span>
        </div>
      </header>

      <div className="mx-auto flex max-w-md flex-col px-6 py-16">
        <div className="animate-fade-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1">
            <Lock className="h-3 w-3 text-primary" />
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Restricted Access
            </span>
          </div>

          <h1 className="mt-5 font-display text-[1.75rem] font-bold tracking-[-0.02em] text-foreground">
            Admin Panel
          </h1>
          <p className="mt-2 text-[13px] text-muted-foreground">
            Sign in with your admin credentials.
          </p>

          <form
            className="mt-7 space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (!submitting) void submit();
            }}
          >
            <div>
              <label className="mb-2 block text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Email
              </label>
              <div className="flex items-center rounded-md border border-border bg-input transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                <input
                  type="email"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent px-3.5 py-3 text-[14px] font-medium text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
                  placeholder="admin@symdeals.com"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Password
              </label>
              <div className="flex items-center rounded-md border border-border bg-input transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                <input
                  type={showPwd ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent px-3.5 py-3 text-[14px] font-medium text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((s) => !s)}
                  aria-label={showPwd ? "Hide password" : "Show password"}
                  className="pr-3 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-[12px] font-medium text-destructive">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="group inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-[14px] font-semibold tracking-tight text-primary-foreground transition-all hover:bg-[var(--primary-hover)] hover:shadow-glow disabled:opacity-70"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-center gap-2 text-[11.5px] text-muted-foreground">
            <Lock className="h-3 w-3 text-primary" />
            <span>Restricted area · Authorised personnel only</span>
          </div>
        </div>
      </div>
    </div>
  );
}
