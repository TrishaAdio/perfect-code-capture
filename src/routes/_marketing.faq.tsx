import { createFileRoute, Link } from "@tanstack/react-router";
import { HelpCircle } from "lucide-react";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/_marketing/faq")({
  component: FaqPage,
  head: () => ({
    meta: [
      { title: "FAQ — SymDeals" },
      {
        name: "description",
        content: "Answers to common questions about SymDeals subscriptions.",
      },
    ],
  }),
});

const faqs = [
  {
    q: "How do I receive my subscription after payment?",
    a: "After completing payment, send your Order ID on WhatsApp to our support team. You will receive your credentials within minutes during business hours.",
  },
  {
    q: "Are these subscriptions genuine?",
    a: "Yes. All our subscriptions are sourced legitimately and come with a working guarantee for the entire duration.",
  },
  {
    q: "What if my subscription stops working?",
    a: "We offer a full replacement or refund if your subscription stops working within the validity period. Just contact support with your Order ID.",
  },
  {
    q: "Can I share my account with others?",
    a: "Sharing depends on the platform's terms. We recommend using the subscription only on the number of devices allowed by the original service.",
  },
  {
    q: "Which payment methods do you accept?",
    a: "We accept UPI, net banking, and major debit/credit cards through our secure payment gateway.",
  },
];

function FaqPage() {
  return (
    <>
      <main className="mx-auto max-w-3xl px-6 pt-32 pb-16 md:pt-40">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1">
          <HelpCircle className="h-3 w-3 text-primary" />
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Help Center
          </span>
        </div>
        <h1 className="mt-5 font-display text-[2rem] font-bold tracking-[-0.02em] text-foreground md:text-[2.5rem]">
          Frequently Asked Questions
        </h1>
        <p className="mt-2 text-[14px] text-muted-foreground">
          Everything you need to know about SymDeals.
        </p>

        <div className="mt-10 space-y-4">
          {faqs.map((item) => (
            <details
              key={item.q}
              className="group rounded-lg border border-border bg-surface px-5 py-4 transition-colors hover:border-muted-foreground/30"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-[14.5px] font-semibold text-foreground">
                {item.q}
                <span className="text-muted-foreground transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-[13.5px] leading-relaxed text-muted-foreground">
                {item.a}
              </p>
            </details>
          ))}
        </div>

        <div className="mt-10 rounded-lg border border-border bg-surface p-6 text-center">
          <p className="text-[13.5px] text-muted-foreground">
            Still have questions?
          </p>
          <Link
            to="/support"
            className="mt-3 inline-flex items-center rounded-full bg-primary px-5 py-2 text-[12.5px] font-bold uppercase tracking-[0.12em] text-primary-foreground hover:bg-[var(--primary-hover)]"
          >
            Contact Support
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
