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
    title: "1. Information We Collect",
    body: [
      "We may collect the following information:",
      "",
      "Account Information — Full Name, Email Address, Account Preferences, Login Information.",
      "Transaction Information — Order IDs, Products Purchased, Purchase Dates, Payment Status, Subscription Details.",
      "Technical Information — Device Information, Browser Type, Operating System, IP Address, Session Information, Website Usage Data.",
      "Communication Information — Support Requests, Feedback, Messages sent to our support team.",
    ],
  },
  {
    title: "2. How We Use Your Information",
    body: [
      "We use collected information to:",
      "",
      "Create and manage your account.",
      "Process orders and subscriptions.",
      "Deliver purchased products and services.",
      "Provide customer support.",
      "Improve website functionality.",
      "Prevent fraud and abuse.",
      "Enhance security.",
      "Send important account notifications.",
      "Comply with legal obligations.",
    ],
  },
  {
    title: "3. Account Security",
    body: [
      "We implement industry-standard security measures designed to protect user information.",
      "",
      "These include:",
      "",
      "Secure authentication systems.",
      "Encrypted communications.",
      "Access controls.",
      "Security monitoring.",
      "Rate limiting and abuse prevention measures.",
      "",
      "While we work to protect your information, no online system can guarantee absolute security.",
    ],
  },
  {
    title: "4. Cookies and Similar Technologies",
    body: [
      "SymDeals may use cookies and similar technologies to:",
      "",
      "Maintain user sessions.",
      "Remember preferences.",
      "Improve website performance.",
      "Analyze website usage.",
      "Enhance user experience.",
      "",
      "You may manage cookie settings through your browser.",
    ],
  },
  {
    title: "5. Payments",
    body: [
      "SymDeals does not store sensitive payment credentials such as card numbers.",
      "",
      "Payments may be processed through trusted third-party payment providers.",
      "Payment providers are responsible for processing and securing payment information according to their own policies.",
    ],
  },
  {
    title: "6. Sharing of Information",
    body: [
      "We do not sell personal information.",
      "",
      "Information may only be shared:",
      "",
      "With service providers required to operate our services.",
      "For payment processing.",
      "For security and fraud prevention.",
      "When required by law.",
      "To protect our rights and users.",
    ],
  },
  {
    title: "7. Data Retention",
    body: [
      "We retain information only as long as reasonably necessary to:",
      "",
      "Maintain your account.",
      "Fulfill orders.",
      "Resolve disputes.",
      "Meet legal obligations.",
      "Improve our services.",
      "",
      "Inactive or unnecessary data may be removed periodically.",
    ],
  },
  {
    title: "8. User Rights",
    body: [
      "Depending on your jurisdiction, you may have the right to:",
      "",
      "Access your information.",
      "Update account information.",
      "Request deletion of your account.",
      "Request correction of inaccurate data.",
      "Contact us regarding privacy concerns.",
      "",
      "Requests may be submitted through our support channels.",
    ],
  },
  {
    title: "9. Third-Party Services",
    body: [
      "Our website may integrate with third-party services including:",
      "",
      "Authentication providers.",
      "Analytics providers.",
      "Payment providers.",
      "Customer support platforms.",
      "",
      "These services operate under their own privacy policies.",
    ],
  },
  {
    title: "10. Children's Privacy",
    body: [
      "SymDeals is not intended for children under the age required by applicable law.",
      "",
      "We do not knowingly collect information from children.",
    ],
  },
  {
    title: "11. Changes to This Policy",
    body: [
      "We may update this Privacy Policy from time to time.",
      "",
      "Changes become effective upon publication on this page.",
      "Continued use of SymDeals after updates constitutes acceptance of the revised policy.",
    ],
  },
  {
    title: "12. Contact Us",
    body: [
      "If you have questions regarding this Privacy Policy or your information, please contact the SymDeals support team.",
      "",
      "SymDeals — Premium Digital Subscription Marketplace.",
      "Committed to protecting user privacy, security, and trust.",
    ],
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
            Privacy Policy
          </h1>
          <p className="mt-3 text-[12.5px] text-muted-foreground">
            Last Updated: June 2026
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
              <div className="mt-2.5 space-y-1">
                {s.body.map((line, i) =>
                  line === "" ? (
                    <div key={i} className="h-1" />
                  ) : line.startsWith("These include:") ||
                    line.startsWith("Information may only be shared:") ||
                    line.startsWith("We use collected information to:") ||
                    line.startsWith("We may collect the following information:") ||
                    line.startsWith("SymDeals may use cookies") ||
                    line.startsWith("We retain information only") ||
                    line.startsWith("Depending on your jurisdiction") ||
                    line.startsWith("Our website may integrate") ||
                    line.startsWith("SymDeals is not intended") ||
                    line.startsWith("We may update this") ||
                    line.startsWith("SymDeals does not store") ||
                    line.startsWith("We do not sell") ||
                    line.startsWith("If you have questions") ||
                    line.startsWith("We implement industry-standard") ||
                    line.startsWith("While we work") ||
                    line.startsWith("Inactive or unnecessary") ||
                    line.startsWith("Requests may be submitted") ||
                    line.startsWith("These services operate") ||
                    line.startsWith("We do not knowingly") ||
                    line.startsWith("Changes become effective") ||
                    line.startsWith("Continued use of") ||
                    line.startsWith("Payments may be processed") ||
                    line.startsWith("Payment providers are responsible") ||
                    line.startsWith("SymDeals — Premium") ||
                    line.startsWith("Committed to protecting") ? (
                    <p key={i} className="text-[13.5px] leading-[1.7] text-muted-foreground">
                      {line}
                    </p>
                  ) : (
                    <p key={i} className="pl-3.5 text-[13.5px] leading-[1.7] text-muted-foreground relative">
                      <span className="absolute left-0 top-[0.55em] h-[5px] w-[5px] rounded-full bg-primary/60" />
                      {line}
                    </p>
                  )
                )}
              </div>
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
