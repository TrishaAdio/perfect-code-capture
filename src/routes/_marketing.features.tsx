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
        <section className="relative overflow-hidden pt-32 pb-12 sm:pt-40 sm:pb-16">
          <div className="relative mx-auto max-w-6xl px-5 sm:px-6">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/50 px-2.5 py-[5px] backdrop-blur-md">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span className="text-[10.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Platform features
                </span>
              </div>
              <h1 className="mt-5 font-display text-[2.25rem] font-semibold leading-[1.05] tracking-[-0.04em] text-foreground sm:text-[3.25rem] sm:leading-[1.02] md:text-[3.75rem]">
                Everything you need to{" "}
                <span className="text-gradient">stream smarter.</span>
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-[14.5px] leading-[1.65] text-muted-foreground sm:text-[15.5px]">
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
