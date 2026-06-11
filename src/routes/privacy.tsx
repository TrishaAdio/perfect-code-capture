import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
  head: () => ({
    meta: [
      { title: "Privacy Policy — SymDeals" },
      {
        name: "description",
        content: "How SymDeals collects, uses, and protects your data.",
      },
    ],
  }),
});

const sections = [
  {
    title: "1. Information we collect",
    body: "We collect your name, email address, and order details when you create an account or purchase a subscription. We do not store payment card details — payments are processed by trusted third parties.",
  },
  {
    title: "2. How we use your data",
    body: "Your data is used to fulfil your orders, deliver subscription credentials, provide support, and send important account updates. We never sell your personal information.",
  },
  {
    title: "3. Data security",
    body: "Passwords are hashed with industry-standard algorithms. All traffic is encrypted in transit using HTTPS. Access to user data is restricted to authorized staff only.",
  },
  {
    title: "4. Your rights",
    body: "You may request access, correction, or deletion of your personal data at any time by contacting our support team.",
  },
];

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 pt-32 pb-20 sm:px-6 sm:pt-40">
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-surface/50 px-2.5 py-[5px] backdrop-blur-sm">
            <ShieldCheck className="h-3 w-3 text-primary" />
            <span className="text-[10.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Legal
            </span>
          </div>
          <h1 className="mt-5 font-display text-[2rem] font-semibold leading-[1.05] tracking-[-0.035em] text-foreground sm:text-[2.75rem]">
            Privacy policy
          </h1>
          <p className="mt-3 text-[12.5px] text-muted-foreground">
            Last updated April 2026
          </p>
        </div>

        <div className="mt-12 space-y-3">
          {sections.map((s) => (
            <section
              key={s.title}
              className="rounded-2xl border border-[var(--border)] bg-surface/50 p-6 backdrop-blur-sm sm:p-7"
            >
              <h2 className="font-display text-[15px] font-semibold tracking-[-0.02em] text-foreground sm:text-[16px]">
                {s.title}
              </h2>
              <p className="mt-2.5 text-[13.5px] leading-[1.7] text-muted-foreground">
                {s.body}
              </p>
            </section>
          ))}

          <section className="rounded-2xl border border-[var(--border)] bg-surface/50 p-6 backdrop-blur-sm sm:p-7">
            <h2 className="font-display text-[15px] font-semibold tracking-[-0.02em] text-foreground sm:text-[16px]">
              5. Contact
            </h2>
            <p className="mt-2.5 text-[13.5px] leading-[1.7] text-muted-foreground">
              For privacy questions, reach us via the{" "}
              <Link to="/support" className="text-primary underline-offset-2 hover:underline">
                Support page
              </Link>
              .
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
