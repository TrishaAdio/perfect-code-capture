import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, LayoutGroup } from "framer-motion";
import { ChevronDown, LayoutDashboard, ShoppingBag, User, LogOut, Menu, X, Home, Sparkles, ListChecks, HelpCircle, Headphones, LogIn, UserPlus } from "lucide-react";
import { isLoggedIn, clearSession, type AuthUser } from "@/lib/api";

const MOBILE_NAV_ITEMS = [
  { to: "/", label: "Home", Icon: Home },
  { to: "/features", label: "Features", Icon: Sparkles },
  { to: "/how-it-works", label: "How It Works", Icon: ListChecks },
  { to: "/faq", label: "FAQ", Icon: HelpCircle },
  { to: "/support", label: "Support", Icon: Headphones },
] as const;

export function Navbar() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const onScroll = () => {
      const next = window.scrollY > 6;
      setScrolled((current) => (current === next ? current : next));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const sync = () => setAuthed(isLoggedIn());
    sync();
    setAuthReady(true);
    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key.startsWith("symdeals.")) sync();
    };
    const onFocus = () => sync();
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Lock body scroll while mobile menu is open
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const user: AuthUser | null = (() => {
    if (!authed || typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem("symdeals.user");
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  })();
  const initials = user?.name
    ? user.name.split(" ").map((p: string) => p[0]).slice(0, 2).join("").toUpperCase()
    : "U";

  return (
    <>
    <header
      className={`fixed left-1/2 top-3 z-50 w-[calc(100%-1rem)] max-w-6xl -translate-x-1/2 rounded-full transition-all duration-500 sm:w-[calc(100%-1.5rem)] ${
        scrolled
          ? "glass-nav border border-border/70 shadow-soft"
          : "border border-transparent"
      }`}
    >
      <nav className="flex items-center justify-between px-4 py-2 sm:px-5 sm:py-2.5">
        <Link to="/" aria-label="SymDeals home" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background sm:h-7 sm:w-7">
            <span className="font-display text-[14px] font-bold tracking-tight sm:text-[13px]">S</span>
          </span>
          <span className="font-display text-[15px] font-semibold tracking-tight text-foreground sm:text-[14px]">
            SymDeals
          </span>
        </Link>

        <LayoutGroup id="primary-nav">
          <div className="hidden items-center gap-1 md:flex">
            <NavItem to="/features">Features</NavItem>
            <NavItem to="/how-it-works">How it works</NavItem>
            <NavItem to="/faq">FAQ</NavItem>
            <NavItem to="/support">Support</NavItem>
          </div>
        </LayoutGroup>

        <div className="flex items-center gap-2">
          {/* Desktop auth controls */}
          <div
            className={`hidden items-center gap-2 transition-opacity duration-300 md:flex ${
              authReady ? "opacity-100" : "opacity-0"
            }`}
          >
            {authed ? (
              <div ref={menuRef} className="relative">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-full border border-border bg-surface/60 py-1 pl-1 pr-2.5 text-[12px] font-medium text-foreground transition-all hover:border-muted-foreground/40 hover:bg-surface-elevated"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary">
                    {initials}
                  </span>
                  <span className="hidden max-w-[80px] truncate sm:inline">
                    {user?.name || "Account"}
                  </span>
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </button>
                {menuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-popover shadow-elevated animate-fade-up"
                    style={{ animationDuration: "180ms" }}
                  >
                    <div className="border-b border-border px-3 py-2.5">
                      <div className="truncate text-[13px] font-medium text-foreground">
                        {user?.name || "Member"}
                      </div>
                      <div className="truncate text-[11px] text-muted-foreground">
                        {user?.email}
                      </div>
                    </div>
                    <MenuLink to="/dashboard" icon={LayoutDashboard}>
                      Dashboard
                    </MenuLink>
                    <MenuLink to="/orders" icon={ShoppingBag}>
                      My Orders
                    </MenuLink>
                    <MenuLink to="/myprofile" icon={User}>
                      Profile
                    </MenuLink>
                    <button
                      onClick={() => {
                        clearSession();
                        setAuthed(false);
                        setMenuOpen(false);
                        navigate({ to: "/" });
                      }}
                      className="flex w-full items-center gap-2.5 border-t border-border px-3 py-2.5 text-left text-[13px] text-muted-foreground transition-colors hover:bg-surface-elevated hover:text-foreground"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Log out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-md px-2.5 py-1.5 text-[12.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3.5 py-1.5 text-[12.5px] font-semibold tracking-[-0.005em] text-background shadow-[0_1px_0_rgba(255,255,255,0.18)_inset,0_1px_2px_rgba(0,0,0,0.45)] transition-[background-color,transform] duration-150 hover:bg-foreground/92 active:scale-[0.985]"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile: hamburger or avatar */}
          <div className="flex items-center md:hidden">
            {authed ? (
              <button
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-surface/60 text-foreground transition-all active:scale-95"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary">
                  {initials}
                </span>
              </button>
            ) : (
              <button
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
                aria-expanded={mobileOpen}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-surface/60 text-foreground transition-all active:scale-95"
              >
                <Menu className="h-[18px] w-[18px]" />
              </button>
            )}
          </div>
        </div>
      </nav>
    </header>

    <MobileMenu
      open={mobileOpen}
      onClose={() => setMobileOpen(false)}
      pathname={pathname}
      authed={authed}
      user={user}
      initials={initials}
      onLogout={() => {
        clearSession();
        setAuthed(false);
        setMobileOpen(false);
        navigate({ to: "/" });
      }}
    />
    </>
  );
}

function MobileMenu({
  open,
  onClose,
  pathname,
  authed,
  user,
  initials,
  onLogout,
}: {
  open: boolean;
  onClose: () => void;
  pathname: string;
  authed: boolean;
  user: AuthUser | null;
  initials: string;
  onLogout: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] md:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-xl"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          />

          {/* Drawer — slides in from left */}
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
            className="absolute left-0 top-0 flex h-full w-[86%] max-w-[340px] flex-col overflow-hidden rounded-r-[28px] border-r border-white/[0.06] bg-[rgba(10,11,13,0.78)] shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)] backdrop-blur-2xl"
            style={{
              paddingTop: "calc(env(safe-area-inset-top, 0px) + 20px)",
              paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 20px)",
              paddingLeft: "calc(env(safe-area-inset-left, 0px) + 20px)",
              paddingRight: "20px",
            }}
            initial={{ x: "-100%", opacity: 0.6, scale: 0.98 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: "-100%", opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 360, damping: 38, mass: 0.85 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ left: 0.4, right: 0 }}
            onDragEnd={(_, info) => {
              if (info.offset.x < -80 || info.velocity.x < -500) onClose();
            }}
          >
            {/* Subtle inner highlight */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-white/5 to-transparent"
            />

            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background">
                  <span className="font-display text-[14px] font-bold tracking-tight">S</span>
                </span>
                <span className="font-display text-[15px] font-semibold tracking-tight text-foreground">
                  SymDeals
                </span>
              </div>
              <button
                onClick={onClose}
                aria-label="Close menu"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.03] text-muted-foreground transition-all hover:bg-white/[0.06] hover:text-foreground active:scale-95"
              >
                <X className="h-[16px] w-[16px]" strokeWidth={2.2} />
              </button>
            </div>

            {authed && user && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08, duration: 0.3 }}
                className="relative mt-6 flex items-center gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.02] p-3"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.08] text-[11px] font-semibold text-foreground">
                  {initials}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-medium text-foreground">
                    {user.name || "Member"}
                  </div>
                  <div className="truncate text-[11px] text-muted-foreground">{user.email}</div>
                </div>
              </motion.div>
            )}

            <nav className="relative mt-8 flex flex-col gap-0.5">
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="mb-2 px-3 text-[10.5px] font-medium uppercase tracking-[0.12em] text-muted-foreground/60"
              >
                Menu
              </motion.p>
              {MOBILE_NAV_ITEMS.map((item, i) => {
                const active = pathname === item.to;
                const Icon = item.Icon;
                return (
                  <motion.div
                    key={item.to}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{
                      delay: 0.12 + i * 0.045,
                      duration: 0.35,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    <Link
                      to={item.to}
                      onClick={onClose}
                      className={`group relative flex items-center gap-3 rounded-xl px-3.5 py-3.5 text-[14.5px] font-medium tracking-tight transition-colors duration-200 ${
                        active
                          ? "text-background"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId="mobile-nav-active"
                          className="absolute inset-0 rounded-xl bg-white shadow-[0_1px_0_0_rgba(255,255,255,0.4)_inset,0_8px_20px_-10px_rgba(0,0,0,0.5)]"
                          transition={{ type: "spring", stiffness: 380, damping: 34 }}
                        />
                      )}
                      <Icon
                        className={`relative h-[17px] w-[17px] transition-colors ${
                          active ? "text-background" : "text-muted-foreground group-hover:text-foreground"
                        }`}
                        strokeWidth={active ? 2.2 : 1.8}
                      />
                      <span className="relative">{item.label}</span>
                      {active && (
                        <motion.span
                          layoutId="mobile-nav-dot"
                          className="relative ml-auto h-1.5 w-1.5 rounded-full bg-emerald-500"
                          transition={{ type: "spring", stiffness: 380, damping: 34 }}
                        />
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </nav>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.4 }}
              className="relative mt-auto flex flex-col gap-2 pt-8"
            >
              {authed ? (
                <>
                  <Link
                    to="/dashboard"
                    onClick={onClose}
                    className="flex items-center justify-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-[13px] font-medium text-foreground transition-all hover:bg-white/[0.06] active:scale-[0.98]"
                  >
                    <LayoutDashboard className="h-4 w-4" strokeWidth={1.8} />
                    Dashboard
                  </Link>
                  <button
                    onClick={onLogout}
                    className="flex items-center justify-center gap-2 rounded-full px-4 py-3 text-[12.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <LogOut className="h-3.5 w-3.5" strokeWidth={1.8} />
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={onClose}
                    className="flex items-center justify-center gap-2 rounded-full border border-white/[0.1] bg-transparent px-4 py-3 text-[13px] font-medium text-foreground transition-all hover:bg-white/[0.04] active:scale-[0.98]"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/signup"
                    onClick={onClose}
                    className="flex items-center justify-center gap-2 rounded-full bg-white px-4 py-3 text-[13px] font-semibold tracking-tight text-background shadow-[0_8px_24px_-12px_rgba(255,255,255,0.3)] transition-all hover:bg-white/95 active:scale-[0.98]"
                  >
                    Create Account
                  </Link>
                </>
              )}
            </motion.div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function NavItem({ to, children }: { to: string; children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = pathname === to;
  return (
    <Link
      to={to}
      className={`relative rounded-full px-3 py-1.5 text-[12.5px] font-medium transition-colors hover:text-foreground ${
        isActive ? "text-foreground" : "text-muted-foreground"
      }`}
    >
      <span className="relative z-10">{children}</span>
      {isActive && (
        <motion.span
          layoutId="nav-active-underline"
          className="absolute inset-x-3 -bottom-0.5 h-[2px] rounded-full bg-foreground"
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
          aria-hidden
        />
      )}
    </Link>
  );
}

function MenuLink({
  to,
  icon: Icon,
  children,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-muted-foreground transition-colors hover:bg-surface-elevated hover:text-foreground"
    >
      <Icon className="h-3.5 w-3.5" />
      {children}
    </Link>
  );
}
