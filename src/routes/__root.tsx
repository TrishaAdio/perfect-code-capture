import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { installConsoleShield } from "@/lib/console-shield";
import { useDevicePerformance } from "@/hooks/use-device-performance";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex h-9 items-center justify-center rounded-full border border-[var(--border)] bg-foreground px-4 text-[13px] font-medium text-background shadow-[0_1px_0_rgba(255,255,255,0.18)_inset,0_1px_2px_rgba(0,0,0,0.45)] transition-[background-color,transform] hover:bg-foreground/92 active:scale-[0.985]"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "SymDeals — Premium OTT subscriptions" },
      {
        name: "description",
        content:
          "SymDeals — affordable, verified premium OTT and software subscriptions with instant delivery and dependable support.",
      },
      { name: "author", content: "SymDeals" },
      { property: "og:title", content: "SymDeals — Premium OTT subscriptions" },
      {
        property: "og:description",
        content:
          "Affordable, verified premium subscriptions with instant delivery.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "preload",
        as: "style",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&display=swap",
      },
      { rel: "stylesheet", href: appCss },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  useDevicePerformance();
  useEffect(() => {
    installConsoleShield();
  }, []);

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:inline-flex focus:h-9 focus:items-center focus:rounded-full focus:border focus:border-[var(--border)] focus:bg-surface focus:px-3 focus:text-[12px] focus:font-medium focus:text-foreground focus:shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]"
      >
        Skip to content
      </a>
      <div id="main" className="app-route-shell">
        <Outlet />
      </div>
      <Toaster theme="dark" position="top-right" />
    </>
  );
}
