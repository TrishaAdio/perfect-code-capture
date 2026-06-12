import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { requireAuthBeforeLoad } from "@/lib/auth-guard";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, LayoutGroup } from "framer-motion";
import { OrdersPanel } from "@/components/panels/OrdersPanel";
import { SupportPanel } from "@/components/panels/SupportPanel";
import { ProfilePanel } from "@/components/panels/ProfilePanel";
import { CartPanel } from "@/components/panels/CartPanel";
import {
  Bell,
  Code2,
  Grid3x3,
  Headphones,
  Layers,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Music,
  Package,
  Search,
  Settings as SettingsIcon,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  TrendingDown,
  Tv,
  X,
  Zap,
  ArrowUpRight,
  ArrowRight,
  Clock,
} from "lucide-react";
import {
  ApiError,
  type AuthUser,
  type Product,
  type ProductCategory,
  clearSession,
  fetchMe,
  fetchProducts,
  getToken,
  resolveImageUrl,
  fetchActiveNotices,
  type Notice,
  type NoticeType,
} from "@/lib/api";
import { LogoutConfirmDialog } from "@/components/LogoutConfirmDialog";

import { OnboardingTour } from "@/components/OnboardingTour";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { ServiceLogo } from "@/components/ServiceLogo";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type CategoryFilter = ProductCategory | "All";

const CATEGORY_TABS: {
  key: CategoryFilter;
  label: string;
  Icon: typeof Grid3x3;
}[] = [
  { key: "All", label: "All", Icon: Grid3x3 },
  { key: "Subscriptions", label: "OTT", Icon: Tv },
  { key: "Music", label: "Music", Icon: Music },
  { key: "Software", label: "Software", Icon: Code2 },
  { key: "Adult", label: "AI Tools", Icon: Sparkles },
  { key: "Combo Pack", label: "Combo Packs", Icon: Layers },
];

type PanelKey = "overview" | "browse" | "orders" | "cart" | "support" | "settings";

const SIDEBAR_ITEMS: { panel: PanelKey; label: string; Icon: typeof LayoutDashboard }[] = [
  { panel: "overview", label: "Dashboard", Icon: LayoutDashboard },
  { panel: "browse",   label: "Browse",    Icon: Grid3x3 },
  { panel: "orders",   label: "Orders",    Icon: ShoppingBag },
  { panel: "cart",     label: "Cart",      Icon: ShoppingCart },
  { panel: "support",  label: "Support",   Icon: Headphones },
  { panel: "settings", label: "Settings",  Icon: SettingsIcon },
];

const VALID_PANELS: PanelKey[] = ["overview", "browse", "orders", "cart", "support", "settings"];


export const Route = createFileRoute("/dashboard")({
  ssr: false,
  beforeLoad: requireAuthBeforeLoad,
  component: DashboardPage,
  validateSearch: (search: Record<string, unknown>): { panel: PanelKey } => {
    const p = search.panel as string | undefined;
    return { panel: VALID_PANELS.includes(p as PanelKey) ? (p as PanelKey) : "overview" };
  },
  head: () => ({
    meta: [
      { title: "Dashboard — SymDeals" },
      { name: "description", content: "Your SymDeals dashboard." },
    ],
  }),
});

function DashboardPage() {
  const navigate = useNavigate();
  const { panel } = useSearch({ from: "/dashboard" });
  const [user, setUser] = useState<AuthUser | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingMe, setLoadingMe] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [logoutOpen, setLogoutOpen] = useState(false);
  
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("All");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeNotice, setActiveNotice] = useState<Notice | null>(null);
  const [noticeDismissedIds, setNoticeDismissedIds] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};
    try {
      return JSON.parse(sessionStorage.getItem("symdeals.notices.dismissed") || "{}");
    } catch {
      return {};
    }
  });

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.title = panel === "settings" ? "Settings — SymDeals" : "Dashboard — SymDeals";
  }, [panel]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetchActiveNotices();
        if (!cancelled) setActiveNotice(res.notices[0] ?? null);
      } catch {
        /* silent */
      }
    };
    void load();
    const id = window.setInterval(load, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  const dismissNotice = (id: string) => {
    const next = { ...noticeDismissedIds, [id]: true };
    setNoticeDismissedIds(next);
    try {
      sessionStorage.setItem("symdeals.notices.dismissed", JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const visibleNotice = activeNotice && !noticeDismissedIds[activeNotice.id] ? activeNotice : null;

  const goToPanel = (next: PanelKey) => {
    if (next === panel) return;
    navigate({
      to: "/dashboard",
      search: next === "overview" ? {} : { panel: next },
      replace: false,
    });
    // restore scroll on panel change
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openProduct = (p: Product) => {
    const routeId = p.service_id ? String(p.service_id) : p.id;
    navigate({ to: "/product/$id", params: { id: routeId } });
  };


  useEffect(() => {
    if (!getToken()) {
      navigate({ to: "/" });
      return;
    }
    void (async () => {
      try {
        const me = await fetchMe();
        setUser(me.user);
      } catch (error) {
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          clearSession();
          navigate({ to: "/" });
          return;
        }
        return;
      } finally {
        setLoadingMe(false);
      }
    })();
    void (async () => {
      try {
        const res = await fetchProducts();
        setProducts(res.products);
      } catch {
        /* non-fatal */
      } finally {
        setLoadingProducts(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ⌘K / Ctrl+K to open search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const confirmLogout = () => {
    setLogoutOpen(false);
    clearSession();
    navigate({ to: "/login" });
  };

  const firstName = (user?.name || "").trim().split(/\s+/)[0] || "there";

  const filteredProducts = useMemo(() => {
    const byCat =
      selectedCategory === "All"
        ? products
        : products.filter((p) => p.category === selectedCategory);
    const q = searchQuery.trim().toLowerCase();
    if (!q) return byCat;
    return byCat.filter((p) => {
      const hay = `${p.name ?? ""} ${p.category ?? ""} ${p.description ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [products, selectedCategory, searchQuery]);

  const totalSaved = user?.totalSaved ?? 0;

  return (
    <TooltipProvider delayDuration={350} skipDelayDuration={150}>
    <div className="relative min-h-screen bg-background text-foreground">
      {/* Background — matte black + subtle radial + grid */}
      <div className="pointer-events-none fixed inset-0 -z-10 mesh-bg opacity-60" />
      <div className="pointer-events-none fixed inset-0 -z-10 grid-pattern opacity-50" />

      <div className="flex min-h-screen">
        {/* Desktop sidebar */}
        <DesktopSidebar onLogout={() => setLogoutOpen(true)} user={user} activePanel={panel} onPanelSelect={goToPanel} />

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top bar */}
          <header className="sticky top-0 z-40 border-b border-border bg-background/70 backdrop-blur-xl">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3.5 lg:px-10">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMobileNavOpen(true)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface/60 text-muted-foreground transition-colors hover:text-foreground lg:hidden"
                  aria-label="Open menu"
                >
                  <Menu className="h-4 w-4" />
                </button>
                <Link to="/" className="flex items-center gap-2 lg:hidden">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-foreground text-background">
                    <span className="font-display text-[12px] font-bold">S</span>
                  </span>
                </Link>
              </div>

              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.button
                    onClick={() => setSearchOpen(true)}
                    data-tour="search"
                    whileHover={{ scale: 1.005 }}
                    whileTap={{ scale: 0.99 }}
                    transition={{ type: "spring", stiffness: 420, damping: 28 }}
                    className="group relative flex h-10 w-full max-w-lg items-center gap-2.5 overflow-hidden rounded-xl border border-border bg-surface/60 px-3.5 text-left text-[13px] text-muted-foreground transition-all duration-300 hover:border-primary/30 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 hover:shadow-[0_0_0_3px_color-mix(in_oklab,var(--primary)_8%,transparent)]"
                  >
                    <Search className="h-4 w-4 transition-colors group-hover:text-primary" />
                    <span className="flex-1 truncate">Search services…</span>
                    <kbd className="hidden rounded-md border border-border bg-background/60 px-1.5 py-0.5 text-[10.5px] font-medium text-muted-foreground transition-colors group-hover:border-primary/30 group-hover:text-foreground sm:inline-block">
                      ⌘K
                    </kbd>
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={8}>Search subscriptions and services</TooltipContent>
              </Tooltip>

              <div className="flex items-center gap-2.5">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      className="hidden h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface/60 text-muted-foreground transition-all hover:text-foreground hover:border-muted-foreground/30 sm:inline-flex"
                      aria-label="Notifications"
                    >
                      <Bell className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={8}>Notifications</TooltipContent>
                </Tooltip>
                <UserBadge user={user} loading={loadingMe} />
              </div>
            </div>
          </header>

          <main
            className="mx-auto w-full max-w-7xl flex-1 px-6 pt-10 lg:px-10 lg:pb-16"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 7.5rem)" }}
          >
            {/* Inline banner — admin notice takes precedence over verify banner */}
            <AnimatePresence mode="wait" initial={false}>
              {visibleNotice ? (
                <InlineNoticeBanner
                  key={`notice-${visibleNotice.id}`}
                  notice={visibleNotice}
                  onDismiss={() => dismissNotice(visibleNotice.id)}
                />
              ) : !loadingMe && user && user.isVerified === false && !bannerDismissed ? (
                <VerifyBanner
                  key="verify-banner"
                  onVerify={() => navigate({ to: "/verify-email", search: { next: "/dashboard" } })}
                  onDismiss={() => setBannerDismissed(true)}
                />
              ) : null}
            </AnimatePresence>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={panel}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              >
                {(panel === "overview" || panel === "browse") && (
                  <>
                    {panel === "overview" && (
                      <section className="grid gap-8 lg:grid-cols-12 lg:items-end">
                        <div className="lg:col-span-6">
                          <div className="label-uppercase">Overview</div>
                          <h1 className="mt-3 font-display text-[2rem] font-semibold tracking-[-0.025em] text-foreground sm:text-[2.35rem]">
                            {loadingMe ? (
                              <span className="text-muted-foreground/40">Loading…</span>
                            ) : (
                              <>Welcome back, {firstName}</>
                            )}
                          </h1>
                          <p className="mt-2 text-[14px] text-muted-foreground">
                            Pick up where you left off.
                          </p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-6">
                          <ActiveOrdersCard loading={loadingMe} onView={() => goToPanel("orders")} />
                          <TotalSavedCard loading={loadingMe} amount={totalSaved} />
                        </div>
                      </section>
                    )}

                    <section className={panel === "overview" ? "mt-14" : ""} data-tour="categories">
                      <div className="flex items-center justify-between">
                        <h2 className="font-display text-[17px] font-semibold tracking-tight text-foreground">
                          {panel === "browse" ? "Browse Services" : "Catalog"}
                        </h2>
                        <span className="text-[12px] text-muted-foreground">
                          {loadingProducts ? "—" : `${filteredProducts.length} services`}
                        </span>
                      </div>
                      <LayoutGroup id="category-pills">
                        <div
                          className="mt-5 -mx-6 flex gap-2 overflow-x-auto px-6 pb-1 lg:mx-0 lg:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                          role="tablist"
                        >
                          {CATEGORY_TABS.map(({ key, label, Icon }) => {
                            const active = selectedCategory === key;
                            return (
                              <motion.button
                                key={key}
                                role="tab"
                                aria-selected={active}
                                onClick={() => setSelectedCategory(key)}
                                whileTap={{ scale: 0.94 }}
                                transition={{ type: "spring", stiffness: 400, damping: 26 }}
                                className={`relative inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-[13px] font-medium tracking-tight transition-colors ${
                                  active
                                    ? "border-transparent text-background"
                                    : "border-border bg-surface/60 text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground"
                                }`}
                              >
                                {active && (
                                  <motion.span
                                    layoutId="category-pill-active"
                                    className="absolute inset-0 rounded-full bg-foreground"
                                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                  />
                                )}
                                <Icon className="relative h-3.5 w-3.5" />
                                <span className="relative">{label}</span>
                              </motion.button>
                            );
                          })}
                        </div>
                      </LayoutGroup>
                    </section>

                    <section className="mt-7" data-tour="products">
                      {loadingProducts ? (
                        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
                          {[0, 1, 2, 3, 4, 5].map((i) => (
                            <div
                              key={i}
                              className="h-[180px] animate-pulse rounded-2xl border border-border bg-surface/60"
                            />
                          ))}
                        </div>
                      ) : filteredProducts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface/40 px-6 py-20 text-center">
                          <Package className="h-7 w-7 text-muted-foreground/60" />
                          <p className="mt-3 text-[14px] font-medium text-foreground">
                            {selectedCategory === "All"
                              ? "No services available yet"
                              : `No services in ${selectedCategory}`}
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
                          {filteredProducts.map((p) => (
                            <ProductCard
                              key={p.id}
                              product={p}
                              onOpen={() => openProduct(p)}
                            />
                          ))}
                        </div>
                      )}
                    </section>
                  </>
                )}

                {panel === "orders" && <OrdersPanel onBrowse={() => goToPanel("browse")} />}
                {panel === "cart" && (
                  <CartPanel onBrowse={() => goToPanel("browse")} />
                )}
                {panel === "support" && <SupportPanel />}
                {panel === "settings" && (
                  <ProfilePanel initialUser={user} onUserChange={(u) => setUser(u)} />
                )}
              </motion.div>
            </AnimatePresence>

          </main>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <MobileBottomNav />

      {/* Mobile drawer (extras) */}
      <MobileDrawer
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        onLogout={() => {
          setMobileNavOpen(false);
          setLogoutOpen(true);
        }}
        user={user}
        activePanel={panel}
        onPanelSelect={(p) => {
          setMobileNavOpen(false);
          goToPanel(p);
        }}
      />

      <LogoutConfirmDialog
        open={logoutOpen}
        onCancel={() => setLogoutOpen(false)}
        onConfirm={confirmLogout}
      />


      <SearchOverlay
        open={searchOpen}
        query={searchQuery}
        onQueryChange={setSearchQuery}
        onClose={() => setSearchOpen(false)}
        products={products}
        onOpenProduct={(p) => {
          setSearchOpen(false);
          openProduct(p);
        }}
      />

      <OnboardingTour />
    </div>
    </TooltipProvider>
  );
}

/* ---------- Sidebar ---------- */

function DesktopSidebar({
  user,
  onLogout,
  activePanel,
  onPanelSelect,
}: {
  user: AuthUser | null;
  onLogout: () => void;
  activePanel: PanelKey;
  onPanelSelect: (p: PanelKey) => void;
}) {
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-surface/40 backdrop-blur-xl lg:flex">
      <div className="flex h-14 items-center gap-2 border-b border-border px-5">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-foreground text-background">
            <span className="font-display text-[12.5px] font-bold">S</span>
          </span>
          <span className="font-display text-[14px] font-semibold tracking-tight text-foreground">
            SymDeals
          </span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <div className="px-2 pb-2.5 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground/70">
          Workspace
        </div>
        <LayoutGroup id="sidebar-nav">
          <ul className="space-y-0.5">
            {SIDEBAR_ITEMS.map((item) => {
              const Icon = item.Icon;
              const active = activePanel === item.panel;
              const hint =
                item.label === "Dashboard"
                  ? "Overview & catalog"
                  : item.label === "Browse"
                  ? "Browse all services"
                  : item.label === "Orders"
                  ? "View your active orders"
                  : item.label === "Cart"
                  ? "Your shopping cart"
                  : item.label === "Support"
                  ? "Talk to support"
                  : "Account settings";
              return (
                <li key={item.label}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => onPanelSelect(item.panel)}
                        aria-current={active ? "page" : undefined}
                        className={`group relative flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-medium transition-colors duration-200 ${
                          active
                            ? "text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {active && (
                          <motion.span
                            layoutId="sidebar-active"
                            className="absolute inset-0 rounded-lg bg-surface-elevated"
                            transition={{ type: "spring", stiffness: 380, damping: 32 }}
                          />
                        )}
                        <span
                          aria-hidden
                          className={`relative h-4 w-px rounded-full transition-colors ${
                            active ? "bg-primary" : "bg-transparent"
                          }`}
                        />
                        <Icon className="relative h-3.5 w-3.5" />
                        <span className="relative">
                          {item.label}
                          {active && (
                            <motion.span
                              layoutId="sidebar-underline"
                              className="absolute -bottom-0.5 left-0 right-0 h-px rounded-full bg-gradient-to-r from-transparent via-primary/70 to-transparent"
                              transition={{ type: "spring", stiffness: 420, damping: 34 }}
                            />
                          )}
                        </span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={10}>{hint}</TooltipContent>
                  </Tooltip>
                </li>
              );
            })}
          </ul>
        </LayoutGroup>
      </nav>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2.5 rounded-lg border border-border bg-background/60 p-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/15 text-[10.5px] font-semibold text-primary">
            {(user?.name?.[0] || "U").toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[12px] font-semibold text-foreground">
              {user?.name || "Member"}
            </div>
            <div className="truncate text-[10.5px] text-muted-foreground">
              {user?.email || "—"}
            </div>
          </div>
          <button
            onClick={onLogout}
            aria-label="Sign out"
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}

/* ---------- Mobile bottom nav + drawer ---------- */

// MobileBottomNav now lives in @/components/MobileBottomNav (shared across pages).

function MobileDrawer({
  open,
  onClose,
  user,
  onLogout,
  activePanel,
  onPanelSelect,
}: {
  open: boolean;
  onClose: () => void;
  user: AuthUser | null;
  onLogout: () => void;
  activePanel: PanelKey;
  onPanelSelect: (p: PanelKey) => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <div
      className={`fixed inset-0 z-[60] lg:hidden ${open ? "pointer-events-auto" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      <button
        type="button"
        aria-label="Close menu"
        onClick={onClose}
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        className={`absolute left-0 top-0 flex h-full w-[80%] max-w-xs flex-col border-r border-border bg-background transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-foreground text-background">
              <span className="font-display text-[12px] font-bold">S</span>
            </span>
            <span className="font-display text-[14px] font-semibold text-foreground">
              SymDeals
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-0.5">
            {SIDEBAR_ITEMS.map((item) => {
              const active = activePanel === item.panel;
              return (
                <li key={item.label}>
                  <button
                    type="button"
                    onClick={() => onPanelSelect(item.panel)}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[13px] font-medium transition-colors ${
                      active
                        ? "bg-surface-elevated text-foreground"
                        : "text-muted-foreground hover:bg-surface hover:text-foreground"
                    }`}
                  >
                    <item.Icon className="h-3.5 w-3.5" />
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-border p-3">
          <div className="mb-3 flex items-center gap-2.5 rounded-lg border border-border bg-surface/60 p-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/15 text-[10.5px] font-semibold text-primary">
              {(user?.name?.[0] || "U").toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12px] font-semibold text-foreground">
                {user?.name || "Member"}
              </div>
              <div className="truncate text-[10.5px] text-muted-foreground">
                {user?.email}
              </div>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface/60 px-4 py-2.5 text-[12.5px] font-medium text-muted-foreground transition-colors hover:bg-surface-elevated hover:text-foreground"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </button>
        </div>
      </aside>
    </div>
  );
}

/* ---------- Building blocks ---------- */

function UserBadge({ user, loading }: { user: AuthUser | null; loading: boolean }) {
  if (loading)
    return (
      <div className="h-8 w-8 animate-pulse rounded-full border border-border bg-surface" />
    );
  const initial = (user?.name?.[0] || "U").toUpperCase();
  return (
    <Link
      to="/myprofile"
      className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface/60 text-[11.5px] font-semibold text-foreground transition-colors hover:border-muted-foreground/30"
      aria-label="Settings"
    >
      {initial}
    </Link>
  );
}

function ActiveOrdersCard({ loading, onView }: { loading: boolean; onView?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="group relative overflow-hidden rounded-2xl border border-border bg-surface/60 p-5 backdrop-blur shadow-card transition-colors hover:border-muted-foreground/25"
    >
      <div className="flex items-center justify-between">
        <span className="text-[10.5px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Active Orders
        </span>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background/60">
          <ShoppingBag className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      </div>
      <div className="mt-4 flex items-baseline gap-2.5">
        <span className="font-display text-[1.85rem] font-semibold tracking-tight text-foreground">
          {loading ? <span className="text-muted-foreground/40">—</span> : "0"}
        </span>
        <button
          type="button"
          onClick={onView}
          className="group/link inline-flex items-center gap-0.5 text-[11.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          View all
          <ArrowRight className="h-3 w-3 transition-transform group-hover/link:translate-x-0.5" />
        </button>
      </div>
    </motion.div>
  );
}

function useCountUp(value: number, duration = 900) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (typeof window === "undefined" || !Number.isFinite(value)) return;
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || value === 0) {
      setN(value);
      return;
    }
    const start = performance.now();
    const from = 0;
    let raf = 0;
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(from + (value - from) * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return n;
}

function TotalSavedCard({ loading, amount }: { loading: boolean; amount: number }) {
  const display = useCountUp(amount);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
      className="group relative overflow-hidden rounded-2xl border border-border bg-surface/60 p-5 backdrop-blur shadow-card transition-colors hover:border-primary/25"
    >
      {/* soft emerald glow */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--primary)_22%,transparent),transparent_70%)] opacity-60 blur-2xl"
      />
      <div className="relative flex items-center justify-between">
        <span className="text-[10.5px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Total Saved
        </span>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
          <TrendingDown className="h-3.5 w-3.5 text-primary" />
        </div>
      </div>
      <div className="relative mt-4 flex items-baseline gap-2">
        <span className="font-display text-[1.85rem] font-semibold tracking-tight text-foreground tabular-nums">
          {loading ? (
            <span className="text-muted-foreground/40">—</span>
          ) : (
            <>₹{display.toLocaleString("en-IN")}</>
          )}
        </span>
        <span className="text-[11.5px] font-medium text-muted-foreground">
          across all orders
        </span>
      </div>
    </motion.div>
  );
}

function VerifyBanner({
  onVerify,
  onDismiss,
}: {
  onVerify: () => void;
  onDismiss: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="mb-6"
    >
      <div className="relative flex items-center gap-2.5 overflow-hidden rounded-lg border border-primary/15 bg-primary/[0.04] py-1.5 pl-3 pr-1.5">
        <span aria-hidden className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10">
          <Mail className="h-3 w-3 text-primary" />
        </span>
        <p className="flex-1 text-[12px] font-medium text-foreground/90">
          Verify your email to unlock offers and faster service.
        </p>
        <motion.button
          type="button"
          onClick={onVerify}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 22 }}
          className="inline-flex h-6 items-center justify-center rounded-md bg-primary/90 px-2.5 text-[10.5px] font-semibold tracking-tight text-primary-foreground shadow-sm transition-colors hover:bg-primary"
        >
          Verify
        </motion.button>
        <motion.button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          whileTap={{ scale: 0.9 }}
          className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
        >
          <X className="h-3 w-3" />
        </motion.button>
      </div>
    </motion.div>
  );
}

/* ---------- Inline admin notice (replaces verify banner when active) ---------- */

const NOTICE_STYLES: Record<
  NoticeType,
  { ring: string; bg: string; iconBg: string; iconColor: string; chip: string; dot: string }
> = {
  info: {
    ring: "border-sky-400/20",
    bg: "bg-sky-500/[0.05]",
    iconBg: "bg-sky-400/10",
    iconColor: "text-sky-300",
    chip: "text-sky-300",
    dot: "bg-sky-400/80",
  },
  success: {
    ring: "border-emerald-400/20",
    bg: "bg-emerald-500/[0.05]",
    iconBg: "bg-emerald-400/10",
    iconColor: "text-emerald-300",
    chip: "text-emerald-300",
    dot: "bg-emerald-400/80",
  },
  warning: {
    ring: "border-amber-400/20",
    bg: "bg-amber-500/[0.05]",
    iconBg: "bg-amber-400/10",
    iconColor: "text-amber-300",
    chip: "text-amber-300",
    dot: "bg-amber-400/80",
  },
  urgent: {
    ring: "border-rose-500/25",
    bg: "bg-rose-500/[0.06]",
    iconBg: "bg-rose-500/15",
    iconColor: "text-rose-300",
    chip: "text-rose-300",
    dot: "bg-rose-400/90",
  },
};

const NOTICE_LABEL: Record<NoticeType, string> = {
  info: "Update",
  success: "Notice",
  warning: "Warning",
  urgent: "Important",
};

function InlineNoticeBanner({
  notice,
  onDismiss,
}: {
  notice: Notice;
  onDismiss: () => void;
}) {
  const style = NOTICE_STYLES[notice.type] ?? NOTICE_STYLES.info;
  const label = notice.title?.trim() || NOTICE_LABEL[notice.type];
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="mb-6"
    >
      <div
        className={`relative flex items-start gap-2.5 overflow-hidden rounded-xl border ${style.ring} ${style.bg} px-3 py-2.5 backdrop-blur-sm sm:items-center sm:rounded-lg sm:py-1.5 sm:pl-3 sm:pr-1.5`}
      >
        <span
          aria-hidden
          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${style.iconBg} sm:mt-0 sm:h-5 sm:w-5`}
        >
          <Bell className={`h-3.5 w-3.5 ${style.iconColor} sm:h-3 sm:w-3`} />
        </span>
        <p className="flex-1 min-w-0 text-[13px] font-medium leading-snug text-foreground/90 sm:truncate sm:text-[12px] sm:leading-5">
          <span className={`font-semibold ${style.chip}`}>{label}</span>
          <span aria-hidden className={`mx-2 inline-block h-1 w-1 rounded-full align-middle ${style.dot}`} />
          <span className="text-foreground/85 break-words sm:break-normal">{notice.message}</span>
        </p>
        <motion.button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          whileTap={{ scale: 0.9 }}
          className="-mr-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface hover:text-foreground sm:mr-0 sm:h-6 sm:w-6"
        >
          <X className="h-3.5 w-3.5 sm:h-3 sm:w-3" />
        </motion.button>
      </div>
    </motion.div>
  );
}

/* ---------- Product card ---------- */

function ProductCard({
  product,
  onOpen,
}: {
  product: Product;
  onOpen: () => void;
}) {
  const plans = product.plans.length
    ? [...product.plans].sort((a, b) => a.price - b.price)
    : [];
  const lowest = plans[0] ?? null;
  const oldPrice =
    lowest && (lowest.realPrice ?? 0) > lowest.price ? lowest.realPrice! : null;
  const showOldPrice = oldPrice !== null;
  const savePct =
    showOldPrice && oldPrice && lowest
      ? Math.round(((oldPrice - lowest.price) / oldPrice) * 100)
      : 0;
  const formatDuration = (m?: number) => {
    if (!m) return null;
    if (m % 12 === 0) {
      const y = m / 12;
      return `${y} ${y === 1 ? "Year" : "Years"}`;
    }
    return `${m} ${m === 1 ? "Month" : "Months"}`;
  };
  const duration = formatDuration(lowest?.months);

  const cardRef = useRef<HTMLElement>(null);
  const handleMove = (e: React.MouseEvent<HTMLElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    el.style.setProperty("--my", `${e.clientY - rect.top}px`);
  };

  return (
    <motion.article
      ref={cardRef}
      onClick={onOpen}
      onMouseMove={handleMove}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 360, damping: 26 }}
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-surface/55 p-3 backdrop-blur-xl transition-[border-color,background-color,box-shadow] duration-200 hover:border-white/[0.12] hover:bg-surface-elevated/75 hover:shadow-[0_10px_30px_-18px_rgba(0,0,0,0.7)] active:scale-[0.985] sm:flex-row sm:items-stretch sm:p-5"
      style={{ minHeight: 0, willChange: "transform" }}
    >
      {/* cursor glow (desktop only) */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 hidden opacity-0 transition-opacity duration-300 group-hover:opacity-100 sm:block"
        style={{
          background:
            "radial-gradient(240px circle at var(--mx, 50%) var(--my, 50%), color-mix(in oklab, var(--primary) 14%, transparent), transparent 60%)",
        }}
      />

      {/* MOBILE LAYOUT */}
      <div className="relative flex flex-col sm:hidden">
        {/* Logo banner — slimmer, calmer */}
        <div className="relative mb-3 flex h-[72px] w-full items-center justify-center overflow-hidden rounded-xl border border-white/[0.05] bg-gradient-to-br from-white/[0.04] to-transparent">
          <ServiceLogo
            src={product.image}
            name={product.name}
            className="h-full w-full object-cover"
            iconClass="h-8 w-8"
          />
          {savePct > 0 && (
            <span className="absolute right-1.5 top-1.5 inline-flex items-center rounded-md border border-emerald-400/20 bg-emerald-500/12 px-1.5 py-[2px] text-[9px] font-semibold tracking-tight text-emerald-300/95 backdrop-blur-md">
              −{savePct}%
            </span>
          )}
        </div>

        {/* Category — small muted label */}
        <div className="text-[9.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground/80">
          {product.category || "Service"}
        </div>

        {/* Title — 2 lines, bold, tight */}
        <h3 className="mt-1 font-display text-[14px] font-semibold leading-[1.3] tracking-tight text-foreground line-clamp-2 min-h-[2.6em]">
          {product.name}
        </h3>

        {/* Detail chips — uniform, restrained */}
        <div className="mt-2.5 flex items-center gap-1">
          {duration && (
            <span className="inline-flex h-[20px] items-center gap-1 rounded-full border border-white/[0.06] bg-white/[0.03] px-2 text-[9.5px] font-medium text-foreground/85">
              <Clock className="h-2.5 w-2.5 text-primary/90" />
              {duration}
            </span>
          )}
          <span className="inline-flex h-[20px] items-center gap-1 rounded-full border border-white/[0.06] bg-white/[0.03] px-2 text-[9.5px] font-medium text-muted-foreground">
            <Zap className="h-2.5 w-2.5 text-primary/90" />
            Instant
          </span>
        </div>

        {/* Price row — current dominant, real softer, duration right */}
        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="font-display text-[18px] font-semibold leading-none tracking-tight text-foreground tabular-nums">
            {lowest ? `₹${lowest.price.toLocaleString()}` : "—"}
          </span>
          {showOldPrice && (
            <span className="text-[11px] font-medium text-muted-foreground/55 line-through tabular-nums">
              ₹{oldPrice!.toLocaleString()}
            </span>
          )}
          {duration && (
            <span className="ml-auto text-[10px] font-medium text-muted-foreground/80">
              / {duration.toLowerCase()}
            </span>
          )}
        </div>

        {/* CTA — soft compress, premium */}
        <motion.button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 480, damping: 26 }}
          className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1 rounded-xl bg-foreground text-[12px] font-semibold tracking-tight text-background shadow-[0_8px_22px_-10px_color-mix(in_oklab,var(--foreground)_55%,transparent)] transition-shadow duration-200 active:shadow-[0_4px_14px_-8px_color-mix(in_oklab,var(--foreground)_45%,transparent)]"
          style={{ willChange: "transform" }}
        >
          Get Access
          <ArrowUpRight className="h-3.5 w-3.5" />
        </motion.button>
      </div>

      {/* DESKTOP LAYOUT */}
      <div className="relative hidden w-full sm:block">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-background/70 transition-transform duration-300 group-hover:scale-[1.04]">
            <ServiceLogo
              src={product.image}
              name={product.name}
              className="h-full w-full object-cover"
              iconClass="h-6 w-6"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="truncate font-display text-[15.5px] font-semibold tracking-tight text-foreground">
                {product.name}
              </h3>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
            </div>
            <div className="mt-1 truncate text-[12px] text-muted-foreground">
              {product.category || "Service"}
            </div>
            <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
              {duration && (
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background/60 px-2 py-0.5 text-[10.5px] font-medium text-foreground/85">
                  <Clock className="h-2.5 w-2.5 text-primary" />
                  {duration}
                </span>
              )}
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background/60 px-2 py-0.5 text-[10.5px] font-medium text-muted-foreground">
                <Zap className="h-2.5 w-2.5 text-primary" />
                Instant
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background/60 px-2 py-0.5 text-[10.5px] font-medium text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                In stock
              </span>
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-end justify-between border-t border-border pt-4">
          <div>
            <div className="text-[10.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              From
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="font-display text-[20px] font-semibold tracking-tight text-foreground">
                {lowest ? `₹${lowest.price.toLocaleString()}` : "—"}
              </span>
              {showOldPrice && (
                <span className="text-[11.5px] font-medium text-muted-foreground line-through">
                  ₹{oldPrice!.toLocaleString()}
                </span>
              )}
            </div>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpen();
                }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.92 }}
                transition={{ type: "spring", stiffness: 420, damping: 22 }}
                className="inline-flex h-9 items-center justify-center rounded-full bg-foreground px-5 text-[12.5px] font-semibold tracking-tight text-background shadow-sm transition-all hover:shadow-[0_6px_20px_-6px_color-mix(in_oklab,var(--foreground)_50%,transparent)]"
              >
                Get Access
              </motion.button>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={6}>Purchase instantly</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </motion.article>
  );
}

/* ---------- Search overlay (preserved) ---------- */

function SearchOverlay({
  open,
  query,
  onQueryChange,
  onClose,
  products,
  onOpenProduct,
}: {
  open: boolean;
  query: string;
  onQueryChange: (v: string) => void;
  onClose: () => void;
  products: Product[];
  onOpenProduct: (p: Product) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [debounced, setDebounced] = useState(query);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      clearTimeout(t);
    };
  }, [open, onClose]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 200);
    return () => clearTimeout(t);
  }, [query]);

  const q = debounced.trim().toLowerCase();

  const results = useMemo(() => {
    if (!q) return [] as Product[];
    const fuzzyHit = (target: string, needle: string) => {
      let i = 0;
      for (const ch of target) {
        if (ch === needle[i]) i++;
        if (i === needle.length) return true;
      }
      return false;
    };
    const scored: { p: Product; score: number }[] = [];
    for (const p of products) {
      const name = (p.name ?? "").toLowerCase();
      const cat = (p.category ?? "").toLowerCase();
      const desc = (p.description ?? "").toLowerCase();
      const sid = p.service_id ? String(p.service_id) : "";
      let score = 0;
      if (sid && sid === q) score = 100;
      else if (sid && sid.startsWith(q)) score = 90;
      else if (name && name === q) score = 85;
      else if (name && name.startsWith(q)) score = 75;
      else if (name && name.includes(q)) score = 60;
      else if (cat && cat.includes(q)) score = 40;
      else if (desc && desc.includes(q)) score = 25;
      else if (q.length >= 3 && name && fuzzyHit(name, q)) score = 15;
      if (score > 0) scored.push({ p, score });
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 6).map((s) => s.p);
  }, [products, q]);

  return (
    <div
      className={`fixed inset-0 z-[70] ${open ? "pointer-events-auto" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      <button
        type="button"
        aria-label="Close search"
        onClick={onClose}
        className={`absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        className={`absolute inset-x-0 top-0 mx-auto flex max-h-screen w-full max-w-2xl flex-col px-4 pt-6 transition-all duration-200 sm:pt-16 ${
          open ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
        }`}
      >
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface px-3 py-2 shadow-elevated">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search services…"
            className="h-9 flex-1 bg-transparent text-[14px] font-medium text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => onQueryChange("")}
              aria-label="Clear search"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-7 items-center justify-center rounded-md border border-border bg-background/60 px-2.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            ESC
          </button>
        </div>

        {q && (
          <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-surface/90 shadow-elevated backdrop-blur-xl animate-fade-up">
            {results.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-[13.5px] font-medium text-foreground">
                  No matching services
                </p>
                <p className="mt-1 text-[12px] text-muted-foreground">
                  Try a different keyword
                </p>
              </div>
            ) : (
              <ul className="max-h-[60vh] divide-y divide-border/40 overflow-y-auto">
                {results.map((p) => {
                  const lowest =
                    Array.isArray(p.plans) && p.plans.length
                      ? Math.min(...p.plans.map((pl) => pl.price))
                      : null;
                  return (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => onOpenProduct(p)}
                        className="group flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-surface-elevated"
                      >
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-border bg-background/60">
                          <ServiceLogo
                            src={p.image}
                            name={p.name}
                            className="h-full w-full object-cover"
                            iconClass="h-4 w-4"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-semibold text-foreground">
                            {p.name}
                          </p>
                          <p className="truncate text-[11px] text-muted-foreground">
                            {p.category}
                          </p>
                        </div>
                        {lowest !== null && (
                          <span className="shrink-0 font-display text-[12.5px] font-semibold text-foreground">
                            ₹{lowest.toLocaleString()}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ProductImage replaced by <ServiceLogo /> from @/components/ServiceLogo

