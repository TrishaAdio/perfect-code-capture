import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { CheckCircle2, Loader2, Mail, ShieldCheck, AlertCircle } from "lucide-react";
import {
  sendOtp as apiSendOtp,
  verifyOtp as apiVerifyOtp,
  updateCachedUser,
  isLoggedIn,
} from "@/lib/api";
import verifyBg from "@/assets/verify-email-bg.mp4.asset.json";

const searchSchema = z.object({
  next: z.string().optional(),
});

export const Route = createFileRoute("/verify-email")({
  validateSearch: searchSchema,
  component: VerifyEmailPage,
  head: () => ({
    meta: [
      { title: "Verify your email — SymDeals" },
      { name: "description", content: "Confirm your email to unlock SymDeals." },
    ],
  }),
});

const COOLDOWN_SEC = 30;

function getCachedEmail(): string {
  if (typeof window === "undefined") return "";
  try {
    const raw = localStorage.getItem("symdeals.user");
    if (!raw) return "";
    const u = JSON.parse(raw);
    return typeof u?.email === "string" ? u.email : "";
  } catch {
    return "";
  }
}

function VerifyEmailPage() {
  const navigate = useNavigate();
  const { next } = useSearch({ from: "/verify-email" });
  const target = useMemo(() => (next && /^\/[A-Za-z0-9\-_/?&=.%]*$/.test(next) ? next : "/dashboard"), [next]);

  const [email, setEmail] = useState<string>("");
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [shake, setShake] = useState(false);
  const [resendIn, setResendIn] = useState<number>(COOLDOWN_SEC);
  const [resending, setResending] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [focusIdx, setFocusIdx] = useState<number | null>(null);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  // Auth gate — must be signed in to verify.
  useEffect(() => {
    if (!isLoggedIn()) {
      navigate({ to: "/login" });
      return;
    }
    setEmail(getCachedEmail());
    setTimeout(() => inputsRef.current[0]?.focus(), 120);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resend countdown
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = window.setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [resendIn]);

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
    if (error) setError(null);
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
    if (code.length !== 6 || verifying || success) return;
    setError(null);
    setVerifying(true);
    try {
      const res = await apiVerifyOtp({ code });
      updateCachedUser(res.user);
      setSuccess(true);
      setTimeout(() => navigate({ to: target }), 1700);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification failed");
      setShake(true);
      setTimeout(() => setShake(false), 450);
      setVerifying(false);
    }
  };

  const resend = async () => {
    if (resendIn > 0 || resending) return;
    setResending(true);
    setError(null);
    setInfo(null);
    try {
      const res = await apiSendOtp();
      if (res.alreadyVerified) {
        setSuccess(true);
        setTimeout(() => navigate({ to: target }), 1500);
        return;
      }
      setResendIn(COOLDOWN_SEC);
      setInfo("A new code is on the way.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send code");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="relative min-h-[100svh] w-full overflow-hidden bg-[#04060a] text-white">
      {/* Ambient atmosphere — present on every viewport */}
      <AmbientAtmosphere />

      <div className="relative z-10 grid min-h-[100svh] grid-cols-1 lg:grid-cols-[1.05fr_1fr]">
        {/* LEFT — Cinematic visual */}
        <section className="relative isolate flex min-h-[44svh] items-end overflow-hidden lg:min-h-[100svh]">
          <CinematicVideo src={verifyBg.url} success={success} />

          {/* Floating brand caption — bottom-left */}
          <div className="relative z-10 hidden w-full px-10 pb-12 lg:block">
            <div className="max-w-[440px]">
              <p className="text-[11.5px] font-semibold uppercase tracking-[0.22em] text-emerald-300/80">
                Account security
              </p>
              <h2 className="mt-3 font-display text-[34px] font-semibold leading-[1.08] tracking-[-0.025em] text-white">
                One last step before you unlock SymDeals.
              </h2>
              <p className="mt-3 max-w-[400px] text-[13.5px] leading-[1.65] text-white/55">
                We use one-time codes to keep your account, orders, and saved payment methods protected.
              </p>
            </div>
          </div>
        </section>

        {/* RIGHT — Verification card */}
        <section className="relative flex items-center justify-center px-5 py-12 sm:px-8 lg:px-14 lg:py-10">
          <div className="w-full max-w-[440px]">
            {success ? (
              <SuccessState />
            ) : (
              <>
                <div className="mb-7 flex items-center gap-3 animate-fade-in">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-emerald-400/25 bg-emerald-400/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                    <Mail className="h-4.5 w-4.5 text-emerald-300" />
                  </div>
                  <span className="text-[12px] font-semibold uppercase tracking-[0.18em] text-white/45">
                    Verification
                  </span>
                </div>

                <h1 className="font-display text-[34px] font-semibold leading-[1.05] tracking-[-0.028em] text-white sm:text-[38px] animate-fade-in">
                  Verify your email
                </h1>
                <p className="mt-3 text-[14px] leading-[1.6] text-white/55 animate-fade-in">
                  We've sent a secure 6-digit code to{" "}
                  <span className="font-semibold text-white">
                    {email || "your inbox"}
                  </span>
                  . Enter it below to continue.
                </p>

                <div
                  className={`mt-8 grid grid-cols-6 gap-2 sm:gap-2.5 ${shake ? "animate-otp-shake" : ""}`}
                  onPaste={(e) => {
                    const text = (e.clipboardData.getData("text") || "").replace(/\D/g, "");
                    if (text.length >= 1) {
                      e.preventDefault();
                      setDigit(0, text);
                    }
                  }}
                >
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
                      onFocus={() => setFocusIdx(i)}
                      onBlur={() => setFocusIdx((c) => (c === i ? null : c))}
                      disabled={verifying}
                      aria-label={`Digit ${i + 1}`}
                      className={`otp-cell h-14 w-full rounded-xl border bg-white/[0.03] text-center font-display text-[22px] font-semibold tabular-nums text-white outline-none transition-[transform,box-shadow,border-color,background-color] duration-200 sm:h-16 sm:text-[24px] ${
                        error
                          ? "border-red-400/60 shadow-[0_0_0_4px_rgba(248,113,113,0.10)]"
                          : focusIdx === i
                            ? "border-emerald-400/70 bg-emerald-400/[0.06] shadow-[0_0_0_4px_rgba(16,185,129,0.12),0_8px_30px_-12px_rgba(16,185,129,0.5)] scale-[1.04]"
                            : d
                              ? "border-white/20 bg-white/[0.05]"
                              : "border-white/10 hover:border-white/20"
                      }`}
                    />
                  ))}
                </div>

                <div className="mt-5 min-h-[24px]">
                  {error && (
                    <div className="flex items-center gap-2 text-[12.5px] font-medium text-red-300 animate-fade-in">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {error}
                    </div>
                  )}
                  {info && !error && (
                    <div className="flex items-center gap-2 text-[12.5px] font-medium text-emerald-300 animate-fade-in">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {info}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={verify}
                  disabled={code.length !== 6 || verifying}
                  className="group relative mt-3 inline-flex h-14 w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-b from-emerald-400 to-emerald-600 text-[14px] font-semibold tracking-tight text-emerald-950 shadow-[0_18px_60px_-18px_rgba(16,185,129,0.7),inset_0_1px_0_rgba(255,255,255,0.5)] transition-all duration-300 hover:shadow-[0_22px_80px_-18px_rgba(16,185,129,0.85),inset_0_1px_0_rgba(255,255,255,0.6)] hover:brightness-[1.05] active:scale-[0.99] disabled:cursor-not-allowed disabled:from-white/10 disabled:to-white/10 disabled:text-white/35 disabled:shadow-none"
                >
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  <span className="relative flex items-center gap-2">
                    {verifying ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Verifying…
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4" />
                        Verify email
                      </>
                    )}
                  </span>
                </button>

                <div className="mt-6 flex items-center justify-between text-[12.5px]">
                  <span className="text-white/40">Didn't get the code?</span>
                  <button
                    type="button"
                    onClick={resend}
                    disabled={resendIn > 0 || resending}
                    className="font-semibold text-emerald-300 transition-colors hover:text-emerald-200 disabled:cursor-not-allowed disabled:text-white/30"
                  >
                    {resending
                      ? "Sending…"
                      : resendIn > 0
                        ? `Resend in ${resendIn}s`
                        : "Resend code"}
                  </button>
                </div>

                <p className="mt-10 text-center text-[11px] text-white/30">
                  Code expires in 10 minutes · Protected by SymDeals security
                </p>
              </>
            )}
          </div>
        </section>
      </div>

      {/* Component-scoped CSS */}
      <style>{`
        @keyframes otp-shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        .animate-otp-shake { animation: otp-shake 0.45s cubic-bezier(.36,.07,.19,.97) both; }

        @keyframes verify-orb-drift {
          0%, 100% { transform: translate3d(-6%, -4%, 0) scale(1); }
          50%      { transform: translate3d(6%, 4%, 0) scale(1.08); }
        }
        @keyframes verify-orb-drift-2 {
          0%, 100% { transform: translate3d(8%, 6%, 0) scale(1.04); }
          50%      { transform: translate3d(-8%, -6%, 0) scale(0.96); }
        }
        @keyframes verify-orb-drift-3 {
          0%, 100% { transform: translate3d(0%, -10%, 0) scale(0.98); }
          50%      { transform: translate3d(0%, 10%, 0) scale(1.06); }
        }
        .verify-orb-1 { animation: verify-orb-drift 18s ease-in-out infinite; }
        .verify-orb-2 { animation: verify-orb-drift-2 24s ease-in-out infinite; }
        .verify-orb-3 { animation: verify-orb-drift-3 22s ease-in-out infinite; }

        @keyframes verify-particle {
          0%   { transform: translate3d(0,0,0); opacity: 0; }
          15%  { opacity: 0.7; }
          100% { transform: translate3d(var(--vx,0), -180px, 0); opacity: 0; }
        }
        .verify-particle {
          position: absolute;
          width: 3px; height: 3px;
          border-radius: 9999px;
          background: radial-gradient(circle, rgba(110,231,183,1) 0%, rgba(16,185,129,0.4) 60%, transparent 100%);
          filter: blur(0.3px);
          animation: verify-particle linear infinite;
        }

        @keyframes verify-success-ring {
          0%   { transform: scale(0.4); opacity: 0.85; }
          100% { transform: scale(2.6); opacity: 0; }
        }
        .verify-success-ring {
          animation: verify-success-ring 1.6s ease-out forwards;
        }

        @keyframes verify-check-draw {
          0%   { stroke-dashoffset: 60; }
          100% { stroke-dashoffset: 0; }
        }
        .verify-check-path {
          stroke-dasharray: 60;
          stroke-dashoffset: 60;
          animation: verify-check-draw 0.55s cubic-bezier(.65,0,.35,1) 0.2s forwards;
        }

        .perf-lite .verify-orb-1,
        .perf-lite .verify-orb-2,
        .perf-lite .verify-orb-3,
        .perf-lite .verify-particle { animation: none !important; }

        @media (prefers-reduced-motion: reduce) {
          .verify-orb-1, .verify-orb-2, .verify-orb-3, .verify-particle,
          .animate-otp-shake { animation: none !important; }
        }
      `}</style>
    </div>
  );
}

/** Cinematic background video, masked into the page (no controls, no rectangle). */
function CinematicVideo({ src, success }: { src: string; success: boolean }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    v.playsInline = true;
    v.play().catch(() => undefined);
  }, []);
  return (
    <div className="pointer-events-none absolute inset-0">
      {/* Video */}
      <video
        ref={videoRef}
        src={src}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 h-full w-full object-cover opacity-90 [mask-image:radial-gradient(120%_90%_at_50%_45%,black_50%,transparent_92%)]"
        style={{
          filter: `saturate(1.05) contrast(1.02) ${success ? "brightness(1.25)" : "brightness(1)"}`,
          transition: "filter 800ms ease-out",
        }}
      />
      {/* Color wash to fuse video into the page */}
      <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_30%_40%,rgba(16,185,129,0.18),transparent_70%)]" />
      <div className="absolute inset-0 bg-gradient-to-tr from-[#04060a]/85 via-transparent to-[#04060a]/40" />
      {/* Right edge fade — blends into the OTP column on desktop */}
      <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-gradient-to-l from-[#04060a] to-transparent lg:block" />
      {/* Bottom fade — blends into the OTP section on mobile */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-[#04060a] lg:hidden" />
      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_50%,transparent_50%,rgba(0,0,0,0.55)_100%)]" />
    </div>
  );
}

/** Drifting emerald glows + faint particles for atmospheric depth across the page. */
function AmbientAtmosphere() {
  // Pre-compute particle positions once.
  const particles = useMemo(
    () =>
      Array.from({ length: 14 }).map((_, i) => ({
        left: `${(i * 53) % 100}%`,
        bottom: `${(i * 37) % 80}%`,
        delay: `${(i * 0.9) % 8}s`,
        duration: `${7 + ((i * 1.3) % 6)}s`,
        vx: `${((i % 5) - 2) * 12}px`,
      })),
    [],
  );
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* base */}
      <div className="absolute inset-0 bg-[radial-gradient(140%_90%_at_50%_0%,#0a1410_0%,#04060a_55%,#020306_100%)]" />
      {/* drifting glows */}
      <div className="verify-orb-1 absolute -left-[20%] top-[10%] h-[55vmax] w-[55vmax] rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.22)_0%,transparent_60%)] blur-3xl" />
      <div className="verify-orb-2 absolute -right-[15%] bottom-[-10%] h-[50vmax] w-[50vmax] rounded-full bg-[radial-gradient(circle,rgba(20,184,166,0.20)_0%,transparent_60%)] blur-3xl" />
      <div className="verify-orb-3 absolute left-[40%] top-[30%] h-[35vmax] w-[35vmax] rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.10)_0%,transparent_60%)] blur-3xl" />
      {/* grid */}
      <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.5)_1px,transparent_1px)] [background-size:48px_48px]" />
      {/* particles */}
      {particles.map((p, i) => (
        <span
          key={i}
          className="verify-particle"
          style={{
            left: p.left,
            bottom: p.bottom,
            animationDelay: p.delay,
            animationDuration: p.duration,
            ["--vx" as string]: p.vx,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

function SuccessState() {
  return (
    <div className="relative flex flex-col items-center text-center">
      <div className="relative grid h-28 w-28 place-items-center">
        {/* Expanding rings */}
        <span className="verify-success-ring absolute inset-0 rounded-full border border-emerald-400/40" />
        <span
          className="verify-success-ring absolute inset-0 rounded-full border border-emerald-400/30"
          style={{ animationDelay: "0.15s" }}
        />
        {/* Soft glow */}
        <span className="absolute inset-0 rounded-full bg-emerald-400/20 blur-2xl" />
        {/* Check */}
        <div className="relative grid h-20 w-20 place-items-center rounded-full bg-gradient-to-b from-emerald-400 to-emerald-600 shadow-[0_20px_60px_-15px_rgba(16,185,129,0.7),inset_0_1px_0_rgba(255,255,255,0.5)]">
          <svg viewBox="0 0 24 24" className="h-9 w-9 text-emerald-950" fill="none">
            <path
              d="M5 12.5l4.5 4.5L19 7.5"
              stroke="currentColor"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="verify-check-path"
            />
          </svg>
        </div>
      </div>
      <h1 className="mt-8 font-display text-[30px] font-semibold tracking-[-0.025em] text-white animate-fade-in">
        Email verified successfully
      </h1>
      <p className="mt-3 max-w-[320px] text-[14px] leading-[1.6] text-white/55 animate-fade-in">
        Your SymDeals account is now fully secured. Taking you in…
      </p>
      <div className="mt-6 flex items-center gap-2 text-[12px] font-medium text-emerald-300/90 animate-fade-in">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Redirecting
      </div>
    </div>
  );
}
