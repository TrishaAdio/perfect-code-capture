import { Zap, ShieldCheck, Lock, Headphones } from "lucide-react";
import { Section } from "@/components/Section";

const features = [
  {
    icon: Zap,
    title: "Instant Delivery",
    desc: "Credentials delivered in under 10 seconds — verified, encrypted, ready.",
  },
  {
    icon: ShieldCheck,
    title: "Warranty Included",
    desc: "Full coverage on every order — replace, refund, or extend, no questions.",
  },
  {
    icon: Lock,
    title: "Encrypted Sessions",
    desc: "End-to-end encryption and isolated sessions keep your account safe.",
  },
  {
    icon: Headphones,
    title: "24/7 Human Support",
    desc: "Real humans, fast replies. Live chat available around the clock.",
  },
];

export function HomeFeatures() {
  return (
    <Section
      eyebrow="Why SymDeals"
      title={
        <>
          Built for trust, speed,
          <br />
          and <span className="text-gradient-emerald">premium delivery.</span>
        </>
      }
      description="Engineered to feel effortless — every order is automated, verified, and backed by a real warranty."
      align="left"
      className="border-t border-border"
    >
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f, i) => {
          const Icon = f.icon;
          return (
            <div
              key={f.title}
              className="hover-lift group relative rounded-2xl border border-border bg-surface/60 p-7 shadow-card animate-fade-up"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background/60 transition-colors duration-200 group-hover:border-[var(--border-strong)]">
                <Icon className="h-4 w-4 text-foreground" />
              </div>
              <h3 className="mt-6 font-display text-[14.5px] font-semibold tracking-[-0.01em] text-foreground">
                {f.title}
              </h3>
              <p className="mt-2 text-[12.5px] leading-[1.6] text-muted-foreground">
                {f.desc}
              </p>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
