import { useEffect, useRef, useState } from "react";

function Counter({ end, suffix = "" }: { end: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !started.current) {
          started.current = true;
          const duration = 1600;
          const start = performance.now();
          const tick = (now: number) => {
            const t = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - t, 3);
            setVal(Math.floor(end * eased));
            if (t < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      });
    });
    obs.observe(node);
    return () => obs.disconnect();
  }, [end]);

  return (
    <span ref={ref}>
      {val.toLocaleString()}
      {suffix}
    </span>
  );
}

const stats = [
  { label: "Uptime", value: 99.98, suffix: "%", display: "Last 90 days" },
  { label: "Active Users", value: 50000, suffix: "+", display: "And growing" },
  { label: "Support", value: 24, suffix: "/7", display: "Always online" },
];

export function TrustSection() {
  return (
    <section className="relative border-b border-border py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="bg-surface p-8">
              <div className="label-uppercase">{s.label}</div>
              <div className="mt-3 font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                <Counter end={s.value} suffix={s.suffix} />
              </div>
              <div className="mt-2 text-[12px] text-muted-foreground">
                {s.display}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
