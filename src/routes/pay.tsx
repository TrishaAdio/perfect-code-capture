import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Download,
  Home,
  Lock,
  Package,
  RefreshCw,
  Share2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  XCircle,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import { API_BASE, createOrder, createPaymentInvoice } from "@/lib/api";
import { requireAuthBeforeLoad } from "@/lib/auth-guard";
import symdealsLogo from "@/assets/symdeals-logo.png";
import paymentSuccessSfx from "@/assets/payment-success.mp3";

export const Route = createFileRoute("/pay")({
  ssr: false,
  beforeLoad: requireAuthBeforeLoad,
  component: PayPage,
  head: () => ({
    meta: [
      { title: "Scan QR to Pay — SymDeals" },
      {
        name: "description",
        content:
          "Securely complete your SymDeals payment by scanning the UPI QR code.",
      },
    ],
  }),
});

const PAY_API = `${API_BASE}/api/payments`;
const SESSION_KEY = "symdeals.checkout";
const QR_TTL_SEC = 5 * 60; // 5 minutes
const POLL_INTERVAL_MS = 2500;
const NEEDS_NGROK_HEADER = /ngrok-free\.dev|ngrok\.app/i.test(API_BASE);

type CheckoutState = {
  productId?: string;
  months?: number;
  quantity?: number;
  amount?: number;
  realPrice?: number;
  productName?: string;
  productImage?: string;
};

type CreateResponse = {
  invoice_id: string;
  unique_amount: number;
  qr_base64: string;
  upi_link: string;
  check_url: string;
};

type RawCreateResponse = Partial<CreateResponse> & {
  tracking_id?: string;
};

type CheckResponse = {
  paid: boolean;
  utr?: string;
  sender?: string;
  amount?: number;
};

function readCheckoutState(): CheckoutState {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as CheckoutState;
  } catch {
    return {};
  }
}

function PayPage() {
  const navigate = useNavigate();
  const [state] = useState<CheckoutState>(readCheckoutState);

  const [creating, setCreating] = useState(true);
  const [createError, setCreateError] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<CreateResponse | null>(null);

  const [secondsLeft, setSecondsLeft] = useState(QR_TTL_SEC);
  const [expired, setExpired] = useState(false);
  const [paid, setPaid] = useState<CheckResponse | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paidAt, setPaidAt] = useState<Date | null>(null);
  const [waClickedAt, setWaClickedAt] = useState<Date | null>(null);
  const [now, setNow] = useState<Date>(() => new Date());
  const [celebrating, setCelebrating] = useState(false);
  const [countdown, setCountdown] = useState(3);

  // Show the celebration screen first when payment is confirmed, then auto-advance
  useEffect(() => {
    if (!paid) return;
    setCelebrating(true);
    setCountdown(3);
    const tick = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(tick);
          setCelebrating(false);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [paid]);

  // Tick a "now" clock once paid (for relative timestamps)
  useEffect(() => {
    if (!paid) return;
    const id = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(id);
  }, [paid]);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const successAudioRef = useRef<HTMLAudioElement | null>(null);
  const soundPlayedRef = useRef(false);

  const merchantName = state.productName || "SymDeals Order";
  const fallbackAmount = Number(state.amount) || 0;

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const stopTicker = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  const generateQr = useCallback(async () => {
    if (!state.productId || !state.months) {
      setCreateError("No product selected. Please go back and reselect your plan.");
      setCreating(false);
      return;
    }
    setCreating(true);
    setCreateError(null);
    setInvoice(null);
    setExpired(false);
    setPaid(null);
    setSecondsLeft(QR_TTL_SEC);
    stopPolling();
    stopTicker();

    try {
      // Authenticated, server-authoritative invoice creation. The backend
      // looks up the product, computes the price, and binds the invoice to
      // (userId, productId, months, expectedAmount). The frontend never
      // sends a price — it can't be tampered with.
      const raw = await createPaymentInvoice({
        productId: state.productId,
        months: Number(state.months),
        quantity: Number(state.quantity) || 1,
      });
      const invoiceId = raw.invoice_id;
      if (!invoiceId || !raw.qr_base64) {
        throw new Error("Invalid response from payment service");
      }
      const data: CreateResponse = {
        invoice_id: invoiceId,
        unique_amount: raw.unique_amount ?? 0,
        qr_base64: raw.qr_base64,
        upi_link: raw.upi_link ?? "",
        check_url: raw.check_url ?? "",
      };
      setInvoice(data);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Payment service unavailable";
      setCreateError(msg);
      toast.error("Payment service unavailable", { description: msg });
    } finally {
      setCreating(false);
    }
  }, [state.productId, state.months, state.quantity, stopPolling, stopTicker]);

  // Initial QR generation + auth/state guard
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!state.productId || !state.months) {
      navigate({ to: "/dashboard" });
      return;
    }
    void generateQr();
    return () => {
      stopPolling();
      stopTicker();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Countdown + polling once invoice is ready
  useEffect(() => {
    if (!invoice || paid) return;

    setSecondsLeft(QR_TTL_SEC);
    setExpired(false);

    tickRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          setExpired(true);
          stopPolling();
          stopTicker();
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    const poll = async () => {
      try {
        const res = await fetch(
          `${PAY_API}/check/${invoice.invoice_id}?t=${Date.now()}`,
          {
            cache: "no-store",
            headers: NEEDS_NGROK_HEADER
              ? {
                  "ngrok-skip-browser-warning": "true",
                }
              : undefined,
          }
        );
        const text = await res.text();
        if (!res.ok) {
          console.warn("[pay] check non-ok", res.status, text.slice(0, 200));
          return;
        }
        let data: CheckResponse | null = null;
        try {
          data = JSON.parse(text) as CheckResponse;
        } catch {
          console.warn("[pay] check non-JSON", text.slice(0, 200));
          return;
        }
        console.log("[pay] check response", data);
        const isPaid =
          data?.paid === true ||
          (data as unknown as { paid?: unknown })?.paid === "true" ||
          Boolean((data as unknown as { utr?: string })?.utr);
        if (isPaid) {
          stopPolling();
          stopTicker();
          setPaid(data);
          setPaidAt(new Date());
          try {
            sessionStorage.setItem(
              "symdeals.lastPayment",
              JSON.stringify({
                invoice_id: invoice.invoice_id,
                amount: data.amount ?? invoice.unique_amount,
                utr: data.utr ?? "",
                sender: data.sender ?? "",
                productName: merchantName,
                paidAt: new Date().toISOString(),
              })
            );
          } catch {
            /* ignore */
          }
          // Create the order in our backend. Server-authoritative: only
          // invoiceId is sent; the backend looks up the bound invoice for
          // userId/product/amount and ignores any client-side pricing.
          void createOrder({ invoiceId: invoice.invoice_id })
            .then((r) => {
              console.log("[pay] order created", r.order);
              setOrderId(r.order.orderId);
              toast.success("Order placed", {
                description: `Order ID: ${r.order.orderId}`,
                duration: 2800,
              });
            })
            .catch((err) => {
              console.error("[pay] createOrder failed", err);
              toast.error("Could not create order", {
                description:
                  err instanceof Error
                    ? err.message
                    : "Order service unavailable. Contact support with your invoice ID.",
              });
            });
        }
      } catch {
        /* network blip — keep polling */
      }
    };

    pollRef.current = setInterval(poll, POLL_INTERVAL_MS);
    void poll();

    return () => {
      stopPolling();
      stopTicker();
    };
  }, [invoice, paid, merchantName, stopPolling, stopTicker]);

  // Play success sound exactly once when paid is confirmed
  useEffect(() => {
    if (!paid || soundPlayedRef.current) return;
    soundPlayedRef.current = true;
    try {
      const audio = new Audio(paymentSuccessSfx);
      audio.volume = 0.7;
      audio.loop = false;
      successAudioRef.current = audio;
      void audio.play().catch(() => {
        /* autoplay blocked — silently ignore */
      });
    } catch {
      /* ignore */
    }
  }, [paid]);

  const minutes = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeLabel = `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  const timerLow = secondsLeft <= 60;

  const amountDisplay = useMemo(() => {
    const a = invoice?.unique_amount ?? fallbackAmount;
    return a.toFixed(2);
  }, [invoice, fallbackAmount]);

  const openUpiApp = () => {
    if (!invoice) return;
    window.location.href = invoice.upi_link;
  };

  const downloadQr = useCallback(() => {
    if (!invoice) return;
    try {
      const link = document.createElement("a");
      link.href = `data:image/png;base64,${invoice.qr_base64}`;
      link.download = `symdeals-qr-${invoice.invoice_id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("QR downloaded");
    } catch {
      toast.error("Could not download QR");
    }
  }, [invoice]);

  const shareQr = useCallback(async () => {
    if (!invoice) return;
    const shareText = `Pay ₹${(invoice.unique_amount).toFixed(2)} to ${merchantName} via UPI:\n${invoice.upi_link}`;
    try {
      // Try sharing the QR image as a file when supported
      const res = await fetch(`data:image/png;base64,${invoice.qr_base64}`);
      const blob = await res.blob();
      const file = new File([blob], `symdeals-qr-${invoice.invoice_id}.png`, {
        type: "image/png",
      });

      const navAny = navigator as Navigator & {
        canShare?: (data: ShareData) => boolean;
      };
      if (
        navAny.share &&
        navAny.canShare &&
        navAny.canShare({ files: [file] })
      ) {
        await navAny.share({
          title: "SymDeals Payment QR",
          text: shareText,
          files: [file],
        });
        return;
      }
      if (navAny.share) {
        await navAny.share({
          title: "SymDeals Payment QR",
          text: shareText,
          url: invoice.upi_link,
        });
        return;
      }
      await navigator.clipboard.writeText(shareText);
      toast.success("Payment link copied");
    } catch (err) {
      if ((err as DOMException)?.name === "AbortError") return;
      try {
        await navigator.clipboard.writeText(shareText);
        toast.success("Payment link copied");
      } catch {
        toast.error("Could not share QR");
      }
    }
  }, [invoice, merchantName]);

  // ------------- Success view -------------
  if (paid && invoice) {
    const finalAmountNum = paid.amount ?? invoice.unique_amount;
    const oid = orderId || "";
    const waMsg = `Hello\n\nI have completed a payment of ₹${finalAmountNum} for the *${merchantName}*.\n\n*Order ID:* _${oid}_\n\nKindly provide my account credentials at your earliest convenience.\n\nThank you.`;
    const waUrl = `https://wa.me/251708539654?text=${encodeURIComponent(waMsg)}`;

    const downloadInvoice = () => {
      const lines = [
        "SYMDEALS — ORDER RECEIPT",
        "────────────────────────────",
        `Order ID     : ${oid || invoice.invoice_id}`,
        `Invoice ID   : ${invoice.invoice_id}`,
        `Product      : ${merchantName}`,
        `Amount paid  : ₹${finalAmountNum.toFixed(2)}`,
        paid.utr ? `UTR          : ${paid.utr}` : "",
        paid.sender ? `Paid by      : ${paid.sender}` : "",
        `Paid at      : ${paidAt ? paidAt.toLocaleString() : "—"}`,
        "",
        "Thank you for shopping with SymDeals.",
      ].filter(Boolean).join("\n");
      const blob = new Blob([lines], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `SymDeals-${invoice.invoice_id}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    };

    return (
      <div className="relative min-h-screen overflow-hidden bg-background">
        {/* Subtle ambient — single soft top wash, no neon */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-x-0 top-0 mx-auto h-[420px] max-w-5xl bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.08),transparent_70%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(1px_1px_at_50%_0%,rgba(255,255,255,0.04),transparent_60%)]" />
        </div>

        {/* Slim top bar */}
        <header className="relative border-b border-white/[0.05]">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link to="/dashboard" aria-label="SymDeals home" className="flex items-center">
              <img
                src={symdealsLogo}
                alt="SymDeals"
                className="h-5 w-auto object-contain sm:h-[22px]"
              />
            </Link>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.02] px-2.5 py-1 text-[10.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              <ShieldCheck className="h-3 w-3 text-emerald-400/80" />
              Secure receipt
            </span>
          </div>
        </header>

        <main className="relative mx-auto w-full max-w-6xl px-6 py-12 sm:py-16">
          {/* Hero — confirmation */}
          <section className="animate-success-stagger mx-auto max-w-3xl text-center" style={{ animationDelay: "0.05s" }}>
            <div className="relative mx-auto flex h-16 w-16 items-center justify-center">
              <span className="absolute inset-0 animate-success-ring rounded-full bg-emerald-400/14" />
              <div className="animate-success-pop relative flex h-14 w-14 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/10 text-emerald-300">
                <Check className="h-7 w-7" strokeWidth={2.6} />
              </div>
            </div>
            <p className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/[0.06] px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-emerald-300/90">
              <span className="h-1 w-1 rounded-full bg-emerald-400" />
              Order Confirmed
            </p>
            <h1 className="mt-5 font-display text-[2rem] font-semibold leading-[1.1] tracking-[-0.03em] text-foreground sm:text-[2.75rem]">
              Your premium access is being prepared.
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-[14.5px] leading-[1.65] text-muted-foreground sm:text-[15px]">
              We've received your payment and your order is now in our automated delivery queue.
              You'll receive your credentials shortly — typically within a few minutes.
            </p>
            <p className="mt-5 font-mono text-[11.5px] uppercase tracking-[0.16em] text-muted-foreground/70">
              Order&nbsp;
              <span className="text-foreground/80">{oid || invoice.invoice_id}</span>
            </p>
          </section>

          {/* Two-column body */}
          <section className="mt-12 grid gap-5 lg:grid-cols-[1.15fr_1fr] lg:gap-6">
            {/* LEFT — Order summary */}
            <div
              className="animate-success-stagger overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.015] backdrop-blur-sm"
              style={{ animationDelay: "0.18s" }}
            >
              <div className="flex items-center justify-between border-b border-white/[0.05] px-6 py-4">
                <h2 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Order summary
                </h2>
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Sparkles className="h-3 w-3 text-emerald-400/80" />
                  Digital delivery
                </span>
              </div>

              <div className="flex items-center gap-4 px-6 py-5">
                <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.03]">
                  {state.productImage ? (
                    <img src={state.productImage} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Package className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold tracking-[-0.01em] text-foreground">
                    {merchantName}
                  </p>
                  <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                    Premium subscription · Auto-delivered to your inbox
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-px border-t border-white/[0.05] bg-white/[0.03] text-left">
                <div className="bg-background/40 px-6 py-4">
                  <p className="text-[10.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Invoice</p>
                  <p className="mt-1 truncate font-mono text-[12px] text-foreground/85">{invoice.invoice_id}</p>
                </div>
                <div className="bg-background/40 px-6 py-4">
                  <p className="text-[10.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Paid at</p>
                  <p className="mt-1 font-mono text-[12px] text-foreground/85">
                    {paidAt ? formatClock(paidAt) : "—"}
                  </p>
                </div>
                {paid.utr && (
                  <div className="bg-background/40 px-6 py-4">
                    <p className="text-[10.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">UTR</p>
                    <p className="mt-1 truncate font-mono text-[12px] text-foreground/85">{paid.utr}</p>
                  </div>
                )}
                <div className="bg-background/40 px-6 py-4">
                  <p className="text-[10.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Amount</p>
                  <p className="mt-1 font-mono text-[12px] text-foreground/85">₹{finalAmountNum.toFixed(2)}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2.5 border-t border-white/[0.05] px-6 py-5 sm:flex-row">
                <a
                  href={oid ? waUrl : undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-disabled={!oid}
                  onClick={(e) => {
                    if (!oid) { e.preventDefault(); return; }
                    if (!waClickedAt) setWaClickedAt(new Date());
                  }}
                  className={`group inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-[13.5px] font-semibold tracking-[-0.005em] transition-all duration-200 ${
                    oid
                      ? "bg-foreground text-background shadow-[0_1px_0_rgba(255,255,255,0.18)_inset,0_10px_30px_-12px_rgba(0,0,0,0.6)] hover:bg-foreground/90 active:scale-[0.99]"
                      : "cursor-wait border border-white/[0.06] bg-white/[0.02] text-muted-foreground"
                  }`}
                >
                  <Package className="h-4 w-4" />
                  {oid ? "Track your order" : "Preparing your order…"}
                  {oid && <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />}
                </a>
                <button
                  type="button"
                  onClick={downloadInvoice}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3 text-[13px] font-medium text-foreground/85 transition hover:bg-white/[0.05] hover:text-foreground active:scale-[0.99]"
                >
                  <Download className="h-4 w-4" />
                  Invoice
                </button>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3 text-[13px] font-medium text-foreground/85 transition hover:bg-white/[0.05] hover:text-foreground active:scale-[0.99]"
                >
                  <Home className="h-4 w-4" />
                  Home
                </Link>
              </div>
            </div>

            {/* RIGHT — Delivery */}
            <div className="space-y-5">
              {/* Estimated delivery */}
              <div
                className="animate-success-stagger rounded-2xl border border-white/[0.06] bg-white/[0.015] p-6 backdrop-blur-sm"
                style={{ animationDelay: "0.28s" }}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Estimated delivery
                  </h3>
                  <Clock className="h-4 w-4 text-muted-foreground/70" />
                </div>
                <p className="mt-3 font-display text-[1.55rem] font-semibold tracking-[-0.02em] text-foreground">
                  5 – 15 minutes
                </p>
                <p className="mt-1.5 text-[12.5px] leading-[1.55] text-muted-foreground">
                  Most orders are delivered automatically. During peak hours it may take slightly longer.
                </p>
                <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-white/[0.05]">
                  <div className="animate-delivery-progress h-full w-1/3 rounded-full bg-gradient-to-r from-emerald-400/70 to-emerald-300" />
                </div>
              </div>

              {/* Timeline */}
              <div
                className="animate-success-stagger rounded-2xl border border-white/[0.06] bg-white/[0.015] p-6 backdrop-blur-sm"
                style={{ animationDelay: "0.36s" }}
              >
                <h3 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Delivery timeline
                </h3>
                <div className="mt-5">
                  <TimelineRow
                    state="done"
                    label="Payment confirmed"
                    time={paidAt ? relativeTime(paidAt, now) : undefined}
                  />
                  <TimelineRow
                    state={waClickedAt ? "done" : "active"}
                    label={waClickedAt ? "Order request sent" : "Preparing your order"}
                    time={waClickedAt ? relativeTime(waClickedAt, now) : undefined}
                  />
                  <TimelineRow
                    state={waClickedAt ? "active" : "pending"}
                    label="Credentials delivered"
                    last
                  />
                </div>
              </div>

              {/* Trust footer */}
              <div
                className="animate-success-stagger flex items-center justify-between rounded-2xl border border-white/[0.05] bg-white/[0.01] px-5 py-4 text-[11.5px] text-muted-foreground"
                style={{ animationDelay: "0.44s" }}
              >
                <span className="inline-flex items-center gap-1.5">
                  <Lock className="h-3 w-3 text-emerald-400/80" />
                  Secured by SymDeals
                </span>
                <span>Need help? Reply on WhatsApp.</span>
              </div>
            </div>
          </section>
        </main>
      </div>
    );
  }



  // ------------- Default / loading / expired view -------------
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link to="/dashboard" aria-label="SymDeals home" className="group flex items-center">
            <img
              src={symdealsLogo}
              alt="SymDeals"
              className="h-5 w-auto object-contain transition-all duration-300 ease-out group-hover:scale-[1.03] sm:h-6"
              style={{ filter: "drop-shadow(0 0 6px rgba(0, 255, 170, 0.2))" }}
            />
          </Link>
          <Link
            to="/checkout"
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground/80 transition hover:bg-white/5"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Link>
        </div>
      </header>

      <main className="mx-auto flex max-w-xl flex-col items-center px-4 pb-24 pt-10 sm:px-6">
        <div className="w-full overflow-hidden rounded-2xl border border-border bg-white/[0.02] shadow-[0_20px_60px_-20px_rgba(0,0,0,0.5)]">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 border-b border-border px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-400/30">
                <span className="font-display text-[11px] font-bold tracking-wider">UPI</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">SymDeals</p>
                <p className="text-[11px] text-muted-foreground">
                  Scan & pay instantly
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
              <ShieldCheck className="h-3 w-3" />
              Secure
            </span>
          </div>

          {/* Title + amount */}
          <div className="px-6 pt-6">
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
              Scan QR to Pay
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Amount to pay:{" "}
              <span className="font-semibold text-foreground">
                ₹{amountDisplay}
              </span>
            </p>
          </div>

          {/* QR area */}
          <div className="px-6 py-6">
            <div className="relative mx-auto flex aspect-square w-full max-w-[320px] items-center justify-center rounded-2xl border border-border bg-gradient-to-br from-emerald-500/[0.06] to-transparent p-5">
              {/* Glow */}
              <div className="pointer-events-none absolute inset-0 rounded-2xl bg-emerald-400/[0.04] blur-2xl" />

              {creating ? (
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-400/30 border-t-emerald-400" />
                  <p className="text-xs">Generating secure QR…</p>
                </div>
              ) : createError ? (
                <div className="flex flex-col items-center gap-3 text-center">
                  <XCircle className="h-10 w-10 text-destructive" />
                  <p className="text-xs text-muted-foreground">{createError}</p>
                </div>
              ) : invoice ? (
                <div className="relative h-full w-full">
                  <img
                    src={`data:image/png;base64,${invoice.qr_base64}`}
                    alt="UPI Payment QR"
                    className={`h-full w-full rounded-xl bg-white p-3 shadow-lg transition-opacity duration-500 ${expired ? "opacity-30" : "opacity-100 animate-fade-up"}`}
                  />
                  {expired && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/70 backdrop-blur-sm">
                      <span className="rounded-full border border-destructive/40 bg-destructive/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-destructive">
                        Expired
                      </span>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* Download / Share QR actions */}
            {invoice && !expired && (
              <div className="mt-4 grid grid-cols-2 gap-2.5">
                <button
                  onClick={downloadQr}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-white/[0.03] px-4 py-2.5 text-xs font-semibold text-foreground transition-all duration-200 hover:border-emerald-400/40 hover:bg-emerald-400/[0.06] hover:text-emerald-300 active:scale-[0.98]"
                >
                  <Download className="h-3.5 w-3.5 text-emerald-400" />
                  Download QR
                </button>
                <button
                  onClick={() => void shareQr()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-white/[0.03] px-4 py-2.5 text-xs font-semibold text-foreground transition-all duration-200 hover:border-emerald-400/40 hover:bg-emerald-400/[0.06] hover:text-emerald-300 active:scale-[0.98]"
                >
                  <Share2 className="h-3.5 w-3.5 text-emerald-400" />
                  Share QR
                </button>
              </div>
            )}

            {/* Timer / status */}
            <div className="mt-5 flex items-center justify-between rounded-xl border border-border bg-background/40 px-4 py-3">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {expired ? "QR expired" : "QR expires in"}
              </span>
              {!expired && invoice && (
                <span
                  className={`font-mono text-sm font-semibold tabular-nums ${timerLow ? "animate-pulse text-destructive" : "text-emerald-400"}`}
                >
                  {timeLabel}
                </span>
              )}
              {expired && (
                <button
                  onClick={() => void generateQr()}
                  className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500 px-3 py-1.5 text-[11px] font-semibold text-emerald-950 transition hover:bg-emerald-400"
                >
                  <RefreshCw className="h-3 w-3" />
                  Regenerate
                </button>
              )}
            </div>

            {/* Pay via UPI app */}
            {invoice && !expired && (
              <button
                onClick={openUpiApp}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-white/[0.02] px-5 py-3 text-sm font-medium text-foreground transition hover:bg-white/[0.05] sm:hidden"
              >
                <Smartphone className="h-4 w-4 text-emerald-400" />
                Pay via UPI App
              </button>
            )}

            {/* Footer note */}
            <div className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
              <Lock className="h-3 w-3" />
              <span>Waiting for payment confirmation…</span>
            </div>
          </div>
        </div>

        {createError && (
          <button
            onClick={() => void generateQr()}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
        )}
      </main>
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono,
  highlight,
}: {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-[13px]">
      <span className="text-[11.5px] font-medium uppercase tracking-wider text-muted-foreground/80">{label}</span>
      <span
        className={[
          mono ? "font-mono text-[12px]" : "text-[13.5px]",
          highlight ? "font-display text-base font-bold text-emerald-400" : "font-semibold text-foreground",
          "max-w-[60%] truncate text-right",
        ].join(" ")}
      >
        {value}
      </span>
    </div>
  );
}

function CountUp({ value, duration = 900 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setDisplay(value);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(value * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <>{display.toFixed(2)}</>;
}

function formatClock(d: Date) {
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function relativeTime(d: Date, now: Date) {
  const diff = Math.max(0, now.getTime() - d.getTime());
  const s = Math.floor(diff / 1000);
  if (s < 45) return "Just now";
  const m = Math.floor(s / 60);
  if (m < 1) return "Just now";
  if (m === 1) return "1 min ago";
  if (m < 60) return `${m} mins ago`;
  const h = Math.floor(m / 60);
  return h === 1 ? "1 hr ago" : `${h} hrs ago`;
}

function TimelineRow({
  state,
  label,
  time,
  last,
}: {
  state: "done" | "active" | "pending";
  label: string;
  time?: string;
  last?: boolean;
}) {
  return (
    <div className="relative flex items-start gap-3 pb-3 last:pb-0">
      {!last && (
        <span className="absolute left-[7px] top-4 h-[calc(100%-12px)] w-px bg-white/[0.07]" />
      )}
      <span className="relative mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center">
        {state === "done" && (
          <span className="h-3.5 w-3.5 rounded-full bg-emerald-400/90 shadow-[0_0_10px_rgba(16,185,129,0.55)] ring-2 ring-emerald-400/20" />
        )}
        {state === "active" && (
          <>
            <span className="absolute inset-0 animate-ping rounded-full bg-amber-300/50" />
            <span className="relative h-3.5 w-3.5 rounded-full border border-amber-300/70 bg-amber-300/20" />
          </>
        )}
        {state === "pending" && (
          <span className="h-3 w-3 rounded-full border border-white/15 bg-white/[0.03]" />
        )}
      </span>
      <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
        <span
          className={
            state === "done"
              ? "text-[12.5px] font-medium text-foreground/90"
              : state === "active"
                ? "text-[12.5px] font-medium text-amber-200/90"
                : "text-[12.5px] text-muted-foreground/70"
          }
        >
          {label}
        </span>
        {time && (
          <span className="font-mono text-[10.5px] tabular-nums text-muted-foreground/70">
            {time}
          </span>
        )}
      </div>
    </div>
  );
}

