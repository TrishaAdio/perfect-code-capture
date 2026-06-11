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
      <main className="mx-auto max-w-3xl px-5 pt-32 pb-20 sm:px-6 sm:pt-40">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/50 px-2.5 py-[5px] backdrop-blur-md">
            <HelpCircle className="h-3 w-3 text-primary" />
            <span className="text-[10.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Help center
            </span>
          </div>
          <h1 className="mt-5 font-display text-[2rem] font-semibold tracking-[-0.035em] text-foreground sm:text-[2.75rem] sm:leading-[1.05]">
            Frequently asked questions
          </h1>
          <p className="mx-auto mt-4 max-w-md text-[14.5px] leading-[1.65] text-muted-foreground sm:text-[15.5px]">
            Everything you need to know about SymDeals.
          </p>
        </div>

        <div className="mt-12 space-y-3">
          {faqs.map((item) => (
            <details
              key={item.q}
              className="group rounded-xl border border-border bg-surface/60 px-5 py-4 transition-colors duration-200 hover:border-[var(--border-strong)]"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-[14px] font-semibold tracking-[-0.005em] text-foreground">
                {item.q}
                <span className="text-muted-foreground transition-transform duration-200 group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-[13px] leading-[1.65] text-muted-foreground">
                {item.a}
              </p>
            </details>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-border bg-surface/60 p-7 text-center">
          <p className="text-[13.5px] text-muted-foreground">
            Still have questions?
          </p>
          <Link
            to="/support"
            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-foreground px-5 py-2 text-[12.5px] font-semibold tracking-[-0.005em] text-background shadow-[0_1px_0_rgba(255,255,255,0.18)_inset,0_1px_2px_rgba(0,0,0,0.45)] transition-[background-color,transform] duration-150 hover:bg-foreground/92 active:scale-[0.985]"
          >
            Contact support
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
