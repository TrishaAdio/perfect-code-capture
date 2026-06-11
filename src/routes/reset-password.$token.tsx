import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { resetPassword, verifyResetToken } from "@/lib/api";
import { InlineErrorBanner } from "@/components/InlineErrorBanner";
import symdealsLogo from "@/assets/symdeals-logo.png";

export const Route = createFileRoute("/reset-password/$token")({
  component: ResetPasswordPage,
  head: () => ({
    meta: [
      { title: "Create a new password — SymDeals" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

type Status = "checking" | "valid" | "invalid" | "done";

function ResetPasswordPage() {
  const { token } = Route.useParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState<Status>("checking");
  const [tokenError, setTokenError] = useState<string | null>(null);

  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await verifyResetToken(token);
        if (!cancelled) setStatus("valid");
      } catch (err) {
        if (cancelled) return;
        setStatus("invalid");
        setTokenError(
          err instanceof Error
            ? err.message
            : "Reset link is invalid or has expired"
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const lengthOk = pwd.length >= 8;
  const matches = pwd.length > 0 && pwd === confirm;
  const canSubmit = lengthOk && matches && !submitting;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) {
      if (!lengthOk) setSubmitError("Password must be at least 8 characters");
      else if (!matches) setSubmitError("Passwords do not match");
      return;
    }
    setSubmitError(null);
    setSubmitting(true);
    try {
      await resetPassword({ token, newPassword: pwd });
      setStatus("done");
      window.setTimeout(() => navigate({ to: "/login" }), 2000);
    } catch (err) {
      setSubmitError(
        err instanceof Error && err.message
          ? err.message
          : "Reset failed. Please try again.",
      );
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
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to login
          </Link>
        </div>
      </header>

      <div className="mx-auto flex max-w-md flex-col px-6 py-16 lg:py-24">
        {status === "checking" && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-[13px] text-muted-foreground">
              Verifying reset link…
            </p>
          </div>
        )}

        {status === "invalid" && (
          <div className="animate-fade-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-destructive/30 bg-destructive/10 px-3 py-1">
              <ShieldAlert className="h-3 w-3 text-destructive" />
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-destructive">
                Link Expired
              </span>
            </div>
            <h1 className="mt-5 font-display text-[1.75rem] font-bold tracking-[-0.02em] text-foreground">
              Reset link expired
            </h1>
            <p className="mt-2 text-[13.5px] text-muted-foreground">
              {tokenError ||
                "This reset link is no longer valid. Please request a new one."}
            </p>
            <Link
              to="/forgot-password"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-2.5 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-[var(--primary-hover)]"
            >
              Request new link
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {status === "done" && (
          <div className="animate-fade-up rounded-md border border-primary/30 bg-primary/5 p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/15">
              <CheckCircle2 className="h-6 w-6 text-primary" />
            </div>
            <h1 className="mt-4 font-display text-[1.4rem] font-bold tracking-[-0.02em] text-foreground">
              Password updated
            </h1>
            <p className="mt-2 text-[13px] text-muted-foreground">
              Redirecting you to login…
            </p>
          </div>
        )}

        {status === "valid" && (
          <div className="animate-fade-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1">
              <ShieldCheck className="h-3 w-3 text-primary" />
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Secure Reset
              </span>
            </div>

            <h1 className="mt-5 font-display text-[1.75rem] font-bold tracking-[-0.02em] text-foreground">
              Create a new password
            </h1>
            <p className="mt-2 text-[13px] text-muted-foreground">
              Choose a strong password you haven't used before.
            </p>

            <form className="mt-7 space-y-5" onSubmit={submit}>
              <PasswordField
                label="New Password"
                value={pwd}
                onChange={(v) => {
                  setPwd(v);
                  if (submitError) setSubmitError(null);
                }}
                show={showPwd}
                onToggle={() => setShowPwd((s) => !s)}
                autoFocus
              />

              <div>
                <label className="mb-2 block text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Confirm Password
                </label>
                <div
                  className={`relative flex items-center rounded-md border bg-input transition-all duration-150 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 ${
                    confirm.length > 0 && !matches
                      ? "border-destructive/60"
                      : "border-border"
                  }`}
                >
                  <input
                    type={showPwd ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => {
                      setConfirm(e.target.value);
                      if (submitError) setSubmitError(null);
                    }}
                    autoComplete="new-password"
                    className="w-full bg-transparent px-3.5 py-3 text-[14px] font-medium text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
                  />
                </div>
                {confirm.length > 0 && !matches && (
                  <p className="mt-1.5 text-[11px] font-medium text-destructive">
                    Passwords do not match
                  </p>
                )}
              </div>

              <ul className="space-y-1.5 text-[11.5px] text-muted-foreground">
                <li
                  className={`flex items-center gap-2 ${
                    lengthOk ? "text-primary" : ""
                  }`}
                >
                  <span
                    className={`flex h-3.5 w-3.5 items-center justify-center rounded-full ${
                      lengthOk ? "bg-primary/20" : "bg-muted"
                    }`}
                  >
                    {lengthOk ? (
                      <CheckCircle2 className="h-3 w-3 text-primary" />
                    ) : null}
                  </span>
                  At least 8 characters
                </li>
              </ul>

              <InlineErrorBanner
                message={submitError}
                onDismiss={() => setSubmitError(null)}
              />

              <button
                type="submit"
                disabled={!canSubmit}
                className="group inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-[14px] font-semibold tracking-tight text-primary-foreground transition-all hover:bg-[var(--primary-hover)] hover:shadow-glow disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Updating…
                  </>
                ) : (
                  <>
                    Update Password
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  show,
  onToggle,
  autoFocus,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  autoFocus?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </label>
      <div className="relative flex items-center rounded-md border border-border bg-input transition-all duration-150 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="new-password"
          autoFocus={autoFocus}
          className="w-full bg-transparent px-3.5 py-3 text-[14px] font-medium text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={show ? "Hide password" : "Show password"}
          className="pr-3 text-muted-foreground transition-colors hover:text-foreground"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
