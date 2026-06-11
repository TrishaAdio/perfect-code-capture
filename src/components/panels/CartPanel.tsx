import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Loader2, ShoppingBag, ShoppingCart, Minus, Plus, Trash2, ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useCart } from "@/lib/cart";
import { ServiceLogo } from "@/components/ServiceLogo";

function formatDuration(m: number) {
  if (!m) return "";
  if (m % 12 === 0) {
    const y = m / 12;
    return `${y} ${y === 1 ? "Year" : "Years"}`;
  }
  return `${m} ${m === 1 ? "Month" : "Months"}`;
}

export function CartPanel({ onBrowse }: { onBrowse?: () => void }) {
  const { items, totalItems, totalPrice, totalSaved, remove, setQty, clear } = useCart();
  const navigate = useNavigate();
  const [checkingOut, setCheckingOut] = useState(false);

  const handleCheckoutAll = () => {
    if (checkingOut) return;
    if (items.length === 0) return;
    setCheckingOut(true);
    const first = items[0];
    try {
      sessionStorage.setItem(
        "symdeals.checkout",
        JSON.stringify({
          productId: first.productId,
          months: first.months,
          quantity: first.quantity,
        })
      );
    } catch {
      /* ignore */
    }
    if (items.length > 1) {
      toast("Processing first item", {
        description: "Please complete remaining items one at a time.",
      });
    }
    // Navigate on next tick so the disabled state paints first (prevents
    // double-tap on Android where the second tap can fire before nav).
    setTimeout(() => {
      try {
        navigate({ to: "/checkout" });
      } catch {
        setCheckingOut(false);
        toast.error("Couldn't open checkout. Please try again.");
      }
    }, 50);
    // Safety release in case navigation is blocked (back-button, etc.)
    setTimeout(() => setCheckingOut(false), 4000);
  };

  return (
    <div className="mx-auto max-w-3xl pb-32">
      {/* Header */}
      <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-surface/50 px-2.5 py-[5px] backdrop-blur-sm">
        <ShoppingCart className="h-3 w-3 text-primary" />
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Cart
        </span>
      </div>
      <h1 className="mt-4 font-display text-[1.85rem] font-semibold leading-[1.05] tracking-[-0.03em] text-foreground sm:text-[2rem]">
        Your cart
      </h1>
      <p className="mt-1.5 text-[13.5px] text-muted-foreground">
        {items.length === 0
          ? "Add subscriptions to start a checkout."
          : `${totalItems} item${totalItems === 1 ? "" : "s"} ready to checkout.`}
      </p>

      {items.length === 0 ? (
        <EmptyCart onBrowse={onBrowse} />
      ) : (
        <>
          {/* Items list */}
          <ul className="mt-6 space-y-3">
            <AnimatePresence initial={false}>
              {items.map((it) => {
                const showOld =
                  (it.realPrice ?? 0) > it.price ? it.realPrice! : null;
                return (
                  <motion.li
                    key={`${it.productId}::${it.months}`}
                    layout
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 30, scale: 0.96 }}
                    transition={{ type: "spring", stiffness: 360, damping: 28 }}
                    className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-surface/55 p-3.5 backdrop-blur-xl sm:p-4"
                  >
                    <div className="flex items-start gap-3">
                      {/* Logo */}
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-[var(--border)] bg-gradient-to-br from-white/[0.05] to-transparent">
                        <ServiceLogo
                          src={it.image}
                          name={it.name}
                          className="h-full w-full object-cover"
                          iconClass="h-6 w-6"
                        />
                      </div>

                      {/* Details */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="truncate font-display text-[14.5px] font-semibold tracking-tight text-foreground">
                              {it.name}
                            </h3>
                            <div className="mt-0.5 text-[11.5px] text-muted-foreground">
                              {formatDuration(it.months)}
                              {it.category ? ` · ${it.category}` : ""}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              remove(it.productId, it.months);
                              toast("Removed from cart");
                            }}
                            aria-label="Remove"
                            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-foreground"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Bottom row: qty + price */}
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <div className="inline-flex items-center rounded-full border border-[var(--border)] bg-background/60">
                            <button
                              type="button"
                              aria-label="Decrease"
                              onClick={() =>
                                setQty(it.productId, it.months, it.quantity - 1)
                              }
                              className="flex h-7 w-7 items-center justify-center rounded-l-full text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-foreground active:scale-95"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="min-w-[1.5rem] text-center text-[12.5px] font-semibold tabular-nums text-foreground">
                              {it.quantity}
                            </span>
                            <button
                              type="button"
                              aria-label="Increase"
                              onClick={() =>
                                setQty(it.productId, it.months, it.quantity + 1)
                              }
                              className="flex h-7 w-7 items-center justify-center rounded-r-full text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-foreground active:scale-95"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>

                          <div className="flex items-baseline gap-1.5">
                            {showOld && (
                              <span className="text-[11px] font-medium text-muted-foreground/55 line-through tabular-nums">
                                ₹{(showOld * it.quantity).toLocaleString()}
                              </span>
                            )}
                            <span className="font-display text-[15.5px] font-semibold tracking-tight text-foreground tabular-nums">
                              ₹{(it.price * it.quantity).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>

          {/* Summary */}
          <div className="mt-5 rounded-2xl border border-[var(--border)] bg-surface/50 p-4 backdrop-blur-xl">
            <SummaryRow label="Items" value={`${totalItems}`} />
            {totalSaved > 0 && (
              <SummaryRow
                label="You save"
                value={`₹${totalSaved.toLocaleString()}`}
                accent
              />
            )}
            <div className="mt-3 flex items-baseline justify-between border-t border-[var(--border)] pt-3">
              <span className="text-[12px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Total
              </span>
              <span className="font-display text-[22px] font-semibold tracking-tight text-foreground tabular-nums">
                ₹{totalPrice.toLocaleString()}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                clear();
                toast("Cart cleared");
              }}
              className="mt-3 text-[11.5px] font-medium text-muted-foreground hover:text-foreground"
            >
              Clear cart
            </button>
          </div>

          {/* Sticky Checkout All */}
          <div
            className="fixed inset-x-3 z-30 lg:static lg:mt-6 lg:inset-auto"
            style={{
              bottom: "calc(env(safe-area-inset-bottom, 0px) + 84px)",
            }}
          >
            <motion.button
              type="button"
              onClick={handleCheckoutAll}
              disabled={checkingOut}
              aria-busy={checkingOut}
              whileTap={checkingOut ? undefined : { scale: 0.985 }}
              transition={{ type: "spring", stiffness: 460, damping: 24 }}
              className="relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-foreground text-[13.5px] font-semibold tracking-[-0.005em] text-background shadow-[0_1px_0_rgba(255,255,255,0.18)_inset,0_10px_28px_-12px_color-mix(in_oklab,var(--primary)_55%,transparent)] disabled:opacity-80 lg:h-11"
              style={{ willChange: "transform", touchAction: "manipulation" }}
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_120%_at_50%_0%,color-mix(in_oklab,var(--primary)_20%,transparent),transparent_60%)]"
              />
              {checkingOut ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Opening checkout…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Checkout all · ₹{totalPrice.toLocaleString()}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </motion.button>
          </div>
        </>
      )}
    </div>
  );
}

function SummaryRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between py-1">
      <span className="text-[12.5px] text-muted-foreground">{label}</span>
      <span
        className={`text-[13px] font-semibold tabular-nums ${
          accent ? "text-primary" : "text-foreground"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function EmptyCart({ onBrowse }: { onBrowse?: () => void }) {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="mt-10 flex flex-col items-center justify-center rounded-3xl border border-dashed border-[var(--border)] bg-surface/40 px-6 py-14 text-center backdrop-blur"
    >
      <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--border)] bg-background/60">
        <span
          aria-hidden
          className="absolute inset-0 rounded-2xl bg-[radial-gradient(80%_80%_at_50%_50%,rgba(52,211,153,0.18),transparent_70%)]"
        />
        <ShoppingBag className="relative h-7 w-7 text-emerald-300/90" />
      </div>
      <h3 className="mt-5 font-display text-[17px] font-semibold tracking-tight text-foreground">
        Your cart is empty
      </h3>
      <p className="mt-1.5 max-w-xs text-[13px] text-muted-foreground">
        Add subscriptions to checkout securely in one tap.
      </p>
      <button
        type="button"
        onClick={() => (onBrowse ? onBrowse() : navigate({ to: "/dashboard" }))}
        className="mt-6 inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-foreground px-5 text-[13px] font-semibold tracking-tight text-background shadow-[0_10px_28px_-12px_color-mix(in_oklab,var(--foreground)_55%,transparent)] transition-transform active:scale-[0.97]"
      >
        Browse Products
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  );
}
