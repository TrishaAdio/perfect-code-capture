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
import envelopeVideo from "@/assets/verify-envelope.mp4.asset.json";

const searchSchema = z.object({
  next: z.string().optional(),
});

export const Route = createFileRoute("/verify-email")({
  validateSearch: searchSchema,
  component: VerifyEmailPage,
  head: () => ({
    meta: [
      { title: "Secure your account — SymDeals" },
      { name: "description", content: "Verify your email to activate orders, delivery notifications, and account features." },
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

type Perf = "low" | "medium" | "high";
function getPerf(): Perf {
  if (typeof window === "undefined") return "medium";
  try {
    const v = localStorage.getItem("symdeals.perf");
    if (v === "low" || v === "medium" || v === "high") return v;
  } catch {}
  // Auto-downgrade for low-end devices
  // @ts-expect-error - non-standard
  const mem = navigator.deviceMemory as number | undefined;
  const cores = navigator.hardwareConcurrency || 4;
  if ((mem && mem <= 2) || cores <= 2) return "low";
  return "medium";
}

function VerifyEmailPage() {
  const navigate = useNavigate();
  const { next } = useSearch({ from: "/verify-email" });
  const target = useMemo(
    () => (next && /^\/[A-Za-z0-9\-_/?&=.%]*$/.test(next) ? next : "/dashboard"),
    [next],
  );

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
  const [popIdx, setPopIdx] = useState<number | null>(null);
  const [stage, setStage] = useState<"idle" | "verifying" | "opening" | "complete">("idle");
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const perf = useMemo(getPerf, []);

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate({ to: "/login" });
      return;
    }
    setEmail(getCachedEmail());
    setTimeout(() => inputsRef.current[0]?.focus(), 120);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      setPopIdx(last);
      window.setTimeout(() => setPopIdx(null), 220);
      return;
    }
    const next = [...digits];
    next[i] = cleaned;
    setDigits(next);
    setPopIdx(i);
    window.setTimeout(() => setPopIdx(null), 220);
    if (error) setError(null);
    if (i < 5) inputsRef.current[i + 1]?.focus();
  };

  const onKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!digits[i] && i > 0) {
        inputsRef.current[i - 1]?.focus();
        const next = [...digits];
        next[i - 1] = "";
        setDigits(next);
        e.preventDefault();
      }
    }
    if (e.key === "ArrowLeft" && i > 0) inputsRef.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < 5) inputsRef.current[i + 1]?.focus();
    if (e.key === "Enter" && code.length === 6 && !verifying) verify();
  };

  const verify = async () => {
    if (code.length !== 6 || verifying || success) return;
    setError(null);
    setVerifying(true);
    setStage("verifying");
    try {
      const res = await apiVerifyOtp({ code });
      updateCachedUser(res.user);
      // Premium completion sequence
      setStage("opening");
      window.setTimeout(() => {
        setSuccess(true);
        setStage("complete");
      }, 850);
      window.setTimeout(() => navigate({ to: target }), 2600);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification failed");
      setShake(true);
      setStage("idle");
      window.setTimeout(() => setShake(false), 450);
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
        setStage("complete");
        window.setTimeout(() => navigate({ to: target }), 1500);
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
    <div
      className={`relative min-h-[100svh] w-full overflow-hidden bg-[#04060a] text-white perf-${perf}`}
    >
      {/* Unified scene background — atmosphere + envelope video, full bleed */}
      <AmbientAtmosphere />
      <EnvelopeScene stage={stage} />

      {/* Single continuous environment. No split, no seam. */}
      <div className="relative z-10 grid min-h-[100svh] grid-cols-1 lg:grid-cols-[1.1fr_1fr]">
        {/* LEFT — brand caption only; the envelope lives in the scene behind everything */}
        <section className="relative flex min-h-[44svh] flex-col justify-end px-6 pb-10 pt-16 lg:min-h-[100svh] lg:px-14 lg:pb-14 lg:pt-0">
          <div className="pointer-events-none max-w-[440px] lg:mt-auto">
            <p className="text-[11.5px] font-semibold uppercase tracking-[0.22em] text-emerald-300/80">
              Account security
            </p>
            <h2 className="mt-3 font-display text-[28px] font-semibold leading-[1.08] tracking-[-0.025em] text-white sm:text-[32px]">
              Secure your account.
            </h2>
            <p className="mt-3 max-w-[420px] text-[13.5px] leading-[1.65] text-white/55">
              Verify your email to activate orders, receive delivery notifications, access account features, and protect your purchases.
            </p>
          </div>
        </section>

        {/* RIGHT — verification card floats over the same scene, no panel, no divider */}
        <section className="relative flex items-center justify-center px-5 pb-14 pt-4 sm:px-8 lg:px-14 lg:py-10">
          <div className="relative w-full max-w-[440px]">

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
                  Secure your account
                </h1>
                <p className="mt-3 text-[14px] leading-[1.6] text-white/55 animate-fade-in">
                  We've sent a secure 6-digit code to{" "}
                  <span className="font-semibold text-white">
                    {email || "your inbox"}
                  </span>
                  . Enter it below to activate orders, delivery updates, and account protections.
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
                  {digits.map((d, i) => {
                    const filled = !!d;
                    const isFocus = focusIdx === i;
                    return (
                      <div key={i} className="relative">
                        {isFocus && (
                          <span
                            aria-hidden
                            className="otp-glow absolute -inset-[3px] rounded-[14px]"
                          />
                        )}
                        <input
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
                          className={`otp-cell relative z-10 h-14 w-full rounded-xl border bg-white/[0.03] text-center font-display text-[22px] font-semibold tabular-nums text-white outline-none backdrop-blur-sm transition-[transform,box-shadow,border-color,background-color,color] duration-200 sm:h-16 sm:text-[24px] ${
                            error
                              ? "border-red-400/60 shadow-[0_0_0_4px_rgba(248,113,113,0.10)]"
                              : isFocus
                                ? "border-emerald-400/70 bg-emerald-400/[0.08] scale-[1.06]"
                                : filled
                                  ? "border-emerald-400/30 bg-emerald-400/[0.04] text-emerald-100"
                                  : "border-white/10 hover:border-white/25"
                          } ${popIdx === i ? "otp-pop" : ""}`}
                        />
                      </div>
                    );
                  })}
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
                  className={`verify-btn group relative mt-3 inline-flex h-14 w-full items-center justify-center overflow-hidden rounded-2xl text-[14px] font-semibold tracking-tight text-emerald-950 transition-all duration-300 active:scale-[0.99] disabled:cursor-not-allowed disabled:text-white/35 ${
                    code.length === 6 && !verifying
                      ? "verify-btn-ready hover:-translate-y-[1px]"
                      : ""
                  }`}
                >
                  <span className="verify-btn-bg absolute inset-0" />
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  <span className="relative flex items-center gap-2">
                    {stage === "verifying" ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Verifying…
                      </>
                    ) : stage === "opening" || stage === "complete" ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Verified
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

      <style>{`
        @keyframes otp-shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        .animate-otp-shake { animation: otp-shake 0.45s cubic-bezier(.36,.07,.19,.97) both; }

        /* OTP focus glow ring */
        .otp-glow {
          background: radial-gradient(60% 60% at 50% 50%, rgba(16,185,129,0.55), rgba(16,185,129,0) 70%);
          filter: blur(10px);
          opacity: 0.9;
          animation: otp-glow-pulse 2.2s ease-in-out infinite;
        }
        @keyframes otp-glow-pulse {
          0%, 100% { opacity: 0.55; }
          50%      { opacity: 1; }
        }
        @keyframes otp-pop {
          0%   { transform: scale(1); }
          40%  { transform: scale(1.14); }
          100% { transform: scale(1.06); }
        }
        .otp-pop { animation: otp-pop 0.22s cubic-bezier(.34,1.56,.64,1) both; }

        /* Verify button — emerald gradient + soft shadow */
        .verify-btn-bg {
          background: linear-gradient(180deg, #34d399 0%, #10b981 55%, #059669 100%);
          box-shadow:
            0 18px 60px -18px rgba(16,185,129,0.7),
            inset 0 1px 0 rgba(255,255,255,0.55),
            inset 0 -1px 0 rgba(0,0,0,0.12);
          transition: filter .3s ease, box-shadow .3s ease;
        }
        .verify-btn-ready:hover .verify-btn-bg {
          filter: brightness(1.06);
          box-shadow:
            0 24px 80px -18px rgba(16,185,129,0.9),
            inset 0 1px 0 rgba(255,255,255,0.65),
            inset 0 -1px 0 rgba(0,0,0,0.12);
        }
        .verify-btn:disabled .verify-btn-bg {
          background: rgba(255,255,255,0.07);
          box-shadow: none;
        }

        /* Atmosphere */
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
        .verify-orb-1 { animation: verify-orb-drift 22s ease-in-out infinite; will-change: transform; }
        .verify-orb-2 { animation: verify-orb-drift-2 28s ease-in-out infinite; will-change: transform; }
        .verify-orb-3 { animation: verify-orb-drift-3 26s ease-in-out infinite; will-change: transform; }

        @keyframes aurora-shift {
          0%, 100% { transform: translate3d(-10%, 0, 0) rotate(0deg); opacity: .55; }
          50%      { transform: translate3d(10%, -4%, 0) rotate(8deg);  opacity: .85; }
        }
        .verify-aurora {
          position: absolute; inset: -20% -10% auto -10%; height: 70vh;
          background:
            radial-gradient(40% 60% at 30% 50%, rgba(16,185,129,0.35) 0%, transparent 70%),
            radial-gradient(40% 60% at 70% 40%, rgba(20,184,166,0.30) 0%, transparent 70%),
            radial-gradient(40% 60% at 50% 70%, rgba(56,189,248,0.18) 0%, transparent 70%);
          filter: blur(60px);
          animation: aurora-shift 26s ease-in-out infinite;
          will-change: transform, opacity;
        }

        @keyframes verify-particle {
          0%   { transform: translate3d(0,0,0); opacity: 0; }
          15%  { opacity: 0.7; }
          100% { transform: translate3d(var(--vx,0), -200px, 0); opacity: 0; }
        }
        .verify-particle {
          position: absolute;
          width: 3px; height: 3px;
          border-radius: 9999px;
          background: radial-gradient(circle, rgba(110,231,183,1) 0%, rgba(16,185,129,0.4) 60%, transparent 100%);
          filter: blur(0.3px);
          animation: verify-particle linear infinite;
          will-change: transform, opacity;
        }

        /* Envelope */
        .env-stage { perspective: 1400px; }
        @keyframes env-float {
          0%, 100% { transform: translate3d(var(--px,0), 0, 0) rotateX(var(--rx,8deg)) rotateY(var(--ry,-10deg)); }
          50%      { transform: translate3d(var(--px,0), -14px, 0) rotateX(calc(var(--rx,8deg) + 1.5deg)) rotateY(calc(var(--ry,-10deg) + 2deg)); }
        }
        .env-float { animation: env-float 7.5s ease-in-out infinite; will-change: transform; }

        @keyframes env-pulse {
          0%, 100% { opacity: 0.55; transform: scale(1); }
          50%      { opacity: 1;    transform: scale(1.08); }
        }
        .env-pulse { animation: env-pulse 4.2s ease-in-out infinite; }

        @keyframes env-shine {
          0%   { transform: translateX(-120%) skewX(-18deg); opacity: 0; }
          15%  { opacity: .7; }
          60%  { opacity: .4; }
          100% { transform: translateX(220%)  skewX(-18deg); opacity: 0; }
        }
        .env-shine { animation: env-shine 6.5s ease-in-out infinite; }

        /* Flap opening — runs once during the completion sequence */
        .env-flap {
          transform-origin: 50% 0%;
          transition: transform 700ms cubic-bezier(.6,-0.05,.3,1.2);
        }
        .env-open .env-flap { transform: rotateX(-170deg); }
        .env-letter {
          transition: transform 800ms cubic-bezier(.2,.7,.2,1), opacity 600ms ease;
        }
        .env-open .env-letter { transform: translateY(-46%) scale(1.02); opacity: 1; }
        .env-light {
          transition: opacity 700ms ease, transform 900ms ease;
          opacity: 0;
        }
        .env-open .env-light { opacity: 1; transform: scale(1.6); }

        /* Success */
        @keyframes verify-success-ring {
          0%   { transform: scale(0.4); opacity: 0.85; }
          100% { transform: scale(2.6); opacity: 0; }
        }
        .verify-success-ring { animation: verify-success-ring 1.6s ease-out forwards; }

        @keyframes verify-check-draw {
          0%   { stroke-dashoffset: 60; }
          100% { stroke-dashoffset: 0; }
        }
        .verify-check-path {
          stroke-dasharray: 60;
          stroke-dashoffset: 60;
          animation: verify-check-draw 0.55s cubic-bezier(.65,0,.35,1) 0.2s forwards;
        }

        /* Slow drifting light rays across the page */
        @keyframes env-rays-drift {
          0%, 100% { transform: translate3d(-4%, 0, 0) rotate(0deg); opacity: .55; }
          50%      { transform: translate3d(4%, -2%, 0) rotate(6deg);  opacity: .9; }
        }
        .env-rays { animation: env-rays-drift 28s ease-in-out infinite; will-change: transform, opacity; }

        /* Breathing fog */
        @keyframes env-fog-breathe {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.85; }
        }
        .env-fog { animation: env-fog-breathe 9s ease-in-out infinite; }

        /* Perf tiers */
        .perf-low .verify-particle,
        .perf-low .verify-aurora,
        .perf-low .env-shine,
        .perf-low .env-rays,
        .perf-low .env-fog,
        .perf-low .env-pulse { animation: none !important; }
        .perf-low .env-float { animation-duration: 12s; }
        .perf-low .otp-glow  { animation: none !important; }

        .perf-medium .verify-particle:nth-child(even) { display: none; }

        @media (prefers-reduced-motion: reduce) {
          .verify-orb-1, .verify-orb-2, .verify-orb-3,
          .verify-particle, .verify-aurora, .env-rays, .env-fog,
          .env-float, .env-pulse, .env-shine, .otp-glow,
          .animate-otp-shake { animation: none !important; }
        }
      `}</style>
    </div>
  );
}


/* ─────────────── Envelope centerpiece ─────────────── */

/**
 * EnvelopeScene — full-bleed cinematic background.
 *
 * The MP4 is rendered as part of the scene itself (not a panel). A radial
 * mask removes the rectangle, screen-blend mode fuses it with the page,
 * and emerald spill gradients extend the light across the entire viewport
 * so the envelope appears to be casting onto the OTP side.
 */
function EnvelopeScene({ stage }: { stage: "idle" | "verifying" | "opening" | "complete" }) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Mouse parallax across the WHOLE page — the scene reacts as one
  useEffect(() => {
    const wrap = wrapRef.current?.parentElement; // listen on the page
    const inner = innerRef.current;
    if (!wrap || !inner) return;
    let raf = 0;
    let tx = 0, ty = 0, rx = 0, ry = 0;
    const onMove = (e: MouseEvent) => {
      const r = wrap.getBoundingClientRect();
      const cx = (e.clientX - r.left) / r.width - 0.5;
      const cy = (e.clientY - r.top) / r.height - 0.5;
      tx = cx * 18;
      ty = cy * 10;
      rx = cy * -2.5;
      ry = cx * 3.5;
      if (!raf) {
        raf = requestAnimationFrame(() => {
          inner.style.transform = `translate3d(${tx}px, ${ty}px, 0) rotateX(${rx}deg) rotateY(${ry}deg)`;
          raf = 0;
        });
      }
    };
    const onLeave = () => {
      inner.style.transform = `translate3d(0,0,0) rotateX(0) rotateY(0)`;
    };
    wrap.addEventListener("mousemove", onMove);
    wrap.addEventListener("mouseleave", onLeave);
    return () => {
      wrap.removeEventListener("mousemove", onMove);
      wrap.removeEventListener("mouseleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    v.playsInline = true;
    const p = v.play();
    if (p && typeof p.catch === "function") p.catch(() => undefined);
  }, []);

  const opened = stage === "opening" || stage === "complete";

  return (
    <div
      ref={wrapRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[1] overflow-hidden"
      style={{ perspective: "1600px" }}
    >
      {/* Massive emerald halo behind the envelope — fills the scene */}
      <div
        className="env-pulse absolute"
        style={{
          left: "calc(35% - 45vmin)",
          top: "calc(50% - 45vmin)",
          width: "90vmin",
          height: "90vmin",
          background:
            "radial-gradient(closest-side, rgba(16,185,129,0.45), rgba(16,185,129,0.10) 45%, transparent 72%)",
          filter: "blur(40px)",
          mixBlendMode: "screen",
        }}
      />

      {/* Video — anchored on the left third on desktop, top on mobile.
          Sized so its mask edge passes through the page rather than ending. */}
      <div
        ref={innerRef}
        className="env-float absolute"
        style={{
          left: "5%",
          top: "50%",
          transform: "translate(0, -50%)",
          width: "min(900px, 70vw)",
          aspectRatio: "1 / 1",
          transformStyle: "preserve-3d",
          transition: "transform 700ms cubic-bezier(.2,.7,.2,1)",
          willChange: "transform",
        }}
      >
        <video
          ref={videoRef}
          src={envelopeVideo.url}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          disablePictureInPicture
          disableRemotePlayback
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            WebkitMaskImage:
              "radial-gradient(closest-side at 50% 50%, #000 38%, rgba(0,0,0,0.55) 60%, transparent 88%)",
            maskImage:
              "radial-gradient(closest-side at 50% 50%, #000 38%, rgba(0,0,0,0.55) 60%, transparent 88%)",
            mixBlendMode: "screen",
            filter: `saturate(1.1) contrast(1.05) ${
              opened ? "brightness(1.5)" : "brightness(1.05)"
            }`,
            transition: "filter 800ms ease-out",
            backfaceVisibility: "hidden",
            willChange: "transform, filter",
          }}
        />

        {/* Light burst on success */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: "70%",
            height: "70%",
            background:
              "radial-gradient(closest-side, rgba(167,243,208,0.85), rgba(16,185,129,0.35) 35%, transparent 70%)",
            filter: "blur(28px)",
            opacity: opened ? 1 : 0,
            transform: `translate(-50%, -50%) scale(${opened ? 1.8 : 0.6})`,
            transition: "opacity 700ms ease, transform 900ms ease",
            mixBlendMode: "screen",
          }}
        />
      </div>

      {/* Volumetric light rays — reach across into the OTP side */}
      <div
        className="env-rays absolute inset-0"
        style={{
          background:
            "conic-gradient(from 200deg at 30% 50%, transparent 0deg, rgba(16,185,129,0.10) 25deg, transparent 60deg, transparent 360deg)",
          mixBlendMode: "screen",
          filter: "blur(40px)",
        }}
      />

      {/* Emerald spill cast — extends envelope light across the entire page */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 80% at 35% 50%, rgba(16,185,129,0.18) 0%, rgba(16,185,129,0.06) 35%, transparent 70%)",
          mixBlendMode: "screen",
        }}
      />

      {/* Atmospheric fog — soft veil unifying foreground and background */}
      <div
        className="env-fog absolute inset-0"
        style={{
          background:
            "radial-gradient(80% 60% at 50% 60%, rgba(8,18,16,0.0) 0%, rgba(4,6,10,0.45) 70%, rgba(4,6,10,0.85) 100%)",
        }}
      />

      {/* Bottom unifying gradient — kills any horizon line */}
      <div
        className="absolute inset-x-0 bottom-0 h-1/3"
        style={{
          background:
            "linear-gradient(to bottom, rgba(4,6,10,0) 0%, rgba(4,6,10,0.6) 100%)",
        }}
      />
    </div>
  );
}


/* ─────────────── Atmosphere ─────────────── */

function AmbientAtmosphere() {
  const particles = useMemo(
    () =>
      Array.from({ length: 18 }).map((_, i) => ({
        left: `${(i * 53) % 100}%`,
        bottom: `${(i * 37) % 80}%`,
        delay: `${(i * 0.9) % 8}s`,
        duration: `${8 + ((i * 1.3) % 7)}s`,
        vx: `${((i % 5) - 2) * 14}px`,
      })),
    [],
  );
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(140%_90%_at_50%_0%,#0a1410_0%,#04060a_55%,#020306_100%)]" />
      <div className="verify-aurora" />
      <div className="verify-orb-1 absolute -left-[20%] top-[10%] h-[55vmax] w-[55vmax] rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.22)_0%,transparent_60%)] blur-3xl" />
      <div className="verify-orb-2 absolute -right-[15%] bottom-[-10%] h-[50vmax] w-[50vmax] rounded-full bg-[radial-gradient(circle,rgba(20,184,166,0.20)_0%,transparent_60%)] blur-3xl" />
      <div className="verify-orb-3 absolute left-[40%] top-[30%] h-[35vmax] w-[35vmax] rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.10)_0%,transparent_60%)] blur-3xl" />
      <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.5)_1px,transparent_1px)] [background-size:48px_48px]" />
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

/* ─────────────── Success ─────────────── */

function SuccessState() {
  return (
    <div className="relative flex flex-col items-center text-center">
      <div className="relative grid h-28 w-28 place-items-center">
        <span className="verify-success-ring absolute inset-0 rounded-full border border-emerald-400/40" />
        <span
          className="verify-success-ring absolute inset-0 rounded-full border border-emerald-400/30"
          style={{ animationDelay: "0.15s" }}
        />
        <span className="absolute inset-0 rounded-full bg-emerald-400/20 blur-2xl" />
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
        Account secured
      </h1>
      <p className="mt-3 max-w-[340px] text-[14px] leading-[1.6] text-white/55 animate-fade-in">
        Your SymDeals account is fully protected. Preparing your dashboard…
      </p>
      <div className="mt-6 flex items-center gap-2 text-[12px] font-medium text-emerald-300/90 animate-fade-in">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Redirecting
      </div>
    </div>
  );
}
