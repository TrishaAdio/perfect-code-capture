import { Star, ShieldCheck, RefreshCcw, Lock } from "lucide-react";
import { Section } from "@/components/Section";

const reviews = [
  {
    name: "Aarav Mehta",
    role: "Premium member · 8 months",
    text: "Activation took less than 30 seconds. Cleanest checkout I've used in this category.",
  },
  {
    name: "Sara Iyer",
    role: "Premium member · 1 year",
    text: "I had one issue with a renewal — replaced within minutes. Support actually replies.",
  },
  {
    name: "Rohan Khanna",
    role: "Premium member · 4 months",
    text: "Feels like a real SaaS product, not a reseller. The dashboard alone is worth it.",
  },
];

const stats = [
  { label: "Orders delivered", value: "120K+" },
  { label: "Avg. delivery", value: "9s" },
  { label: "Member rating", value: "4.9 / 5" },
  { label: "Refund SLA", value: "< 24h" },
];

const guarantees = [
  { icon: ShieldCheck, title: "Warranty Guarantee", desc: "Every order is covered for the full duration." },
  { icon: RefreshCcw, title: "Refund Policy", desc: "Hassle-free refunds within 24 hours, no questions." },
  { icon: Lock, title: "Secure Payments", desc: "PCI-grade processing with encrypted vaulting." },
];

export function TrustedBy() {
  return (
    <Section
      eyebrow="Trusted by thousands"
      title={
        <>
          Real reviews. Real numbers.
          <br />
          <span className="text-gradient-emerald">Real guarantees.</span>
        </>
      }
      align="left"
      className="border-t border-border"
    >
      {/* Stats */}
      <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-surface px-6 py-7">
            <div className="font-display text-[1.5rem] font-semibold tracking-[-0.02em] text-foreground md:text-[1.75rem]">
              {s.value}
            </div>
            <div className="mt-1.5 text-[12px] text-muted-foreground">
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Reviews */}
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {reviews.map((r, i) => (
          <figure
            key={r.name}
            className="hover-lift relative rounded-2xl border border-border bg-surface/60 p-7 shadow-card animate-fade-up"
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <div className="flex items-center gap-1 text-primary">
              {Array.from({ length: 5 }).map((_, k) => (
                <Star key={k} className="h-3.5 w-3.5 fill-current" />
              ))}
            </div>
            <blockquote className="mt-4 text-[13.5px] leading-[1.7] text-foreground/90">
              "{r.text}"
            </blockquote>
            <figcaption className="mt-5 border-t border-border pt-4">
              <div className="text-[13px] font-semibold text-foreground">
                {r.name}
              </div>
              <div className="text-[11.5px] text-muted-foreground">
                {r.role}
              </div>
            </figcaption>
          </figure>
        ))}
      </div>

      {/* Guarantees */}
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {guarantees.map((g) => {
          const Icon = g.icon;
          return (
            <div
              key={g.title}
              className="flex items-start gap-4 rounded-2xl border border-border bg-surface/60 p-6"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background/60">
                <Icon className="h-4 w-4 text-foreground/85" />
              </div>
              <div>
                <div className="font-display text-[13.5px] font-semibold tracking-[-0.005em] text-foreground">
                  {g.title}
                </div>
                <div className="mt-1 text-[12.5px] leading-[1.55] text-muted-foreground">
                  {g.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
