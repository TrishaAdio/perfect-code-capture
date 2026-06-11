import { UserPlus, LayoutGrid, Rocket } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    title: "Sign Up",
    desc: "Create your free account in under 30 seconds. No card required.",
  },
  {
    icon: LayoutGrid,
    title: "Choose Plan",
    desc: "Browse curated plans tailored to your usage and budget.",
  },
  {
    icon: Rocket,
    title: "Get Instant Access",
    desc: "Receive credentials in seconds. Stream immediately on any device.",
  },
];

export function HowItWorks() {
  return (
    <section className="relative border-b border-border py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-2xl">
          <div className="label-uppercase">How It Works</div>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-[-0.02em] text-foreground md:text-4xl lg:text-[2.75rem] leading-[1.1]">
            From signup to streaming
            <br />
            <span className="text-gradient">in three steps.</span>
          </h2>
        </div>

        <div className="mt-14 grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-3">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={s.title}
                className="relative bg-surface p-8 transition-colors hover:bg-surface-elevated"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                    <Icon className="h-4.5 w-4.5 text-primary" strokeWidth={2} />
                  </div>
                  <span className="font-mono text-[11px] font-semibold text-muted-foreground">
                    0{i + 1}
                  </span>
                </div>
                <h3 className="mt-6 font-display text-lg font-semibold tracking-tight text-foreground">
                  {s.title}
                </h3>
                <p className="mt-2 text-[13px] leading-[1.6] text-muted-foreground">
                  {s.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
