import { Zap, Cpu, ShieldCheck, Lock, ArrowUpRight } from "lucide-react";

export function Features() {
  return (
    <section className="relative border-b border-border py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-2xl">
          <div className="label-uppercase">Built for trust</div>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-[-0.02em] text-foreground md:text-4xl lg:text-[2.75rem] leading-[1.1]">
            Engineered for speed,
            <br />
            <span className="text-gradient">security, and scale.</span>
          </h2>
          <p className="mt-4 max-w-lg text-[14px] leading-[1.65] text-muted-foreground">
            A meticulously crafted infrastructure designed to deliver premium
            experiences without compromise.
          </p>
        </div>

        <div className="mt-14 grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-2">
          <FeatureCard
            icon={Zap}
            title="Instant Delivery Engine"
            desc="Our proprietary fulfillment pipeline activates your access in under 10 seconds — verified, encrypted, and ready to stream."
          />
          <FeatureCard
            icon={Cpu}
            title="Smart Allocation"
            desc="AI-powered system matches you with the optimal plan in real-time."
          />
          <FeatureCard
            icon={ShieldCheck}
            title="Warranty Protection"
            desc="Full coverage on every plan. We replace, refund, or extend — instantly."
          />
          <FeatureCard
            icon={Lock}
            title="Secure Access Layer"
            desc="End-to-end encryption, isolated sessions, and zero-knowledge credential vault keep your access permanently safe."
          />
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  desc: string;
}) {
  return (
    <div className="group relative bg-surface p-8 transition-colors hover:bg-surface-elevated">
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
          <Icon className="h-4.5 w-4.5 text-primary" strokeWidth={2} />
        </div>
        <ArrowUpRight className="h-4 w-4 text-muted-foreground/40 transition-all group-hover:text-primary" />
      </div>
      <h3 className="mt-6 font-display text-lg font-semibold tracking-tight text-foreground">
        {title}
      </h3>
      <p className="mt-2 text-[13px] leading-[1.6] text-muted-foreground">
        {desc}
      </p>
    </div>
  );
}
