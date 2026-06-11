import { createFileRoute } from "@tanstack/react-router";
import { Footer } from "@/components/Footer";
import { Features } from "@/components/Features";
import { CtaSection } from "@/components/CtaSection";

export const Route = createFileRoute("/_marketing/features")({
  component: FeaturesPage,
  head: () => ({
    meta: [
      { title: "Features — SymDeals" },
      {
        name: "description",
        content:
          "Explore the SymDeals platform: instant delivery engine, smart allocation, warranty protection, and secure access.",
      },
      { property: "og:title", content: "Features — SymDeals" },
      {
        property: "og:description",
        content:
          "Instant delivery, smart allocation, warranty protection, and secure access for premium OTT subscriptions.",
      },
    ],
  }),
});

function FeaturesPage() {
  return (
    <>
      <main>
        <section className="relative overflow-hidden border-b border-border pt-32 pb-16 md:pt-40 md:pb-20">
          <div className="absolute inset-0 bg-radial-glow" />
          <div className="absolute inset-0 grid-pattern" />
          <div className="relative mx-auto max-w-7xl px-6">
            <div className="max-w-3xl">
              <div className="label-uppercase">Platform Features</div>
              <h1 className="mt-3 font-display text-4xl font-bold tracking-[-0.03em] text-foreground md:text-5xl lg:text-6xl leading-[1.05]">
                Everything you need to{" "}
                <span className="text-gradient">stream smarter.</span>
              </h1>
              <p className="mt-5 max-w-xl text-[15px] leading-[1.65] text-muted-foreground md:text-base">
                A complete infrastructure for premium OTT access — engineered
                for speed, security, and trust.
              </p>
            </div>
          </div>
        </section>
        <Features />
        <CtaSection />
      </main>
      <Footer />
    </>
  );
}
