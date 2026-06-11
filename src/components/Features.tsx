import { Zap, Cpu, ShieldCheck, Lock, ArrowUpRight } from "lucide-react";
import { Section } from "@/components/Section";

export function Features() {
  return (
    <Section
      eyebrow="Built for trust"
      title={
        <>
          Engineered for speed,
          <br />
          <span className="text-gradient">security, and scale.</span>
        </>
      }
      description="A meticulously crafted infrastructure designed to deliver premium experiences without compromise."
      align="left"
      className="border-b border-border"
    >
      <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-2">
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
    </Section>
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
    <div className="group relative bg-surface p-8 transition-colors duration-200 hover:bg-surface-elevated">
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-[18px] w-[18px] text-primary" strokeWidth={2} />
        </div>
        <ArrowUpRight className="h-4 w-4 text-muted-foreground/40 transition-colors duration-200 group-hover:text-primary" />
      </div>
      <h3 className="mt-6 font-display text-[15.5px] font-semibold tracking-[-0.01em] text-foreground">
        {title}
      </h3>
      <p className="mt-2 text-[13px] leading-[1.6] text-muted-foreground">
        {desc}
      </p>
    </div>
  );
}
