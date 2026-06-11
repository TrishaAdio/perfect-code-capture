import { UserPlus, LayoutGrid, Rocket } from "lucide-react";
import { Section } from "@/components/Section";

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
    <Section
      eyebrow="How it works"
      title={
        <>
          From signup to streaming
          <br />
          <span className="text-gradient">in three steps.</span>
        </>
      }
      align="left"
      className="border-b border-border"
    >
      <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-3">
        {steps.map((s, i) => {
          const Icon = s.icon;
          return (
            <div
              key={s.title}
              className="relative bg-surface p-8 transition-colors duration-200 hover:bg-surface-elevated"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-[18px] w-[18px] text-primary" strokeWidth={2} />
                </div>
                <span className="font-mono text-[11px] font-semibold text-muted-foreground">
                  0{i + 1}
                </span>
              </div>
              <h3 className="mt-6 font-display text-[15.5px] font-semibold tracking-[-0.01em] text-foreground">
                {s.title}
              </h3>
              <p className="mt-2 text-[13px] leading-[1.6] text-muted-foreground">
                {s.desc}
              </p>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
