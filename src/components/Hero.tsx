import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Zap, ShieldCheck, Lock, Check } from "lucide-react";
import { isLoggedIn } from "@/lib/api";
import {
  NetflixMark,
  PrimeMark,
  YouTubePremiumMark,
  DisneyHotstarMark,
  SpotifyMark,
  SonyLivMark,
  Zee5Mark,
  AppleTvMark,
  MxPlayerMark,
  CrunchyrollMark,
  JioCinemaMark,
} from "./OttLogos";

export function Hero() {
  const [authed, setAuthed] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const sync = () => setAuthed(isLoggedIn());
    sync();
    setAuthReady(true);
    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key.startsWith("symdeals.")) sync();
    };
    const onFocus = () => sync();
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const browseTo = authed ? "/dashboard" : "/signup";
  const secondaryTo = authed ? "/dashboard" : "/login";
  const secondaryLabel = authed ? "Dashboard" : "My Orders";

  return (
    <section className="relative overflow-hidden pt-28 pb-16 sm:pt-36 sm:pb-24 md:pt-44 md:pb-32">
      {/* Background atmosphere is rendered globally by AmbientBackground in the
          marketing layout, so the hero stays transparent and blends seamlessly
          into the rest of the page. */}


      <div className="relative mx-auto max-w-6xl px-5 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          {/* Status pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1 backdrop-blur animate-fade-up">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
            </span>
            <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground sm:text-[10.5px]">
              Instant Automated Delivery
            </span>
          </div>

          {/* Headline */}
          <h1
            className="mt-6 font-display text-[2rem] font-semibold leading-[1.08] tracking-[-0.03em] text-foreground sm:mt-7 sm:text-5xl sm:leading-[1.05] sm:tracking-[-0.035em] md:text-6xl lg:text-[4.25rem] animate-fade-up"
            style={{ animationDelay: "0.05s" }}
          >
            <span className="text-gradient">Premium Digital Access.</span>
            <br />
            Instantly Delivered.
          </h1>

          {/* Subhead */}
          <p
            className="mx-auto mt-5 max-w-[22rem] text-[14px] leading-[1.6] text-muted-foreground sm:mt-6 sm:max-w-xl sm:text-[15px] sm:leading-[1.65] md:text-[16px] animate-fade-up"
            style={{ animationDelay: "0.1s" }}
          >
            Subscriptions, software, and premium services with instant
            automated delivery — all in one trusted marketplace.
          </p>

          {/* CTAs */}
          <div
            className={`mt-8 flex w-full flex-col items-stretch justify-center gap-2.5 sm:mt-9 sm:w-auto sm:flex-row sm:items-center sm:gap-3 animate-fade-up transition-opacity duration-300 ${
              authReady ? "opacity-100" : "opacity-0"
            }`}
            style={{ animationDelay: "0.15s" }}
          >
            <Link
              to={browseTo}
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-6 py-3.5 text-[14px] font-semibold tracking-tight text-background transition-all hover:bg-foreground/90 active:scale-[0.98] sm:py-3 sm:text-[13.5px]"
            >
              Browse Services
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              to={secondaryTo}
              className="group inline-flex items-center justify-center gap-2 rounded-full border border-border bg-surface/60 px-6 py-3.5 text-[14px] font-medium tracking-tight text-foreground backdrop-blur transition-all hover:border-muted-foreground/40 hover:bg-surface-elevated active:scale-[0.98] sm:py-3 sm:text-[13.5px]"
            >
              {secondaryLabel}
              {authed && (
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              )}
            </Link>
          </div>

          {/* Trust micro */}
          <div
            className="mx-auto mt-10 grid max-w-md grid-cols-3 items-center justify-items-center gap-x-4 gap-y-3 sm:mt-12 sm:flex sm:max-w-2xl sm:flex-wrap sm:justify-center sm:gap-x-8 animate-fade-up"
            style={{ animationDelay: "0.25s" }}
          >
            <TrustItem icon={Zap} label="Instant" />
            <TrustItem icon={ShieldCheck} label="Warranty" />
            <TrustItem icon={Lock} label="Encrypted" />
          </div>
        </div>

        {/* Live catalog panel */}
        <div
          className="relative mx-auto mt-14 max-w-4xl animate-fade-up sm:mt-20"
          style={{ animationDelay: "0.3s" }}
        >
          <div className="pointer-events-none absolute -inset-8 rounded-[28px] bg-primary/5 blur-3xl" />
          <OttPanel />
        </div>
      </div>
    </section>
  );
}

function TrustItem({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-[12px] font-medium text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

function OttPanel() {
  const platforms = [
    { name: "Netflix", Logo: NetflixMark, plan: "Premium · UHD", savings: "65%" },
    { name: "Prime Video", Logo: PrimeMark, plan: "Premium · UHD", savings: "70%" },
    { name: "YouTube Premium", Logo: YouTubePremiumMark, plan: "Ad-free · Music", savings: "55%" },
    { name: "Disney+ Hotstar", Logo: DisneyHotstarMark, plan: "Super · 4K", savings: "60%" },
    { name: "Spotify", Logo: SpotifyMark, plan: "Family", savings: "62%" },
    { name: "SonyLIV", Logo: SonyLivMark, plan: "Premium · Yearly", savings: "58%" },
    { name: "Zee5", Logo: Zee5Mark, plan: "Premium · UHD", savings: "50%" },
    { name: "Apple TV+", Logo: AppleTvMark, plan: "Standard · 4K", savings: "45%" },
    { name: "MX Player", Logo: MxPlayerMark, plan: "Gold · Ad-free", savings: "40%" },
    { name: "Crunchyroll", Logo: CrunchyrollMark, plan: "Mega Fan", savings: "52%" },
    { name: "JioCinema", Logo: JioCinemaMark, plan: "Premium · UHD", savings: "48%" },
  ];
  const loop = [...platforms, ...platforms];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-surface/80 backdrop-blur shadow-elevated">
      <div className="flex items-center justify-between border-b border-border bg-surface-elevated/60 px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-1.5 w-1.5 rounded-full bg-primary" />
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Active Catalog
          </span>
        </div>
        <span className="font-mono text-[10.5px] text-muted-foreground/70">
          {platforms.length}+ services · Live
        </span>
      </div>

      <div className="marquee-pause relative h-[300px] overflow-hidden mask-fade-y sm:h-[320px]">
        <div className="animate-marquee-y flex flex-col">
          {loop.map((p, i) => (
            <div
              key={`${p.name}-${i}`}
              className="flex items-center justify-between border-b border-border/60 px-4 py-3 transition-colors hover:bg-surface-elevated/40 sm:px-5 sm:py-3.5"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg sm:h-9 sm:w-9">
                  <p.Logo className="h-full w-full" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[13.5px] font-semibold text-foreground sm:text-[13px]">
                    {p.name}
                  </div>
                  <div className="truncate text-[11px] text-muted-foreground">
                    {p.plan}
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2 pl-2">
                <div className="text-right">
                  <div className="font-mono text-[12.5px] font-semibold text-primary">
                    -{p.savings}
                  </div>
                  <div className="text-[9.5px] uppercase tracking-wider text-muted-foreground">
                    Saved
                  </div>
                </div>
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15">
                  <Check className="h-3 w-3 text-primary" strokeWidth={3} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border bg-surface-elevated/60 px-5 py-3">
        <span className="text-[11px] text-muted-foreground">
          All services verified
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="flex h-1.5 w-1.5 animate-pulse-soft rounded-full bg-primary" />
          <span className="text-[11px] font-semibold text-primary">Live</span>
        </span>
      </div>
    </div>
  );
}
