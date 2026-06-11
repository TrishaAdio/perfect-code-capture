import { createFileRoute } from "@tanstack/react-router";
import { Footer } from "@/components/Footer";
import { HowItWorks } from "@/components/HowItWorks";
import { CtaSection } from "@/components/CtaSection";

export const Route = createFileRoute("/_marketing/how-it-works")({
  component: HowItWorksPage,
  head: () => ({
    meta: [
      { title: "How It Works — SymDeals" },
      {
        name: "description",
        content:
          "From signup to streaming in three simple steps. Learn how SymDeals delivers premium OTT access instantly.",
      },
      { property: "og:title", content: "How It Works — SymDeals" },
      {
        property: "og:description",
        content:
          "Sign up, choose a plan, get instant access. Premium OTT in under a minute.",
      },
    ],
  }),
});

function HowItWorksPage() {
  return (
    <>
      <main>
        <section className="relative overflow-hidden border-b border-border pt-32 pb-16 md:pt-40 md:pb-20">
          <div className="absolute inset-0 bg-radial-glow" />
          <div className="absolute inset-0 grid-pattern" />
          <div className="relative mx-auto max-w-7xl px-6">
            <div className="max-w-3xl">
              <div className="label-uppercase">How It Works</div>
              <h1 className="mt-3 font-display text-4xl font-bold tracking-[-0.03em] text-foreground md:text-5xl lg:text-6xl leading-[1.05]">
                Premium streaming in{" "}
                <span className="text-gradient">three steps.</span>
              </h1>
              <p className="mt-5 max-w-xl text-[15px] leading-[1.65] text-muted-foreground md:text-base">
                Built to be effortless. From signup to streaming, the entire
                flow takes less than a minute.
              </p>
            </div>
          </div>
        </section>
        <HowItWorks />
        <CtaSection />
      </main>
      <Footer />
    </>
  );
}
