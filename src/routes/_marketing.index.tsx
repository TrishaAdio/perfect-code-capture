import { createFileRoute } from "@tanstack/react-router";
import { Hero } from "@/components/Hero";
import { Categories } from "@/components/Categories";
import { HomeFeatures } from "@/components/HomeFeatures";
import { TrustedBy } from "@/components/TrustedBy";
import { CtaSection } from "@/components/CtaSection";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/_marketing/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "SymDeals — Premium Digital Access. Instantly Delivered." },
      {
        name: "description",
        content:
          "Subscriptions, software, and premium services with instant automated delivery. Trusted by thousands. Warranty included.",
      },
      {
        property: "og:title",
        content: "SymDeals — Premium Digital Access. Instantly Delivered.",
      },
      {
        property: "og:description",
        content:
          "Subscriptions, software, and premium services with instant automated delivery.",
      },
    ],
  }),
});

function Index() {
  return (
    <>
      <main>
        <Hero />
        <Categories />
        <HomeFeatures />
        <TrustedBy />
        <CtaSection />
      </main>
      <Footer />
    </>
  );
}
