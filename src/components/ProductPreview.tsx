import { Check, Monitor, Play, Tv } from "lucide-react";

const products = [
  {
    name: "Stream+",
    tag: "Cinematic",
    icon: Play,
    accent: "from-[oklch(0.55_0.22_15)] to-[oklch(0.6_0.25_25)]",
    glow: "oklch(0.6 0.25 20)",
  },
  {
    name: "PrimeFlow",
    tag: "All-in-one",
    icon: Tv,
    accent: "from-[oklch(0.55_0.22_240)] to-[oklch(0.65_0.2_220)]",
    glow: "oklch(0.6 0.22 230)",
  },
  {
    name: "TubeMax",
    tag: "Ad-free",
    icon: Monitor,
    accent: "from-[oklch(0.55_0.22_350)] to-[oklch(0.6_0.2_30)]",
    glow: "oklch(0.6 0.22 0)",
  },
];

export function ProductPreview() {
  return (
    <section className="relative py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            Curated Catalog
          </div>
          <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
            One platform.{" "}
            <span className="text-gradient">Every premium service.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground md:text-lg">
            Hand-picked, optimized plans across the world's top streaming platforms — delivered
            instantly with full warranty coverage.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {products.map((p, i) => {
            const Icon = p.icon;
            return (
              <div
                key={p.name}
                className="group relative animate-fade-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div
                  className="absolute -inset-1 rounded-3xl opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-60"
                  style={{ background: p.glow }}
                />
                <div className="glass-strong glow-border relative overflow-hidden rounded-3xl p-6 transition-all duration-500 group-hover:-translate-y-2 shadow-soft">
                  {/* Visual top */}
                  <div
                    className={`relative aspect-[16/10] overflow-hidden rounded-2xl bg-gradient-to-br ${p.accent}`}
                  >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,oklch(1_0_0/0.3),transparent_60%)]" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Icon className="h-14 w-14 text-white/90 drop-shadow-lg" strokeWidth={1.5} />
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                      <span className="rounded-full bg-black/30 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
                        {p.tag}
                      </span>
                      <span className="rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
                        UHD
                      </span>
                    </div>
                  </div>

                  <div className="mt-5">
                    <h3 className="font-display text-xl font-bold">{p.name}</h3>
                    <ul className="mt-4 space-y-2.5">
                      {["UHD 4K Access", "1 Premium Profile", "Instant Delivery"].map((f) => (
                        <li key={f} className="flex items-center gap-2.5 text-sm text-foreground/80">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10">
                            <Check className="h-3 w-3 text-primary" strokeWidth={3} />
                          </span>
                          {f}
                        </li>
                      ))}
                    </ul>

                    <button className="mt-6 w-full rounded-xl border border-border bg-white py-2.5 text-sm font-semibold text-foreground transition-all hover:bg-foreground hover:text-background">
                      Unlock Access
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
