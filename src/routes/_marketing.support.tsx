import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Headphones,
  Zap,
  ShieldCheck,
  Users,
  Clock,
  LogIn,
  UserPlus,
  ArrowRight,
} from "lucide-react";
import { Footer } from "@/components/Footer";
import { IOSSpinner } from "@/components/IOSSpinner";
import { isLoggedIn } from "@/lib/api";

export const Route = createFileRoute("/_marketing/support")({
  component: SupportPage,
  head: () => ({
    meta: [
      { title: "Support — SymDeals" },
      {
        name: "description",
        content:
          "Premium 24/7 support for SymDeals subscriptions, orders, payments and account questions.",
      },
    ],
  }),
});

const trustItems = [
  { icon: Zap, label: "Fast responses" },
  { icon: ShieldCheck, label: "Verified support team" },
  { icon: Users, label: "Real human assistance" },
  { icon: Clock, label: "Available 24/7" },
];

function SupportPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const loggedIn = isLoggedIn();
    setAuthed(loggedIn);
    setReady(true);
    if (loggedIn) {
      navigate({
        to: "/dashboard",
        search: { panel: "support" } as never,
        replace: true,
      });
    }
  }, [navigate]);

  if (!ready || authed) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center px-6 pt-32">
        <IOSSpinner size={28} />
      </main>
    );
  }

  return (
    <>
      <main className="relative overflow-hidden px-5 pt-32 pb-20 sm:px-6 md:pt-40">
        {/* Ambient atmosphere */}
        <div className="absolute inset-0 bg-radial-glow" aria-hidden />
        <div
          className="pointer-events-none absolute left-1/2 top-1/3 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-50 blur-[120px]"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklab, var(--primary) 22%, transparent), transparent 70%)",
          }}
          aria-hidden
        />

        <div className="relative mx-auto max-w-3xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-surface/50 px-2.5 py-[5px] backdrop-blur-sm">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
              </span>
              <span className="text-[10.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Support · Online now
              </span>
            </div>

            <h1 className="mt-5 font-display text-[2.25rem] font-semibold leading-[1.05] tracking-[-0.04em] text-foreground sm:text-[3.25rem] sm:leading-[1.02] md:text-[3.5rem]">
              Need help?{" "}
              <span className="text-gradient">We're here 24/7.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-[14.5px] leading-[1.65] text-muted-foreground sm:text-[15.5px]">
              Our support team is available to assist with orders,
              subscriptions, payments, and account questions.
            </p>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mt-10 grid max-w-2xl grid-cols-2 gap-2.5 md:grid-cols-4"
          >
            {trustItems.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-surface/50 px-3 py-2.5 backdrop-blur-sm transition-colors hover:border-[var(--border-strong)]"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-primary/10 text-primary">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className="text-[11.5px] font-medium text-foreground/90">
                  {label}
                </span>
              </div>
            ))}
          </motion.div>

          {/* Premium support card */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.55, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto mt-10 max-w-xl"
          >
            <div
              className="absolute -inset-6 rounded-[2rem] opacity-70 blur-2xl"
              style={{
                background:
                  "radial-gradient(circle at 50% 0%, color-mix(in oklab, var(--primary) 28%, transparent), transparent 60%)",
              }}
              aria-hidden
            />

            <div className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-surface/50 p-8 shadow-card backdrop-blur-sm md:p-10">
              {/* Sheen */}
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-px"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, color-mix(in oklab, var(--primary) 45%, transparent), transparent)",
                }}
                aria-hidden
              />

              {/* Support icon */}
              <div className="relative mx-auto flex h-14 w-14 items-center justify-center">
                <div
                  className="absolute inset-0 rounded-2xl opacity-60 blur-xl"
                  style={{ background: "color-mix(in oklab, var(--primary) 40%, transparent)" }}
                  aria-hidden
                />
                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--border)] bg-primary/10 text-primary">
                  <Headphones className="h-6 w-6" strokeWidth={1.75} />
                </div>
              </div>

              <h2 className="mt-6 text-center font-display text-[1.4rem] font-semibold tracking-[-0.025em] text-foreground md:text-[1.6rem]">
                One quick step to reach us
              </h2>
              <p className="mx-auto mt-3 max-w-md text-center text-[13.5px] leading-[1.7] text-muted-foreground md:text-[14px]">
                Create a free account or log in to contact our support team and
                track your requests.
              </p>

              <div className="mt-7 flex flex-col gap-2.5 sm:flex-row sm:gap-3">
                <Link
                  to="/signup"
                  className="group inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-foreground px-5 py-3 text-[12.5px] font-semibold tracking-[-0.005em] text-background shadow-[0_1px_0_rgba(255,255,255,0.18)_inset,0_10px_28px_-12px_color-mix(in_oklab,var(--foreground)_55%,transparent)] transition-transform active:scale-[0.985]"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Create free account
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-surface/60 px-5 py-3 text-[12.5px] font-semibold tracking-[-0.005em] text-foreground shadow-[0_1px_0_rgba(255,255,255,0.04)_inset] transition-colors hover:border-[var(--border-strong)] hover:bg-surface active:scale-[0.985]"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  Log in
                </Link>
              </div>

              <p className="mt-5 text-center text-[11px] text-muted-foreground/80">
                Free forever · No card required · Takes 20 seconds
              </p>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </>
  );
}
