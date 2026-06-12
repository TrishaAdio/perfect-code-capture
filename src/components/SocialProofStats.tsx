import { useEffect, useRef, useState } from "react";
import { Package, PiggyBank, Star, Zap } from "lucide-react";

type Stat = {
  Icon: React.ComponentType<{ className?: string }>;
  value: number;
  format: (n: number) => string;
  label: string;
  sub: string;
};

const STATS: Stat[] = [
  {
    Icon: Package,
    value: 12480,
    format: (n) => `${n.toLocaleString()}+`,
    label: "Orders delivered",
    sub: "Across 11+ services",
  },
  {
    Icon: PiggyBank,
    value: 2.3,
    format: (n) => `₹${n.toFixed(1)} Cr`,
    label: "Saved by members",
    sub: "vs official pricing",
  },
  {
    Icon: Star,
    value: 4.8,
    format: (n) => n.toFixed(1) + "★",
    label: "Average rating",
    sub: "From verified buyers",
  },
  {
    Icon: Zap,
    value: 99.2,
    format: (n) => `${n.toFixed(1)}%`,
    label: "On-time delivery",
    sub: "Under 5 minutes",
  },
];

export function SocialProofStats() {
  return (
    <section
      aria-label="Trusted by thousands"
      className="relative mx-auto max-w-6xl px-5 sm:px-6"
    >
      <div className="rounded-2xl border border-border bg-surface/60 backdrop-blur-md sm:rounded-[20px]">
        <div className="grid grid-cols-2 divide-border sm:grid-cols-4 sm:divide-x">
          {STATS.map((s, i) => (
            <StatCell key={s.label} stat={s} delay={i * 80} />
          ))}
        </div>
      </div>
    </section>
  );
}

function StatCell({ stat, delay }: { stat: Stat; delay: number }) {
  const { Icon, value, format, label, sub } = stat;
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const ran = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setDisplay(value);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || ran.current) continue;
          ran.current = true;
          const duration = 1100;
          const start = performance.now() + delay;
          let raf = 0;
          const tick = (now: number) => {
            const t = Math.max(0, Math.min(1, (now - start) / duration));
            // ease-out cubic
            const eased = 1 - Math.pow(1 - t, 3);
            setDisplay(value * eased);
            if (t < 1) raf = requestAnimationFrame(tick);
          };
          raf = requestAnimationFrame(tick);
          io.disconnect();
          return () => cancelAnimationFrame(raf);
        }
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value, delay]);

  return (
    <div
      ref={ref}
      className="group flex items-start gap-3 p-4 sm:p-5 [&:nth-child(-n+2)]:border-b sm:[&:nth-child(-n+2)]:border-b-0"
      style={{ borderColor: "var(--border)" }}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background/60 transition-colors group-hover:border-[var(--border-strong)]">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="min-w-0">
        <div className="font-display text-[20px] font-semibold tabular-nums tracking-[-0.02em] text-foreground sm:text-[22px]">
          {format(display)}
        </div>
        <div className="mt-0.5 text-[11.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </div>
        <div className="mt-0.5 truncate text-[11px] text-muted-foreground/70">
          {sub}
        </div>
      </div>
    </div>
  );
}
