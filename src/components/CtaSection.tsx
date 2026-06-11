import { Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck } from "lucide-react";

export function CtaSection() {
  return (
    <section className="relative border-t border-border py-24 md:py-32">
      <div className="mx-auto max-w-5xl px-6">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-surface/60 p-10 md:p-16">
          {/* Mesh accent */}
          <div className="pointer-events-none absolute inset-0 mesh-bg opacity-70" />
          <div className="pointer-events-none absolute inset-0 grid-pattern opacity-50" />

          <div className="relative flex flex-col items-center text-center">
            <div className="label-uppercase">Get Started</div>
            <h2 className="mt-4 max-w-2xl font-display text-3xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground md:text-[2.75rem]">
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
                className="group inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-[13.5px] font-semibold tracking-tight text-background transition-all hover:bg-foreground/90"
              >
                Create Account
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/how-it-works"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-6 py-3 text-[13.5px] font-medium tracking-tight text-foreground backdrop-blur transition-all hover:border-muted-foreground/40 hover:bg-surface-elevated"
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
