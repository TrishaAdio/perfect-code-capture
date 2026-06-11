import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { forgotPassword } from "@/lib/api";
import { InlineErrorBanner } from "@/components/InlineErrorBanner";
import {
  AuthShell,
  PremiumField,
  PrimaryButton,
} from "@/components/auth/AuthShell";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
  head: () => ({
    meta: [
      { title: "Reset your password — SymDeals" },
      {
        name: "description",
        content:
          "Reset your SymDeals password. We'll email you a secure link that works on any device.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await forgotPassword({ email: email.trim() });
      setSent(true);
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell>
      <AnimatePresence mode="wait">
        {sent ? (
          <SentState key="sent" email={email} />
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mb-7 text-center">
              <div className="mb-3 inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1">
                <span className="text-[11px] font-medium text-white/60">
                  Password Reset
                </span>
              </div>
              <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-white">
                Reset your password
              </h1>
              <p className="mt-2 text-[13.5px] text-white/55">
                Enter your email and we'll send you a secure reset link.
              </p>
            </div>

            <form className="space-y-3.5" onSubmit={submit}>
              <PremiumField
                label="Email"
                type="email"
                value={email}
                onChange={(v) => {
                  setEmail(v);
                  if (error) setError(null);
                }}
                autoComplete="email"
                autoFocus
                placeholder="alan.turing@example.com"
              />

              {error && (
                <InlineErrorBanner
                  message={error}
                  onDismiss={() => setError(null)}
                />
              )}

              <PrimaryButton loading={submitting} disabled={!valid}>
                {submitting ? "Sending…" : "Send Reset Link"}
              </PrimaryButton>
            </form>

            <p className="mt-7 text-center text-[13.5px] text-white/55">
              <Link
                to="/login"
                className="font-medium text-white/70 transition-colors hover:text-white hover:underline"
              >
                Back to login
              </Link>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthShell>
  );
}

function SentState({ email }: { email: string }) {
  return (
    <motion.div
      key="sent"
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="text-center"
    >
      <div className="mb-5 flex justify-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04]">
          <CheckCircle2 className="h-5.5 w-5.5 text-white/80" strokeWidth={2} />
        </div>
      </div>

      <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-white">
        Reset email sent
      </h2>
      <p className="mx-auto mt-2 max-w-[320px] text-[13.5px] leading-[1.55] text-white/55">
        Check your inbox for a secure password reset link. It expires in 10
        minutes.
      </p>

      {email && (
        <p className="mt-4 text-[13px] text-white/40">
          Sent to{" "}
          <span className="font-medium text-white/70">{email.trim()}</span>
        </p>
      )}

      <div className="mt-8">
        <Link
          to="/login"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-foreground px-5 py-2.5 text-[13.5px] font-semibold text-background shadow-[0_1px_0_rgba(255,255,255,0.25)_inset,0_1px_2px_rgba(0,0,0,0.5)] transition-all duration-150 hover:bg-foreground/90"
        >
          Back to login
        </Link>
      </div>
    </motion.div>
  );
}
