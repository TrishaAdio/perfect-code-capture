import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import symdealsLogo from "@/assets/symdeals-logo.png";

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

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link to="/" aria-label="SymDeals home" className="group flex items-center">
            <img
              src={symdealsLogo}
              alt="SymDeals"
              className="h-5 w-auto object-contain transition-all duration-300 ease-out group-hover:scale-[1.03] sm:h-6"
              style={{ filter: "drop-shadow(0 0 6px rgba(0, 255, 170, 0.2))" }}
            />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1">
          <ShieldCheck className="h-3 w-3 text-primary" />
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Legal
          </span>
        </div>
        <h1 className="mt-5 font-display text-[2rem] font-bold tracking-[-0.02em] text-foreground">
          Privacy Policy
        </h1>
        <p className="mt-2 text-[13px] text-muted-foreground">
          Last updated: April 2026
        </p>

        <div className="mt-10 space-y-8 text-[14px] leading-relaxed text-muted-foreground">
          <section>
            <h2 className="font-display text-[18px] font-semibold text-foreground">
              1. Information We Collect
            </h2>
            <p className="mt-2">
              We collect your name, email address, and order details when you
              create an account or purchase a subscription. We do not store
              payment card details — payments are processed by trusted third
              parties.
            </p>
          </section>

          <section>
            <h2 className="font-display text-[18px] font-semibold text-foreground">
              2. How We Use Your Data
            </h2>
            <p className="mt-2">
              Your data is used to fulfil your orders, deliver subscription
              credentials, provide support, and send important account updates.
              We never sell your personal information.
            </p>
          </section>

          <section>
            <h2 className="font-display text-[18px] font-semibold text-foreground">
              3. Data Security
            </h2>
            <p className="mt-2">
              Passwords are hashed with industry-standard algorithms. All
              traffic is encrypted in transit using HTTPS. Access to user data
              is restricted to authorized staff only.
            </p>
          </section>

          <section>
            <h2 className="font-display text-[18px] font-semibold text-foreground">
              4. Your Rights
            </h2>
            <p className="mt-2">
              You may request access, correction, or deletion of your personal
              data at any time by contacting our support team.
            </p>
          </section>

          <section>
            <h2 className="font-display text-[18px] font-semibold text-foreground">
              5. Contact
            </h2>
            <p className="mt-2">
              For privacy questions, reach us via the{" "}
              <Link to="/support" className="text-primary hover:underline">
                Support page
              </Link>
              .
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
