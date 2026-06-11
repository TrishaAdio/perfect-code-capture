import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  CheckCircle2,
  Info,
  KeyRound,
  Link2,
  Lock,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import symdealsLogo from "@/assets/symdeals-logo.png";
import {
  type AuthUser,
  type Product,
  clearSession,
  fetchMe,
  fetchProduct,
  getToken,
} from "@/lib/api";
import { LogoutConfirmDialog } from "@/components/LogoutConfirmDialog";

export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
  head: () => ({
    meta: [
      { title: "Checkout — SymDeals" },
      {
        name: "description",
        content:
          "Securely complete your SymDeals order. Pay via UPI and receive instant access.",
      },
    ],
  }),
});

type CheckoutState = {
  productId?: string;
  months?: number;
  quantity?: number;
};

function readCheckoutState(): CheckoutState {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem("symdeals.checkout");
    if (!raw) return {};
    return JSON.parse(raw) as CheckoutState;
  } catch {
    return {};
  }
}

function CheckoutPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [months, setMonths] = useState<number | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [whatsapp, setWhatsapp] = useState("+91");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      navigate({ to: "/login" });
      return;
    }
    const state = readCheckoutState();
    if (!state.productId) {
      navigate({ to: "/dashboard" });
      return;
    }
    let cancelled = false;
    setLoading(true);
    Promise.all([fetchMe(), fetchProduct(state.productId)])
      .then(([me, p]) => {
        if (cancelled) return;
        setUser(me.user);
        if (me.user.email) setEmail(me.user.email);
        setProduct(p.product);
        const sorted = [...p.product.plans].sort((a, b) => a.months - b.months);
        const chosen =
          sorted.find((pl) => pl.months === state.months) ?? sorted[0] ?? null;
        setMonths(chosen?.months ?? null);
        setQuantity(Math.max(1, Number(state.quantity) || 1));
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load checkout");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const plan = useMemo(
    () => product?.plans.find((p) => p.months === months) ?? null,
    [product, months]
  );
  const subtotal = plan ? plan.price * quantity : 0;
  const total = subtotal;

  const phoneValid = /^\+?\d{10,15}$/.test(whatsapp.trim());
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const onLogout = () => setLogoutOpen(true);
  const confirmLogout = () => {
    setLogoutOpen(false);
    clearSession();
    navigate({ to: "/login" });
  };

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !plan) return;
    if (!phoneValid) {
      toast.error("Enter a valid WhatsApp number");
      return;
    }
    if (!emailValid) {
      toast.error("Enter a valid email address");
      return;
    }
    setSubmitting(true);
    try {
      const realPriceTotal =
        plan.realPrice && plan.realPrice > plan.price
          ? plan.realPrice * quantity
          : 0;
      sessionStorage.setItem(
        "symdeals.checkout",
        JSON.stringify({
          productId: product.id,
          months: plan.months,
          quantity,
          amount: total,
          realPrice: realPriceTotal,
          productName: `${product.name} ${plan.months} month${plan.months > 1 ? "s" : ""}`,
          productImage: product.image,
          whatsapp,
          email,
        })
      );
    } catch {
      /* ignore */
    }
    // Brief loading → success → navigate (premium feel)
    window.setTimeout(() => {
      setSuccess(true);
      window.setTimeout(() => {
        navigate({ to: "/pay" });
      }, 520);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/70 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link to="/dashboard" aria-label="SymDeals home" className="group flex items-center">
            <img
              src={symdealsLogo}
              alt="SymDeals"
              className="h-5 w-auto object-contain transition-all duration-300 ease-out group-hover:scale-[1.03] sm:h-6"
              style={{ filter: "drop-shadow(0 0 6px rgba(0, 255, 170, 0.2))" }}
            />
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-400/[0.06] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-300 sm:inline-flex">
              <ShieldCheck className="h-3 w-3" />
              Secure checkout
            </span>
            {user && (
              <span className="hidden text-xs text-muted-foreground md:inline">
                {user.email}
              </span>
            )}
            <button
              onClick={onLogout}
              className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground/80 transition hover:bg-white/5"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-32 pt-8 sm:px-6 lg:pb-24">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Continue shopping
        </Link>

        <div className="mt-6">
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Checkout
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Review your order and complete the secure UPI payment.
          </p>
        </div>

        {loading ? (
          <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_420px]">
            <div className="h-[420px] animate-pulse rounded-2xl border border-border bg-white/[0.02]" />
            <div className="h-[420px] animate-pulse rounded-2xl border border-border bg-white/[0.02]" />
          </div>
        ) : error ? (
          <div className="mt-10 rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
            {error}
          </div>
        ) : (
          <form
            onSubmit={handlePlaceOrder}
            className="mt-8 grid gap-8 lg:grid-cols-[1fr_420px]"
          >
            {/* LEFT COLUMN */}
            <div className="order-2 space-y-6 lg:order-1">
              {/* Billing Details */}
              <motion.section
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="group/card relative overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-white/[0.035] to-white/[0.015] p-6 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_20px_40px_-24px_rgba(0,0,0,0.6)] sm:p-7"
              >
                <div className="pointer-events-none absolute -top-24 right-0 h-48 w-48 rounded-full bg-emerald-400/[0.06] blur-3xl" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">
                      Billing details
                    </h2>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    <Lock className="h-3 w-3" /> Encrypted
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  We'll send your access link to these contacts.
                </p>

                <div className="mt-6 space-y-5">
                  <FloatingInput
                    id="whatsapp"
                    type="tel"
                    label="WhatsApp number"
                    placeholder="+91 90000 00000"
                    value={whatsapp}
                    onChange={setWhatsapp}
                    valid={whatsapp.length > 3 ? phoneValid : null}
                    helper="We'll deliver your access link on WhatsApp."
                  />
                  <FloatingInput
                    id="email"
                    type="email"
                    label="Email address"
                    placeholder="you@example.com"
                    value={email}
                    onChange={setEmail}
                    valid={email.length > 0 ? emailValid : null}
                    helper="A backup copy of credentials goes here."
                  />
                </div>
              </motion.section>

              {/* How it works — connected step progress */}
              <motion.section
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-2xl border border-border bg-gradient-to-b from-white/[0.03] to-white/[0.01] p-6 sm:p-7"
              >
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-emerald-400" />
                  <h2 className="label-uppercase text-[11px] text-muted-foreground">
                    How it works
                  </h2>
                </div>

                <div className="relative mt-5">
                  <div className="space-y-3">
                    <Step
                      n={1}
                      icon={<ShoppingBag className="h-4 w-4" />}
                      title="Place order"
                      text="Browse the catalog and complete your secure payment."
                    />
                    <Step
                      n={2}
                      icon={<Link2 className="h-4 w-4" />}
                      title="Get access link"
                      text="After payment, you will receive an access link on WhatsApp & email."
                    />
                    <Step
                      n={3}
                      icon={<KeyRound className="h-4 w-4" />}
                      title="Login credentials"
                      text="Click the link to instantly retrieve your account login details."
                    />
                  </div>
                </div>
              </motion.section>

              {/* Trust strip */}
              <motion.section
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="grid grid-cols-3 gap-3"
              >
                <TrustPill icon={<ShieldCheck className="h-3.5 w-3.5" />} label="256-bit Secure" />
                <TrustPill icon={<BadgeCheck className="h-3.5 w-3.5" />} label="Verified Seller" />
                <TrustPill icon={<Sparkles className="h-3.5 w-3.5" />} label="Instant Delivery" />
              </motion.section>

              {/* Important Notice */}
              <motion.section
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.04] p-6 sm:p-7"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-400/30 bg-emerald-400/10 text-emerald-400">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="label-uppercase text-[11px] text-emerald-400">
                      Important notice
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-foreground/85">
                      After completing your payment, you will receive an access
                      link.{" "}
                      <span className="text-foreground">
                        Click the link to instantly retrieve your account
                        credentials and log in.
                      </span>
                    </p>
                  </div>
                </div>
              </motion.section>
            </div>

            {/* RIGHT COLUMN — sticky on desktop */}
            <aside className="order-1 lg:order-2">
              <div className="lg:sticky lg:top-6 lg:self-start">
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-white/[0.04] to-white/[0.015] shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset,0_30px_60px_-30px_rgba(0,0,0,0.7)]"
                >
                  {/* ambient glow */}
                  <div className="pointer-events-none absolute -top-24 -right-16 h-56 w-56 rounded-full bg-emerald-400/[0.08] blur-3xl" />
                  <div className="pointer-events-none absolute -bottom-32 -left-16 h-56 w-56 rounded-full bg-emerald-400/[0.04] blur-3xl" />

                  <div className="relative border-b border-border/80 px-6 pb-4 pt-5">
                    <div className="flex items-center justify-between">
                      <h2 className="label-uppercase text-[11px] text-muted-foreground">
                        Order summary
                      </h2>
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/25 bg-emerald-400/[0.08] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                        <ShieldCheck className="h-3 w-3" />
                        Verified
                      </span>
                    </div>
                  </div>

                  <div className="relative space-y-5 px-6 py-5">
                    {product && plan && (
                      <div className="flex items-center gap-4">
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-border bg-background ring-1 ring-emerald-400/10">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display =
                                "none";
                            }}
                          />
                          <div className="pointer-events-none absolute inset-0 rounded-xl shadow-[inset_0_0_24px_rgba(16,185,129,0.12)]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {product.name}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {plan.months} month{plan.months > 1 ? "s" : ""} ·
                            qty {quantity}
                          </p>
                        </div>
                        <span className="text-sm font-medium text-foreground">
                          ₹{(plan.price * quantity).toLocaleString()}
                        </span>
                      </div>
                    )}

                    <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

                    <div className="space-y-2">
                      <Row label="Subtotal" value={`₹${subtotal.toLocaleString()}`} />
                      <Row label="Quantity" value={String(quantity)} muted />
                      <Row label="Delivery" value="Instant · WhatsApp" muted />
                    </div>

                    <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

                    <div className="flex items-end justify-between">
                      <div>
                        <span className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                          Total payable
                        </span>
                        <span className="mt-0.5 block text-[10px] text-muted-foreground/70">
                          Inclusive of all taxes
                        </span>
                      </div>
                      <span
                        className="font-display text-2xl font-bold tracking-tight text-emerald-400 sm:text-3xl"
                        style={{ textShadow: "0 0 24px rgba(16,185,129,0.35)" }}
                      >
                        ₹{total.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Payment */}
                  <div className="relative border-t border-border/80 px-6 py-5">
                    <h3 className="label-uppercase text-[11px] text-muted-foreground">
                      Payment method
                    </h3>
                    <div className="group/upi mt-3 flex items-center justify-between rounded-xl border border-emerald-400/30 bg-gradient-to-br from-emerald-400/[0.07] to-emerald-400/[0.02] px-4 py-3 ring-1 ring-emerald-400/10 transition hover:border-emerald-400/50">
                      <div className="flex items-center gap-3">
                        <div className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-400/30 bg-emerald-400/10 text-emerald-300">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="absolute inset-0 rounded-lg ring-1 ring-emerald-400/40 ring-offset-0" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            Pay via UPI
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            GPay · PhonePe · Paytm · BHIM
                          </p>
                        </div>
                      </div>
                      <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                        Recommended
                      </span>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="relative border-t border-border/80 bg-white/[0.02] px-6 py-5">
                    <PlaceOrderButton
                      submitting={submitting}
                      success={success}
                      disabled={!plan}
                    />
                    <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
                      <Lock className="h-3 w-3 text-emerald-400/80" />
                      256-bit secure · Encrypted end-to-end
                    </p>
                  </div>
                </motion.div>
              </div>
            </aside>

            {/* MOBILE STICKY CTA */}
            <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/85 px-4 py-3 backdrop-blur-xl lg:hidden">
              <div className="mx-auto flex max-w-7xl items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Total
                  </p>
                  <p
                    className="font-display text-lg font-bold leading-none text-emerald-400"
                    style={{ textShadow: "0 0 16px rgba(16,185,129,0.35)" }}
                  >
                    ₹{total.toLocaleString()}
                  </p>
                </div>
                <div className="flex-1">
                  <PlaceOrderButton
                    submitting={submitting}
                    success={success}
                    disabled={!plan}
                    compact
                  />
                </div>
              </div>
            </div>
          </form>
        )}
      </main>

      <LogoutConfirmDialog
        open={logoutOpen}
        onCancel={() => setLogoutOpen(false)}
        onConfirm={confirmLogout}
      />
    </div>
  );
}

function PlaceOrderButton({
  submitting,
  success,
  disabled,
  compact,
}: {
  submitting: boolean;
  success: boolean;
  disabled?: boolean;
  compact?: boolean;
}) {
  const isBusy = submitting || success;
  return (
    <motion.button
      type="submit"
      disabled={disabled || isBusy}
      whileHover={!isBusy && !disabled ? { y: -1 } : undefined}
      whileTap={!isBusy && !disabled ? { scale: 0.97 } : undefined}
      transition={{ type: "spring", stiffness: 380, damping: 22 }}
      className={`group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl px-5 ${
        compact ? "py-3 text-sm" : "py-3.5 text-sm"
      } font-semibold text-emerald-950 shadow-[0_10px_30px_-10px_rgba(16,185,129,0.55)] transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60 ${
        success
          ? "bg-emerald-400"
          : "bg-gradient-to-b from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 hover:shadow-[0_14px_40px_-10px_rgba(16,185,129,0.75)]"
      }`}
    >
      {/* shine sweep on hover */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
      />
      <AnimatePresence mode="wait" initial={false}>
        {success ? (
          <motion.span
            key="success"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 18 }}
            className="relative flex items-center gap-2"
          >
            <Check className="h-4 w-4" strokeWidth={3} />
            Confirmed
          </motion.span>
        ) : submitting ? (
          <motion.span
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative flex items-center gap-2"
          >
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-emerald-950/30 border-t-emerald-950" />
            Placing order…
          </motion.span>
        ) : (
          <motion.span
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative flex items-center gap-2"
          >
            <Lock className="h-4 w-4" />
            Place order
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

function FloatingInput({
  id,
  type,
  label,
  placeholder,
  value,
  onChange,
  valid,
  helper,
}: {
  id: string;
  type: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  valid: boolean | null;
  helper?: string;
}) {
  const [focused, setFocused] = useState(false);
  const showInvalid = valid === false;
  const showValid = valid === true;
  return (
    <div>
      <label
        htmlFor={id}
        className="label-uppercase text-[11px] text-muted-foreground"
      >
        {label} <span className="text-emerald-400">*</span>
      </label>
      <div
        className={`group/input relative mt-2 rounded-xl transition-all duration-200 ${
          focused
            ? "ring-2 ring-emerald-400/25 [box-shadow:0_0_0_1px_rgba(52,211,153,0.55),0_8px_28px_-12px_rgba(16,185,129,0.45)]"
            : showInvalid
              ? "ring-1 ring-rose-500/40"
              : "ring-1 ring-transparent"
        }`}
      >
        <input
          id={id}
          type={type}
          required
          value={value}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-xl border bg-background px-4 py-3 pr-10 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 ${
            focused
              ? "border-emerald-400/60"
              : showInvalid
                ? "border-rose-500/40"
                : "border-border"
          }`}
        />
        <AnimatePresence>
          {showValid && (
            <motion.span
              key="ok"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ type: "spring", stiffness: 500, damping: 22 }}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400"
            >
              <CheckCircle2 className="h-4 w-4" />
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      {helper && (
        <p
          className={`mt-1.5 text-[11px] ${
            showInvalid ? "text-rose-400/90" : "text-muted-foreground/80"
          }`}
        >
          {showInvalid ? `Please enter a valid ${label.toLowerCase()}.` : helper}
        </p>
      )}
    </div>
  );
}

function TrustPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-white/[0.02] px-2.5 py-2.5 text-[11px] font-medium text-foreground/85 transition hover:border-emerald-400/30 hover:bg-emerald-400/[0.04]">
      <span className="text-emerald-400">{icon}</span>
      <span className="truncate">{label}</span>
    </div>
  );
}

function Row({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={muted ? "text-muted-foreground" : "text-foreground"}>
        {value}
      </span>
    </div>
  );
}

function Step({
  n,
  icon,
  title,
  text,
}: {
  n: number;
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="group/step relative flex items-start gap-3 rounded-xl border border-border bg-background/40 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-400/25 hover:bg-background/60">
      <div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-400/25 bg-emerald-400/[0.07] text-emerald-300 shadow-[0_0_18px_-6px_rgba(16,185,129,0.5)]">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="label-uppercase text-[10px] text-muted-foreground">
          Step {n}
        </p>
        <p className="mt-0.5 text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {text}
        </p>
      </div>
    </div>
  );
}
