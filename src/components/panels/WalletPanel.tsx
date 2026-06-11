import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { TrendingDown, Wallet as WalletIcon, ShoppingBag, ArrowRight } from "lucide-react";
import { type AuthUser } from "@/lib/api";

function useCountUp(value: number, duration = 900) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (typeof window === "undefined" || !Number.isFinite(value)) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || value === 0) {
      setN(value);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(value * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return n;
}

export function WalletPanel({
  user,
  loading,
  onViewOrders,
}: {
  user: AuthUser | null;
  loading: boolean;
  onViewOrders?: () => void;
}) {
  const totalSaved = user?.totalSaved ?? 0;
  const display = useCountUp(totalSaved);
  return (
    <div className="mx-auto max-w-3xl">
      <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1">
        <WalletIcon className="h-3 w-3 text-primary" />
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Wallet
        </span>
      </div>
      <h1 className="mt-5 font-display text-[2rem] font-semibold tracking-[-0.025em] text-foreground">
        Your Wallet
      </h1>
      <p className="mt-2 text-[14px] text-muted-foreground">
        A snapshot of your savings and account activity.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-2xl border border-border bg-surface/60 p-5 backdrop-blur"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--primary)_22%,transparent),transparent_70%)] opacity-60 blur-2xl"
          />
          <div className="relative flex items-center justify-between">
            <span className="text-[10.5px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Total Saved
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
              <TrendingDown className="h-3.5 w-3.5 text-primary" />
            </div>
          </div>
          <div className="relative mt-4 flex items-baseline gap-2">
            <span className="font-display text-[1.85rem] font-semibold tracking-tight text-foreground tabular-nums">
              {loading ? (
                <span className="text-muted-foreground/40">—</span>
              ) : (
                <>₹{display.toLocaleString("en-IN")}</>
              )}
            </span>
            <span className="text-[11.5px] font-medium text-muted-foreground">
              across all orders
            </span>
          </div>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
          onClick={onViewOrders}
          className="group relative overflow-hidden rounded-2xl border border-border bg-surface/60 p-5 text-left backdrop-blur transition-colors hover:border-muted-foreground/25"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Orders
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background/60">
              <ShoppingBag className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2.5">
            <span className="font-display text-[1.4rem] font-semibold tracking-tight text-foreground">
              View all orders
            </span>
            <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </div>
        </motion.button>
      </div>
    </div>
  );
}
