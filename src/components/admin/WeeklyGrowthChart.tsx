import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import {
  type AdminStatsRange,
  type AdminWeeklyPoint,
  fetchAdminWeeklyStats,
} from "@/lib/api";

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: AdminWeeklyPoint }>;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0];
  const count = point.value;
  const title = point.payload.dayFull || point.payload.label || point.payload.day;
  return (
    <div className="rounded-lg border border-border bg-background/95 px-3.5 py-2.5 shadow-xl backdrop-blur-sm">
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {title}
      </p>
      <p className="mt-1.5 flex items-baseline gap-1.5 text-[14px] font-bold text-foreground">
        <span className="font-display tabular-nums">{count.toLocaleString()}</span>
        <span className="text-[11.5px] font-medium text-muted-foreground">
          {count === 1 ? "user" : "users"}
        </span>
      </p>
    </div>
  );
}

export function WeeklyGrowthChart() {
  const [range, setRange] = useState<AdminStatsRange>("7d");
  const [data, setData] = useState<AdminWeeklyPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchAdminWeeklyStats(range);
        if (!cancelled) setData(res.data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [range]);

  const { total, deltaPct } = useMemo(() => {
    const total = data.reduce((s, d) => s + d.count, 0);
    const half = Math.floor(data.length / 2);
    const recent = data.slice(-half).reduce((s, d) => s + d.count, 0);
    const prev = data.slice(0, half).reduce((s, d) => s + d.count, 0);
    let deltaPct: number | null = null;
    if (prev > 0) deltaPct = ((recent - prev) / prev) * 100;
    else if (recent > 0) deltaPct = 100;
    return { total, deltaPct };
  }, [data]);

  // For 30d, only show every Nth tick so the axis stays clean.
  const tickInterval = range === "30d" ? 4 : 0;
  const dataKeyForAxis = range === "30d" ? "label" : "day";
  const animationKey = `${range}-${data.map((d) => d.count).join("-")}`;

  return (
    <div className="flex h-full min-h-[340px] flex-col rounded-lg border border-border bg-surface p-6 transition-colors hover:border-primary/30">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="inline-flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/15">
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-display text-[15px] font-bold tracking-tight text-foreground">
              Weekly Growth
            </h3>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">
              {range === "30d" ? "Last 30 days" : "Last 7 days"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!loading && (
            <div className="text-right">
              <div className="font-display text-[1.5rem] font-bold leading-none tracking-[-0.02em] text-foreground">
                {total.toLocaleString()}
              </div>
              {deltaPct !== null && (
                <span
                  className={`mt-1.5 inline-flex items-center gap-1 text-[10.5px] font-semibold ${
                    deltaPct >= 0 ? "text-primary" : "text-destructive"
                  }`}
                >
                  {deltaPct >= 0 ? (
                    <TrendingUp className="h-2.5 w-2.5" />
                  ) : (
                    <TrendingDown className="h-2.5 w-2.5" />
                  )}
                  {deltaPct >= 0 ? "+" : ""}
                  {deltaPct.toFixed(0)}% vs prior
                </span>
              )}
            </div>
          )}

          {/* 7D / 30D toggle */}
          <div
            role="tablist"
            aria-label="Time range"
            className="inline-flex rounded-md border border-border bg-background p-0.5"
          >
            {(["7d", "30d"] as const).map((r) => {
              const active = r === range;
              return (
                <button
                  key={r}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setRange(r)}
                  className={`rounded-[5px] px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.14em] transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {r === "7d" ? "7D" : "30D"}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="mt-6 h-[240px] w-full flex-1">
        {loading ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center text-[12.5px] text-destructive">
            {error}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              key={animationKey}
              data={data}
              margin={{ top: 12, right: 8, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="weeklyGrowthFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.4} />
                  <stop offset="60%" stopColor="var(--primary)" stopOpacity={0.08} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
                <filter id="weeklyGrowthGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <CartesianGrid
                stroke="var(--border)"
                strokeDasharray="2 6"
                vertical={false}
                opacity={0.5}
              />
              <XAxis
                dataKey={dataKeyForAxis}
                tickLine={false}
                axisLine={false}
                interval={tickInterval}
                tick={{
                  fill: "var(--muted-foreground)",
                  fontSize: 11,
                  fontWeight: 500,
                }}
                dy={8}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                width={28}
                tick={{
                  fill: "var(--muted-foreground)",
                  fontSize: 10.5,
                  opacity: 0.7,
                }}
              />
              <Tooltip
                cursor={{
                  stroke: "var(--primary)",
                  strokeWidth: 1,
                  strokeDasharray: "4 4",
                  opacity: 0.6,
                }}
                content={<CustomTooltip />}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="var(--primary)"
                strokeWidth={3}
                fill="url(#weeklyGrowthFill)"
                dot={false}
                activeDot={{
                  r: 5,
                  fill: "var(--primary)",
                  stroke: "var(--background)",
                  strokeWidth: 2.5,
                  filter: "url(#weeklyGrowthGlow)",
                }}
                style={{ filter: "drop-shadow(0 2px 8px color-mix(in oklab, var(--primary) 40%, transparent))" }}
                isAnimationActive
                animationDuration={900}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
