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
        <section className="relative overflow-hidden pt-32 pb-12 sm:pt-40 sm:pb-16">
          <div className="relative mx-auto max-w-6xl px-5 sm:px-6">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/50 px-2.5 py-[5px] backdrop-blur-md">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span className="text-[10.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  How it works
                </span>
              </div>
              <h1 className="mt-5 font-display text-[2.25rem] font-semibold leading-[1.05] tracking-[-0.04em] text-foreground sm:text-[3.25rem] sm:leading-[1.02] md:text-[3.75rem]">
                Premium streaming in{" "}
                <span className="text-gradient">three steps.</span>
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-[14.5px] leading-[1.65] text-muted-foreground sm:text-[15.5px]">
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
