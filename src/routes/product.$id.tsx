import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  Clock,
  Cpu,
  Loader2,
  LogOut,
  MessageCircle,
  Minus,
  Package,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import symdealsLogo from "@/assets/symdeals-logo.png";
import {
  type Product,
  clearSession,
  fetchProduct,
  getToken,
  resolveImageUrl,
} from "@/lib/api";
import { addToCart } from "@/lib/cart";
import { LogoutConfirmDialog } from "@/components/LogoutConfirmDialog";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { getBrandArt } from "@/lib/brandLogos";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const Route = createFileRoute("/product/$id")({
  component: ProductPage,
  head: () => ({
    meta: [
      { title: "Product — SymDeals" },
      { name: "description", content: "Premium subscription details." },
    ],
  }),
});

function ProductPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonths, setSelectedMonths] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [buying, setBuying] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      navigate({ to: "/login" });
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchProduct(id)
      .then((res) => {
        if (cancelled) return;
        setProduct(res.product);
        const sorted = [...res.product.plans].sort((a, b) => a.months - b.months);
        setSelectedMonths(sorted[0]?.months ?? null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load product");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const plans = useMemo(
    () => (product ? [...product.plans].sort((a, b) => a.months - b.months) : []),
    [product]
  );
  const selectedPlan =
    plans.find((p) => p.months === selectedMonths) ?? plans[0] ?? null;
  const realPrice =
    selectedPlan && (selectedPlan.realPrice ?? 0) > selectedPlan.price
      ? selectedPlan.realPrice!
      : null;
  const showOldPrice = realPrice !== null;
  const savedAmount =
    showOldPrice && selectedPlan ? Math.max(0, realPrice! - selectedPlan.price) : 0;
  const savedPct =
    showOldPrice && selectedPlan && realPrice
      ? Math.max(0, Math.round(((realPrice - selectedPlan.price) / realPrice) * 100))
      : 0;
  const total = selectedPlan ? selectedPlan.price * quantity : 0;

  const onLogout = () => setLogoutOpen(true);
  const confirmLogout = () => {
    setLogoutOpen(false);
    clearSession();
    navigate({ to: "/login" });
  };

  const handleBuy = () => {
    if (!product || !selectedPlan || buying) return;
    setBuying(true);
    try {
      sessionStorage.setItem(
        "symdeals.checkout",
        JSON.stringify({
          productId: product.id,
          months: selectedPlan.months,
          quantity,
        })
      );
    } catch {
      /* ignore */
    }
    navigate({ to: "/checkout" });
  };

  const handleAddToCart = () => {
    if (!product || !selectedPlan) return;
    addToCart({
      productId: product.id,
      name: product.name,
      image: product.image,
      category: product.category,
      months: selectedPlan.months,
      price: selectedPlan.price,
      realPrice: selectedPlan.realPrice,
      quantity,
    });
    toast("Added to cart", {
      description: `${product.name} · ${selectedPlan.months} mo × ${quantity}`,
    });
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="relative min-h-screen bg-background text-foreground">
        {/* Ambient backdrop */}
        <div className="pointer-events-none fixed inset-0 -z-10 mesh-bg opacity-50" />
        <div className="pointer-events-none fixed inset-0 -z-10 grid-pattern opacity-40" />

        <header className="sticky top-0 z-40 border-b border-border bg-background/70 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <Link to="/" aria-label="SymDeals home" className="group flex items-center">
              <img
                src={symdealsLogo}
                alt="SymDeals"
                className="h-5 w-auto object-contain transition-transform duration-300 group-hover:scale-[1.03] sm:h-6"
                style={{ filter: "drop-shadow(0 0 6px rgba(0, 255, 170, 0.18))" }}
              />
            </Link>
            <div className="flex items-center gap-2">
              <Link
                to="/dashboard"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-md border border-border bg-surface/60 px-3 py-1.5 text-[12px] font-semibold text-foreground transition-colors hover:border-muted-foreground/30 hover:bg-surface-elevated"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Dashboard
              </Link>
              <button
                onClick={onLogout}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface/60 px-3 py-1.5 text-[12px] font-semibold text-foreground transition-colors hover:border-muted-foreground/30 hover:bg-surface-elevated"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-5 pb-44 pt-8 sm:px-6 sm:pt-10 lg:pb-16">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-[12px] text-muted-foreground">
            <Link to="/dashboard" className="transition-colors hover:text-foreground">
              Dashboard
            </Link>
            <span>/</span>
            <span className="line-clamp-1 text-foreground">
              {product?.name ?? "Product"}
            </span>
          </nav>

          {loading ? (
            <div className="mt-8 grid gap-10 lg:grid-cols-2">
              <div className="aspect-square animate-pulse rounded-3xl border border-border bg-surface" />
              <div className="space-y-4">
                <div className="h-8 w-2/3 animate-pulse rounded-md bg-surface" />
                <div className="h-12 w-1/3 animate-pulse rounded-md bg-surface" />
                <div className="h-32 animate-pulse rounded-md bg-surface" />
                <div className="h-12 animate-pulse rounded-full bg-surface" />
              </div>
            </div>
          ) : error || !product ? (
            <div className="mt-12 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface px-6 py-16 text-center">
              <Package className="h-10 w-10 text-muted-foreground/60" />
              <p className="mt-4 text-[14px] font-semibold text-foreground">
                {error ?? "Product not found"}
              </p>
              <Link
                to="/dashboard"
                className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-[12.5px] font-bold uppercase tracking-[0.12em] text-primary-foreground transition-all hover:bg-[var(--primary-hover)] hover:shadow-glow"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Dashboard
              </Link>
            </div>
          ) : (
            <>
              <div className="mt-8 grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:items-start">
                {/* Visual — cinematic glass card */}
                <div className="lg:sticky lg:top-24">
                  <ProductHero product={product} />
                  {/* Desktop trust strip under hero */}
                  <div className="mt-5 hidden grid-cols-3 gap-2.5 lg:grid">
                    <TrustChip Icon={ShieldCheck} label="Secure Payment" hint="256-bit encrypted checkout" />
                    <TrustChip Icon={Zap} label="Instant Delivery" hint="Auto-processed in seconds" />
                    <TrustChip Icon={Check} label="Verified Seller" hint="Trusted by thousands" />
                  </div>
                </div>

                {/* Details */}
                <div className="flex flex-col gap-7">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1 backdrop-blur">
                      <Sparkles className="h-3 w-3 text-primary" />
                      <span className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        {product.category || "Premium Subscription"}
                      </span>
                    </div>
                    <h1 className="mt-4 font-display text-[2.1rem] font-semibold leading-[1.05] tracking-[-0.025em] text-foreground sm:text-[2.65rem]">
                      {product.name}
                    </h1>

                    {/* Metadata badges */}
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      <MetaBadge Icon={Zap}>Instant Delivery</MetaBadge>
                      <MetaBadge Icon={Cpu}>Auto Processed</MetaBadge>
                      <MetaBadge Icon={ShieldCheck}>Verified Seller</MetaBadge>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="font-display text-[2.6rem] font-semibold leading-none tracking-[-0.02em] text-foreground">
                      {selectedPlan ? `₹${selectedPlan.price.toLocaleString()}` : "—"}
                    </span>
                    {showOldPrice && (
                      <span className="text-[14px] font-medium text-muted-foreground line-through">
                        ₹{realPrice!.toLocaleString()}
                      </span>
                    )}
                    {selectedPlan && (
                      <span className="text-[12.5px] font-medium text-muted-foreground">
                        / {selectedPlan.months} {selectedPlan.months > 1 ? "months" : "month"}
                      </span>
                    )}
                    {savedPct > 0 && (
                      <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-primary">
                        Save {savedPct}%
                      </span>
                    )}
                  </div>
                  {savedAmount > 0 && (
                    <p className="-mt-1 text-[12.5px] font-medium text-emerald-300/90">
                      You save ₹{savedAmount.toLocaleString()}
                    </p>
                  )}

                  {/* Duration */}
                  {plans.length > 0 && (
                    <div>
                      <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Choose Duration
                      </p>
                      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {plans.map((p) => {
                          const active = p.months === selectedMonths;
                          return (
                            <motion.button
                              key={p.months}
                              type="button"
                              onClick={() => setSelectedMonths(p.months)}
                              whileTap={{ scale: 0.96 }}
                              transition={{ type: "spring", stiffness: 420, damping: 26 }}
                              className={
                                "relative rounded-xl border px-4 py-3 text-[12.5px] font-semibold tracking-tight transition-colors " +
                                (active
                                  ? "border-primary/60 bg-primary/10 text-foreground shadow-[0_0_0_3px_color-mix(in_oklab,var(--primary)_10%,transparent)]"
                                  : "border-border bg-surface/60 text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground")
                              }
                            >
                              <span className="block text-[13px] font-semibold text-foreground">
                                {p.months} {p.months === 1 ? "Month" : "Months"}
                              </span>
                              <span className="mt-0.5 block text-[10.5px] font-medium text-muted-foreground">
                                ₹{p.price.toLocaleString()}
                                {(p.realPrice ?? 0) > p.price && (
                                  <span className="ml-1 text-muted-foreground/60 line-through">
                                    ₹{p.realPrice!.toLocaleString()}
                                  </span>
                                )}
                              </span>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Quantity */}
                  <div>
                    <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Quantity
                    </p>
                    <div className="mt-3 inline-flex items-center gap-1 rounded-full border border-border bg-surface/60 p-1 backdrop-blur">
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-surface-elevated disabled:opacity-40"
                        disabled={quantity <= 1}
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-4 w-4" />
                      </motion.button>
                      <span className="min-w-[2.25ch] text-center font-display text-[14px] font-semibold text-foreground">
                        {quantity}
                      </span>
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-surface-elevated"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-4 w-4" />
                      </motion.button>
                    </div>
                  </div>

                  {/* Actions — desktop only (mobile uses sticky bar) */}
                  <div className="hidden flex-col gap-2.5 sm:flex-row md:flex">
                    <motion.button
                      type="button"
                      onClick={handleAddToCart}
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 380, damping: 24 }}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-border bg-surface/60 px-4 py-3.5 text-[12.5px] font-semibold tracking-tight text-foreground backdrop-blur transition-colors hover:border-muted-foreground/40 hover:bg-surface-elevated"
                    >
                      <ShoppingCart className="h-3.5 w-3.5" />
                      Add to Cart
                    </motion.button>
                    <BuyButton total={total} buying={buying} onClick={handleBuy} />
                  </div>

                  {/* Important note */}
                  <div className="relative overflow-hidden rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.04] p-4">
                    <span
                      aria-hidden
                      className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--primary)_28%,transparent),transparent_70%)] opacity-60 blur-2xl"
                    />
                    <div className="relative flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-400/25 bg-emerald-400/10">
                        <MessageCircle className="h-4 w-4 text-emerald-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-foreground">
                          After payment — quick handoff
                        </p>
                        <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted-foreground">
                          Send your{" "}
                          <span className="font-semibold text-foreground">Order ID</span>{" "}
                          on WhatsApp. Credentials are delivered within minutes during business hours.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Mobile trust strip */}
                  <div className="grid grid-cols-3 gap-2.5 lg:hidden">
                    <TrustChip Icon={ShieldCheck} label="Secure" hint="256-bit encrypted checkout" />
                    <TrustChip Icon={Zap} label="Instant" hint="Auto-processed in seconds" />
                    <TrustChip Icon={Check} label="Verified" hint="Trusted by thousands" />
                  </div>
                </div>
              </div>

              {/* Description / details accordion */}
              <section className="mt-16 rounded-3xl border border-border bg-surface/50 p-6 backdrop-blur sm:p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1">
                      <Package className="h-3 w-3 text-primary" />
                      <span className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Product Details
                      </span>
                    </div>
                    <h2 className="mt-4 font-display text-[1.5rem] font-semibold tracking-[-0.02em] text-foreground">
                      About this product
                    </h2>
                  </div>
                </div>

                <div className="mt-6">
                  <Accordion
                    type="single"
                    collapsible
                    defaultValue="overview"
                    className="divide-y divide-border/60 border-y border-border/60"
                  >
                    <AccordionItem value="overview" className="border-0">
                      <AccordionTrigger className="text-[13.5px] font-semibold tracking-tight text-foreground hover:no-underline">
                        Overview
                      </AccordionTrigger>
                      <AccordionContent className="whitespace-pre-line text-[13.5px] leading-relaxed text-muted-foreground">
                        {product.description || "No description provided."}
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="whatyouget" className="border-0">
                      <AccordionTrigger className="text-[13.5px] font-semibold tracking-tight text-foreground hover:no-underline">
                        What you get
                      </AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-2">
                          {[
                            "Full premium access for the selected duration",
                            "Working credentials delivered to your dashboard",
                            "Priority support via WhatsApp during business hours",
                            "Replacement warranty if access stops working",
                          ].map((item) => (
                            <li
                              key={item}
                              className="flex items-start gap-2.5 text-[13px] text-muted-foreground"
                            >
                              <span className="mt-[3px] flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15">
                                <Check className="h-2.5 w-2.5 text-primary" strokeWidth={3} />
                              </span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="delivery" className="border-0">
                      <AccordionTrigger className="text-[13.5px] font-semibold tracking-tight text-foreground hover:no-underline">
                        Delivery process
                      </AccordionTrigger>
                      <AccordionContent>
                        <ol className="space-y-3">
                          {[
                            { t: "Complete payment", d: "Pay securely through our checkout." },
                            { t: "Receive Order ID", d: "Order ID is generated instantly." },
                            { t: "Send on WhatsApp", d: "Forward Order ID to our verified support." },
                            { t: "Get credentials", d: "Premium access delivered to you within minutes." },
                          ].map((s, i) => (
                            <li key={s.t} className="flex items-start gap-3">
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-[11px] font-semibold text-primary">
                                {i + 1}
                              </span>
                              <div>
                                <p className="text-[13px] font-semibold text-foreground">{s.t}</p>
                                <p className="mt-0.5 text-[12.5px] text-muted-foreground">{s.d}</p>
                              </div>
                            </li>
                          ))}
                        </ol>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="instructions" className="border-0">
                      <AccordionTrigger className="text-[13.5px] font-semibold tracking-tight text-foreground hover:no-underline">
                        Important instructions
                      </AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-2 text-[13px] text-muted-foreground">
                          <li className="flex gap-2"><span className="text-primary">•</span> Do not change the password on shared accounts.</li>
                          <li className="flex gap-2"><span className="text-primary">•</span> Use only one profile assigned to you.</li>
                          <li className="flex gap-2"><span className="text-primary">•</span> Avoid sharing credentials with anyone outside your household.</li>
                          <li className="flex gap-2"><span className="text-primary">•</span> Contact support immediately if access stops working.</li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>

                {plans.length > 0 && (
                  <div className="mt-8">
                    <h3 className="font-display text-[1.05rem] font-semibold tracking-[-0.01em] text-foreground">
                      Available Plans
                    </h3>
                    <div className="mt-3 overflow-hidden rounded-2xl border border-border">
                      <table className="w-full text-left">
                        <thead className="bg-background/60">
                          <tr>
                            <th className="px-4 py-3 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                              Duration
                            </th>
                            <th className="px-4 py-3 text-right text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                              Price
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {plans.map((p) => (
                            <tr
                              key={p.months}
                              className="border-t border-border/60 text-[13px]"
                            >
                              <td className="px-4 py-3 font-medium text-foreground">
                                {p.months} {p.months === 1 ? "Month" : "Months"}
                              </td>
                              <td className="px-4 py-3 text-right font-semibold text-foreground">
                                ₹{p.price.toLocaleString()}
                                {(p.realPrice ?? 0) > p.price && (
                                  <span className="ml-2 text-[11.5px] font-medium text-muted-foreground line-through">
                                    ₹{p.realPrice!.toLocaleString()}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </section>
            </>
          )}
        </main>

        {/* Sticky mobile buy bar — sits above MobileBottomNav */}
        {product && selectedPlan && (
          <div
            className="fixed inset-x-0 z-30 px-3 md:hidden"
            style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 76px)" }}
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="glass-nav flex items-center gap-2 rounded-2xl border border-border p-2 shadow-elevated"
            >
              <div className="min-w-0 flex-1 px-2">
                <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Total
                </div>
                <div className="font-display text-[15px] font-semibold tracking-tight text-foreground">
                  ₹{total.toLocaleString()}
                  <span className="ml-1 text-[10.5px] font-medium text-muted-foreground">
                    · {selectedPlan.months}m × {quantity}
                  </span>
                </div>
              </div>
              <BuyButton total={total} buying={buying} onClick={handleBuy} compact />
            </motion.div>
          </div>
        )}

        <LogoutConfirmDialog
          open={logoutOpen}
          onCancel={() => setLogoutOpen(false)}
          onConfirm={confirmLogout}
        />
        <MobileBottomNav />
      </div>
    </TooltipProvider>
  );
}

/* ---------- Hero / visual ---------- */

function ProductHero({ product }: { product: Product }) {
  const brand = getBrandArt(product.name);
  const hasUserImage = !!product.image;
  const bg = brand?.bg ?? "#0e1116";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2 }}
      className="group relative aspect-square w-full overflow-hidden rounded-3xl border border-border shadow-elevated"
      style={{ background: bg }}
    >
      {/* Floating ambient glows */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute -left-1/4 -top-1/4 h-[70%] w-[70%] rounded-full opacity-60 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklab, var(--primary) 28%, transparent), transparent 70%)",
        }}
        animate={{ x: [0, 22, 0], y: [0, 18, 0] }}
        transition={{ duration: 9, ease: "easeInOut", repeat: Infinity }}
      />
      <motion.span
        aria-hidden
        className="pointer-events-none absolute -bottom-1/4 -right-1/4 h-[80%] w-[80%] rounded-full opacity-50 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(255,255,255,0.18), transparent 70%)",
        }}
        animate={{ x: [0, -18, 0], y: [0, -22, 0] }}
        transition={{ duration: 11, ease: "easeInOut", repeat: Infinity }}
      />

      {/* Subtle grid */}
      <div className="pointer-events-none absolute inset-0 grid-pattern opacity-30" />

      {/* Top glass label */}
      <div className="absolute left-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-2.5 py-1 backdrop-blur-md">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/85">
          Premium · Live
        </span>
      </div>
      <div className="absolute right-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-2.5 py-1 backdrop-blur-md">
        <Clock className="h-3 w-3 text-white/85" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/85">
          Instant
        </span>
      </div>

      {/* Centerpiece artwork */}
      <div className="absolute inset-0 z-[1] flex items-center justify-center p-10">
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 6, ease: "easeInOut", repeat: Infinity }}
          className="relative flex h-full max-h-[60%] w-full max-w-[60%] items-center justify-center"
        >
          {/* Soft glow under logo */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(255,255,255,0.22), transparent 65%)",
              filter: "blur(28px)",
            }}
          />
          {hasUserImage ? (
            <img
              src={resolveImageUrl(product.image)}
              alt={product.name}
              className="h-full w-full object-contain drop-shadow-[0_24px_48px_rgba(0,0,0,0.55)]"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          ) : brand ? (
            <img
              src={brand.url}
              alt={product.name}
              className="h-full w-full object-contain drop-shadow-[0_24px_48px_rgba(0,0,0,0.55)]"
            />
          ) : (
            <Package className="h-24 w-24 text-white/40" strokeWidth={1.4} />
          )}
        </motion.div>
      </div>

      {/* Bottom watermark */}
      <div className="absolute inset-x-0 bottom-0 z-[2] flex items-end justify-between p-4">
        <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 backdrop-blur-md">
          <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/60">
            Service
          </div>
          <div className="font-display text-[13.5px] font-semibold tracking-tight text-white">
            {product.name}
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-right backdrop-blur-md">
          <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/60">
            Warranty
          </div>
          <div className="font-display text-[13.5px] font-semibold tracking-tight text-white">
            Included
          </div>
        </div>
      </div>

      {/* Top inner highlight */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
      />
    </motion.div>
  );
}

/* ---------- Buttons & badges ---------- */

function BuyButton({
  total,
  buying,
  onClick,
  compact = false,
}: {
  total: number;
  buying: boolean;
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={buying}
      whileHover={{ y: -1, scale: 1.01 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 420, damping: 24 }}
      className={
        "group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-foreground font-semibold tracking-tight text-background shadow-[0_10px_32px_-12px_rgba(0,0,0,0.7)] transition-all duration-300 hover:shadow-[0_18px_40px_-12px_color-mix(in_oklab,var(--primary)_45%,transparent)] disabled:opacity-90 " +
        (compact
          ? "h-12 px-5 text-[12.5px]"
          : "h-12 flex-1 px-5 text-[13px] sm:h-[52px]")
      }
    >
      {/* shimmer */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[400%]"
      />
      {buying ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Processing…
        </>
      ) : (
        <>
          <Zap className="h-4 w-4" />
          Buy Now · ₹{total.toLocaleString()}
        </>
      )}
    </motion.button>
  );
}

function MetaBadge({
  Icon,
  children,
}: {
  Icon: typeof Zap;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/60 px-2.5 py-1 text-[11px] font-medium text-muted-foreground backdrop-blur">
      <Icon className="h-3 w-3 text-primary" />
      {children}
    </span>
  );
}

function TrustChip({
  Icon,
  label,
  hint,
}: {
  Icon: typeof ShieldCheck;
  label: string;
  hint: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ type: "spring", stiffness: 380, damping: 26 }}
          className="group flex cursor-default items-center gap-2 rounded-xl border border-border bg-surface/60 px-3 py-2.5 backdrop-blur transition-colors hover:border-primary/30"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-background/60 text-primary transition-colors group-hover:border-primary/30">
            <Icon className="h-3.5 w-3.5" />
          </span>
          <span className="text-[11.5px] font-semibold tracking-tight text-foreground">
            {label}
          </span>
        </motion.div>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={6}>{hint}</TooltipContent>
    </Tooltip>
  );
}
