import { useEffect, useRef, useState } from "react";
import { Loader2, Mail, ShieldCheck, X } from "lucide-react";
import { sendOtp as apiSendOtp, verifyOtp as apiVerifyOtp, updateCachedUser } from "@/lib/api";

type Props = {
  open: boolean;
  email: string;
  /**
   * autoSend = false when called right after signup (signup endpoint already sent it).
   * autoSend = true when re-opened from the dashboard banner.
   */
  autoSend?: boolean;
  onClose: () => void;
  onVerified: () => void;
  onSkip?: () => void;
};

const COOLDOWN_SEC = 30;

export function OtpVerifyModal({
  open,
  email,
  autoSend = false,
  onClose,
  onVerified,
  onSkip,
}: Props) {
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resendIn, setResendIn] = useState<number>(COOLDOWN_SEC);
  const [resending, setResending] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  // Reset + body lock when opened
  useEffect(() => {
    if (!open) return;
    setDigits(["", "", "", "", "", ""]);
    setError(null);
    setInfo(null);
    setSuccess(false);
    setResendIn(COOLDOWN_SEC);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    // focus first input
    setTimeout(() => inputsRef.current[0]?.focus(), 60);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  // Auto-send OTP when re-opened (e.g. from banner). Signup already sends it.
  useEffect(() => {
    if (!open || !autoSend) return;
    void resend(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, autoSend]);

  // Resend countdown
  useEffect(() => {
    if (!open) return;
    if (resendIn <= 0) return;
    const t = window.setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [open, resendIn]);

  const code = digits.join("");

  const setDigit = (i: number, v: string) => {
    const cleaned = v.replace(/\D/g, "");
    if (!cleaned) {
      const next = [...digits];
      next[i] = "";
      setDigits(next);
      return;
    }
    if (cleaned.length > 1) {
      // Pasted block
      const chars = cleaned.slice(0, 6 - i).split("");
      const next = [...digits];
      chars.forEach((c, idx) => {
        next[i + idx] = c;
      });
      setDigits(next);
      const last = Math.min(i + chars.length, 5);
      inputsRef.current[last]?.focus();
      return;
    }
    const next = [...digits];
    next[i] = cleaned;
    setDigits(next);
    if (i < 5) inputsRef.current[i + 1]?.focus();
  };

  const onKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      inputsRef.current[i - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && i > 0) inputsRef.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < 5) inputsRef.current[i + 1]?.focus();
    if (e.key === "Enter" && code.length === 6 && !verifying) verify();
  };

  const verify = async () => {
    if (code.length !== 6 || verifying) return;
    setError(null);
    setVerifying(true);
    try {
      const res = await apiVerifyOtp({ code });
      updateCachedUser(res.user);
      setSuccess(true);
      // Brief success animation, then hand off
      setTimeout(() => {
        onVerified();
      }, 850);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification failed");
      setVerifying(false);
    }
  };

  const resend = async (silent = false) => {
    if (resendIn > 0 || resending) return;
    setResending(true);
    setError(null);
    if (!silent) setInfo(null);
    try {
      const res = await apiSendOtp();
      if (res.alreadyVerified) {
        onVerified();
        return;
      }
      setResendIn(COOLDOWN_SEC);
      if (!silent) setInfo("New code sent. Check your inbox.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send code");
    } finally {
      setResending(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="otp-title"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-background/75 backdrop-blur-sm animate-fade-up"
      />

      <div
        className="relative w-full max-w-md rounded-2xl border border-border bg-surface shadow-elegant animate-fade-up"
        style={{ animationDelay: "0.02s" }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-elevated hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="px-6 pt-7">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/12">
            {success ? (
              <ShieldCheck className="h-5 w-5 text-primary animate-fade-up" />
            ) : (
              <Mail className="h-5 w-5 text-primary" />
            )}
          </div>
          <h2
            id="otp-title"
            className="mt-4 font-display text-[20px] font-bold tracking-tight text-foreground"
          >
            {success ? "Email verified" : "Verify your email"}
          </h2>
          <p className="mt-1.5 text-[13.5px] leading-[1.55] text-muted-foreground">
            {success ? (
              <>You're all set. Redirecting…</>
            ) : (
              <>
                Enter the 6-digit code sent to{" "}
                <span className="font-semibold text-foreground">{email}</span>
              </>
            )}
          </p>
        </div>

        {!success && (
          <div className="px-6 pt-6">
            <div className="flex items-center justify-between gap-2">
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    inputsRef.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={d}
                  onChange={(e) => setDigit(i, e.target.value)}
                  onKeyDown={(e) => onKeyDown(i, e)}
                  disabled={verifying}
                  aria-label={`Digit ${i + 1}`}
                  className="h-14 w-full max-w-[52px] rounded-lg border border-border bg-input text-center font-display text-[22px] font-bold text-foreground tabular-nums transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 disabled:opacity-60"
                />
              ))}
            </div>

            {error && (
              <p className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-[12.5px] font-medium text-destructive">
                {error}
              </p>
            )}
            {info && !error && (
              <p className="mt-4 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-[12.5px] font-medium text-primary">
                {info}
              </p>
            )}

            <button
              type="button"
              onClick={verify}
              disabled={code.length !== 6 || verifying}
              className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary text-[13.5px] font-bold tracking-tight text-primary-foreground transition-all hover:bg-[var(--primary-hover)] hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-50"
            >
              {verifying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying…
                </>
              ) : (
                <>Verify Now</>
              )}
            </button>

            <div className="mt-3 flex items-center justify-between text-[12px]">
              <button
                type="button"
                onClick={() => resend(false)}
                disabled={resendIn > 0 || resending}
                className="font-semibold text-primary transition-colors hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
              >
                {resending
                  ? "Sending…"
                  : resendIn > 0
                    ? `Resend OTP (${resendIn}s)`
                    : "Resend OTP"}
              </button>
              {onSkip && (
                <button
                  type="button"
                  onClick={onSkip}
                  className="font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Skip for now →
                </button>
              )}
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center justify-center border-t border-border bg-surface-elevated/40 px-6 py-3 rounded-b-2xl">
          <p className="text-[11.5px] text-muted-foreground">
            Code expires in 10 minutes.
          </p>
        </div>
      </div>
    </div>
  );
}
