import { Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck } from "lucide-react";

export function CtaSection() {
  return (
    <section className="relative border-t border-border py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-5 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-surface/50 p-10 backdrop-blur-md md:p-16">
          {/* Subtle radial accent */}
          <div className="pointer-events-none absolute inset-0 bg-radial-glow opacity-60" />
          <div className="pointer-events-none absolute inset-0 grid-pattern opacity-40" />

          <div className="relative flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-2.5 py-[5px] backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="text-[10.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Get started
              </span>
            </div>
            <h2 className="mt-5 max-w-2xl font-display text-[1.875rem] font-semibold leading-[1.08] tracking-[-0.03em] text-foreground md:text-[2.75rem] md:leading-[1.04]">
              Premium digital access,
              <br />
              <span className="text-gradient-emerald">delivered the moment you pay.</span>
            </h2>
            <p className="mt-5 max-w-md text-[14.5px] leading-[1.65] text-muted-foreground">
              Create a free account to view plans curated for the way you stream
              and work. No card required to browse.
            </p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
              <Link
                to="/signup"
                className="group inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-[13.5px] font-semibold tracking-[-0.005em] text-background shadow-[0_1px_0_rgba(255,255,255,0.18)_inset,0_1px_2px_rgba(0,0,0,0.45)] transition-[background-color,transform] duration-150 hover:bg-foreground/92 active:scale-[0.985]"
              >
                Create Account
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/how-it-works"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-6 py-3 text-[13.5px] font-medium tracking-[-0.005em] text-foreground backdrop-blur-md transition-[background-color,border-color] duration-150 hover:border-[var(--border-strong)] hover:bg-surface-elevated active:scale-[0.985]"
              >
                How it works
              </Link>
            </div>

            <div className="mt-7 flex items-center gap-2 text-[12px] text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              Warranty included on every order — free replacement on any issue
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
