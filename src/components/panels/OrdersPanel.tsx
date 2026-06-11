import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  Clock,
  Copy,
  Inbox,
  Loader2,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import {
  type Order,
  type OrderStatus,
  fetchMyOrders,
  verifyOrderStatus,
} from "@/lib/api";
import { ServiceLogo } from "@/components/ServiceLogo";
import { toast } from "sonner";

const POLL_MS = 5000;

export function OrdersPanel({ onBrowse }: { onBrowse?: () => void }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ordersRef = useRef<Order[]>([]);
  ordersRef.current = orders;
  const hasPendingOrders = orders.some((o) => o.status === "PROCESSING");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetchMyOrders();
        if (!cancelled) setOrders(res.orders);
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to load orders");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hasPendingOrders) {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }
    if (pollRef.current) return;
    const tick = async () => {
      const pending = ordersRef.current.filter((o) => o.status === "PROCESSING");
      const updates = await Promise.all(
        pending.map(async (o) => {
          try {
            const r = await verifyOrderStatus(o.orderId);
            return { orderId: o.orderId, status: r.status };
          } catch {
            return null;
          }
        })
      );
      const map = new Map<string, OrderStatus>();
      for (const u of updates) if (u) map.set(u.orderId, u.status);
      if (map.size === 0) return;
      setOrders((prev) => {
        let changed = false;
        const next = prev.map((o) => {
          const status = map.get(o.orderId);
          if (!status || status === o.status) return o;
          changed = true;
          return { ...o, status };
        });
        return changed ? next : prev;
      });
    };
    pollRef.current = setInterval(() => void tick(), POLL_MS);
    void tick();
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [hasPendingOrders]);

  const completedCount = orders.filter((o) => o.status === "COMPLETED").length;
  const processingCount = orders.filter((o) => o.status === "PROCESSING").length;

  return (
    <div>
      <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1">
        <ShoppingBag className="h-3 w-3 text-primary" />
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Your Orders
        </span>
      </div>
      <h1 className="mt-5 font-display text-[2rem] font-semibold tracking-[-0.025em] text-foreground">
        My Orders
      </h1>
      <p className="mt-2 text-[14px] text-muted-foreground">
        Track and manage all your SymDeals purchases.
      </p>

      {!loading && !error && orders.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          <Stat label="Total" value={orders.length} />
          <Stat label="Completed" value={completedCount} tone="emerald" />
          {processingCount > 0 && (
            <Stat label="Processing" value={processingCount} tone="amber" />
          )}
        </div>
      )}

      <div className="mt-7">
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-2xl border border-border bg-surface/60"
              />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">
            {error}
          </div>
        ) : orders.length === 0 ? (
          <EmptyOrders onBrowse={onBrowse} />
        ) : (
          <div className="space-y-3 sm:space-y-3.5">
            {orders.map((o) => (
              <OrderCard
                key={o.id}
                order={o}
                open={openId === o.id}
                onToggle={() => setOpenId(openId === o.id ? null : o.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "emerald" | "amber";
}) {
  const colors =
    tone === "emerald"
      ? "border-emerald-400/25 bg-emerald-400/5 text-emerald-300"
      : tone === "amber"
        ? "border-amber-400/25 bg-amber-400/5 text-amber-300"
        : "border-border bg-surface/60 text-foreground";
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11.5px] font-semibold ${colors}`}
    >
      <span className="opacity-70 uppercase tracking-[0.12em] text-[10px]">
        {label}
      </span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

function OrderCard({
  order,
  open,
  onToggle,
}: {
  order: Order;
  open: boolean;
  onToggle: () => void;
}) {
  const completed = order.status === "COMPLETED";
  const failed = order.status === "FAILED";
  const accent = completed
    ? "before:bg-gradient-to-b before:from-emerald-400 before:to-emerald-500/40"
    : failed
      ? "before:bg-gradient-to-b before:from-destructive before:to-destructive/30"
      : "before:bg-gradient-to-b before:from-amber-300 before:to-amber-500/30 before:animate-accent-pulse";

  const ring = completed
    ? "hover:border-emerald-400/40 hover:shadow-[0_8px_30px_-10px_rgba(16,185,129,0.45)]"
    : failed
      ? "hover:border-destructive/40"
      : "hover:border-amber-400/40 hover:shadow-[0_8px_30px_-10px_rgba(251,191,36,0.35)]";

  return (
    <article
      className={`group relative overflow-hidden rounded-2xl border border-border bg-surface/60 transition-all duration-300 will-change-transform hover:-translate-y-[1px] active:translate-y-0 active:scale-[0.997] ${ring} before:absolute before:left-0 before:top-3 before:bottom-3 before:w-[3px] before:rounded-r-full ${accent}`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-4 p-4 pl-5 text-left sm:gap-5 sm:p-5 sm:pl-6"
      >
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-border bg-background sm:h-14 sm:w-14">
          <ServiceLogo
            src={order.productImage}
            name={order.productName}
            className="h-full w-full object-cover"
            iconClass="h-5 w-5"
          />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-[15px] font-semibold tracking-tight text-foreground sm:text-[16.5px]">
            {order.productName}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-muted-foreground/80">
            <span className="font-mono text-[10.5px] uppercase tracking-wider opacity-70">
              {order.orderId}
            </span>
            <span className="opacity-40">•</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatRelative(order.createdAt)}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5 sm:flex-row sm:items-center sm:gap-4">
          <div className="text-right">
            <div className="font-display text-[15px] font-semibold tabular-nums text-foreground sm:text-[16px]">
              ₹{order.amount.toLocaleString()}
            </div>
            {(order.savings ?? 0) > 0 && (
              <div className="mt-0.5 text-[10.5px] font-medium tabular-nums text-emerald-300/80">
                Saved ₹{order.savings!.toLocaleString()}
              </div>
            )}
          </div>
          <StatusPill status={order.status} />
          <ChevronDown
            className={`hidden h-4 w-4 text-muted-foreground transition-transform duration-300 sm:block ${
              open ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      <div
        className={`grid overflow-hidden transition-[grid-template-rows] duration-400 ease-out ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="min-h-0">
          <div className="border-t border-border/60 px-5 pb-5 pt-4 sm:px-6">
            <div className="grid gap-3 text-[12.5px] sm:grid-cols-2">
              <DetailRow label="Order ID" value={order.orderId} copyable />
              {order.invoiceId && (
                <DetailRow label="Invoice" value={order.invoiceId} />
              )}
              <DetailRow
                label="Placed"
                value={formatAbsolute(order.createdAt)}
              />
              <DetailRow
                label="Amount"
                value={`₹${order.amount.toLocaleString()}`}
              />
              {(order.savings ?? 0) > 0 && (
                <DetailRow
                  label="You saved"
                  value={`₹${order.savings!.toLocaleString()}`}
                />
              )}
            </div>

            <div
              className={`mt-4 flex items-start gap-2.5 rounded-xl border p-3 text-[12px] ${
                completed
                  ? "border-emerald-400/20 bg-emerald-400/5 text-emerald-200/90"
                  : failed
                    ? "border-destructive/25 bg-destructive/5 text-destructive"
                    : "border-amber-400/20 bg-amber-400/5 text-amber-200/90"
              }`}
            >
              {completed ? (
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              ) : failed ? (
                <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              ) : (
                <Loader2 className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin" />
              )}
              <p className="leading-relaxed">
                {completed
                  ? "Access delivered. Check your registered email or chat with support if you need delivery details."
                  : failed
                    ? "This order could not be completed. Please contact support for a refund or retry."
                    : "Delivery in progress — usually completes within minutes. We'll update this card automatically."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function DetailRow({
  label,
  value,
  copyable,
}: {
  label: string;
  value: string;
  copyable?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-background/40 px-3 py-2">
      <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      <div className="flex min-w-0 items-center gap-1.5">
        <span className="truncate font-mono text-[11.5px] text-foreground">
          {value}
        </span>
        {copyable && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(value).then(
                () => toast.success("Copied"),
                () => toast.error("Copy failed")
              );
            }}
            className="rounded p-1 text-muted-foreground transition hover:bg-surface hover:text-foreground"
            aria-label="Copy"
          >
            <Copy className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: OrderStatus }) {
  if (status === "COMPLETED") {
    return (
      <div className="inline-flex animate-fade-in items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-wider text-emerald-300">
        <CheckCircle2 className="h-3 w-3" />
        Access Delivered
      </div>
    );
  }
  if (status === "FAILED") {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/10 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-wider text-destructive">
        Failed
      </div>
    );
  }
  return (
    <div className="relative inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-wider text-amber-300">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
      </span>
      Delivery in Progress
    </div>
  );
}

function EmptyOrders({ onBrowse }: { onBrowse?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface/40 px-6 py-16 text-center">
      <Inbox className="h-8 w-8 text-muted-foreground/60" />
      <p className="mt-3 text-[14px] font-semibold text-foreground">No orders yet</p>
      <p className="mt-1 text-[12.5px] text-muted-foreground">
        Your purchases will appear here once you make your first order.
      </p>
      {onBrowse && (
        <button
          onClick={onBrowse}
          className="mt-5 inline-flex items-center rounded-full bg-primary px-5 py-2 text-[12.5px] font-bold uppercase tracking-[0.12em] text-primary-foreground hover:bg-[var(--primary-hover)]"
        >
          Browse Products
        </button>
      )}
    </div>
  );
}

function formatRelative(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  const diff = Date.now() - d.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "Just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min${min === 1 ? "" : "s"} ago`;
  const hr = Math.floor(min / 60);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday)
    return `Today at ${d.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    })}`;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString())
    return `Yesterday at ${d.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    })}`;
  if (hr < 24 * 7) {
    const days = Math.floor(hr / 24);
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }
  return d.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: d.getFullYear() === now.getFullYear() ? undefined : "numeric",
  });
}

function formatAbsolute(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
