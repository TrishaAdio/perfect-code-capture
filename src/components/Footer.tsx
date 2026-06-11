import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="relative border-t border-border bg-surface/30">
      <div className="mx-auto max-w-6xl px-6 py-14 sm:py-16">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <Link to="/" className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-foreground text-background">
                <span className="font-display text-[13px] font-bold">S</span>
              </span>
              <span className="font-display text-[14.5px] font-semibold tracking-[-0.01em] text-foreground">
                SymDeals
              </span>
            </Link>
            <p className="mt-5 max-w-sm text-[13px] leading-[1.65] text-muted-foreground">
              Premium digital access — subscriptions, software, and services
              with instant automated delivery and built-in warranty.
            </p>

            <div className="mt-6 inline-flex items-center gap-2 rounded-md border border-border bg-surface-elevated/50 px-2.5 py-1.5">
              <span className="flex h-1.5 w-1.5 animate-pulse-soft rounded-full bg-primary" />
              <span className="text-[11.5px] font-medium text-foreground">
                All systems operational
              </span>
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="label-uppercase text-[10.5px]">Product</div>
            <ul className="mt-4 space-y-2.5">
              <FooterLink to="/features">Features</FooterLink>
              <FooterLink to="/how-it-works">How it works</FooterLink>
              <FooterLink to="/signup">Sign up</FooterLink>
            </ul>
          </div>

          <div className="md:col-span-2">
            <div className="label-uppercase text-[10.5px]">Company</div>
            <ul className="mt-4 space-y-2.5">
              <FooterLink to="/support">Support</FooterLink>
              <FooterLink to="/faq">FAQ</FooterLink>
              <FooterAnchor href="#">About</FooterAnchor>
            </ul>
          </div>

          <div className="md:col-span-3">
            <div className="label-uppercase text-[10.5px]">Legal</div>
            <ul className="mt-4 space-y-2.5">
              <FooterLink to="/privacy">Privacy</FooterLink>
              <FooterAnchor href="#">Terms</FooterAnchor>
              <FooterAnchor href="#">Refunds</FooterAnchor>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-3 border-t border-border pt-6 md:flex-row md:items-center">
          <p className="text-[11.5px] text-muted-foreground">
            © {new Date().getFullYear()} SymDeals. All rights reserved.
          </p>
          <p className="text-[11.5px] text-muted-foreground">
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
        className="text-[12.5px] text-muted-foreground transition-colors hover:text-foreground"
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
        className="text-[12.5px] text-muted-foreground transition-colors hover:text-foreground"
      >
        {children}
      </a>
    </li>
  );
}
