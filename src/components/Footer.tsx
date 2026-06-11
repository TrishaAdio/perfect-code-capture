import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface/40">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <Link to="/" className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-foreground text-background">
                <span className="font-display text-[13px] font-bold">S</span>
              </span>
              <span className="font-display text-[15px] font-semibold tracking-tight text-foreground">
                SymDeals
              </span>
            </Link>
            <p className="mt-5 max-w-sm text-[13px] leading-[1.65] text-muted-foreground">
              Premium digital access — subscriptions, software, and services
              with instant automated delivery and built-in warranty.
            </p>
          </div>

          <div className="md:col-span-2">
            <div className="label-uppercase">Product</div>
            <ul className="mt-4 space-y-3">
              <FooterLink to="/features">Features</FooterLink>
              <FooterLink to="/how-it-works">How It Works</FooterLink>
              <FooterLink to="/signup">Sign Up</FooterLink>
            </ul>
          </div>

          <div className="md:col-span-2">
            <div className="label-uppercase">Company</div>
            <ul className="mt-4 space-y-3">
              <FooterLink to="/support">Support</FooterLink>
              <FooterAnchor href="#">Terms</FooterAnchor>
              <FooterAnchor href="#">Privacy</FooterAnchor>
            </ul>
          </div>

          <div className="md:col-span-3">
            <div className="label-uppercase">Status</div>
            <div className="mt-4 inline-flex items-center gap-2 rounded-md border border-border bg-surface-elevated/60 px-3 py-1.5">
              <span className="flex h-1.5 w-1.5 animate-pulse-soft rounded-full bg-primary" />
              <span className="text-[12px] font-medium text-foreground">
                All Systems Operational
              </span>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-border pt-6 md:flex-row md:items-center">
          <p className="text-[12px] text-muted-foreground">
            © {new Date().getFullYear()} SymDeals. All rights reserved.
          </p>
          <p className="text-[12px] text-muted-foreground">
            Built for the modern streamer.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({
  to,
  children,
}: {
  to: string;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        to={to}
        className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
      >
        {children}
      </Link>
    </li>
  );
}

function FooterAnchor({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <li>
      <a
        href={href}
        className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
      >
        {children}
      </a>
    </li>
  );
}
