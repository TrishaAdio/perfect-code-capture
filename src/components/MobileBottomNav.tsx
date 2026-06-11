import { useNavigate, useRouterState } from "@tanstack/react-router";
import { motion, useMotionValue, animate } from "framer-motion";
import { Headphones, LayoutDashboard, ShoppingBag, ShoppingCart, User } from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, useCallback } from "react";

type PanelKey = "overview" | "browse" | "orders" | "cart" | "support" | "settings";

const TABS: { panel: PanelKey; label: string; Icon: typeof LayoutDashboard }[] = [
  { panel: "overview", label: "Home",    Icon: LayoutDashboard },
  { panel: "orders",   label: "Orders",  Icon: ShoppingBag },
  { panel: "cart",     label: "Cart",    Icon: ShoppingCart },
  { panel: "support",  label: "Help",    Icon: Headphones },
  { panel: "settings", label: "Account", Icon: User },
];

const SPRING = { type: "spring" as const, stiffness: 380, damping: 32, mass: 0.8 };
const SWIPE_THRESHOLD = 6; // px before we treat as a drag

/**
 * Persistent mobile bottom navigation with iOS-style hold-and-swipe.
 * - Tap = navigate to that tab
 * - Hold + drag = pill follows finger; releases on tab under finger
 */
export function MobileBottomNav() {
  const navigate = useNavigate();
  const location = useRouterState({ select: (r) => r.location });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const dragStartXRef = useRef<number | null>(null);
  const draggingRef = useRef(false);
  const [mounted, setMounted] = useState(false);

  const currentPanel: PanelKey = useMemo(() => {
    if (location.pathname === "/dashboard") {
      const p = (location.search as { panel?: string } | undefined)?.panel;
      if (p && TABS.some((t) => t.panel === p)) return p as PanelKey;
      return "overview";
    }
    if (location.pathname === "/orders") return "orders";
    if (location.pathname === "/support") return "support";
    if (location.pathname === "/myprofile") return "settings";
    return "overview";
  }, [location.pathname, location.search]);

  const activeIdx = Math.max(0, TABS.findIndex((t) => t.panel === currentPanel));
  const displayIdx = hoverIdx ?? activeIdx;

  const pillX = useMotionValue(0);
  const pillW = useMotionValue(0);

  const measureTo = useCallback((idx: number, immediate: boolean) => {
    const el = tabRefs.current[idx];
    const container = containerRef.current;
    if (!el || !container) return;
    const er = el.getBoundingClientRect();
    const cr = container.getBoundingClientRect();
    const x = er.left - cr.left;
    const w = er.width;
    if (immediate) {
      pillX.set(x);
      pillW.set(w);
    } else {
      animate(pillX, x, SPRING);
      animate(pillW, w, SPRING);
    }
  }, [pillX, pillW]);

  useLayoutEffect(() => {
    measureTo(activeIdx, true);
    setMounted(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mounted) return;
    measureTo(displayIdx, false);
  }, [displayIdx, mounted, measureTo]);

  useEffect(() => {
    const onResize = () => measureTo(displayIdx, true);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [displayIdx, measureTo]);

  const goToPanel = (p: PanelKey) => {
    if (p === currentPanel && location.pathname === "/dashboard") return;
    navigate({
      to: "/dashboard",
      search: p === "overview" ? {} : { panel: p },
    });
  };

  const idxFromClientX = (clientX: number): number => {
    const refs = tabRefs.current;
    for (let i = 0; i < refs.length; i++) {
      const el = refs[i];
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (clientX >= r.left && clientX <= r.right) return i;
    }
    // clamp to nearest
    if (refs[0]) {
      const first = refs[0].getBoundingClientRect();
      if (clientX < first.left) return 0;
    }
    return refs.length - 1;
  };

  const handlePointerDown = (e: React.PointerEvent, idx: number) => {
    dragStartXRef.current = e.clientX;
    draggingRef.current = false;
    setDragging(false);
    setHoverIdx(idx);
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragStartXRef.current === null) return;
    const dx = Math.abs(e.clientX - dragStartXRef.current);
    if (!draggingRef.current && dx < SWIPE_THRESHOLD) return;
    if (!draggingRef.current) {
      draggingRef.current = true;
      setDragging(true);
    }
    const idx = idxFromClientX(e.clientX);
    if (idx !== hoverIdx) setHoverIdx(idx);
  };

  const handlePointerEnd = (e: React.PointerEvent, fallbackIdx: number) => {
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {}
    const wasDragging = draggingRef.current;
    const finalIdx = wasDragging ? idxFromClientX(e.clientX) : fallbackIdx;
    dragStartXRef.current = null;
    draggingRef.current = false;
    setDragging(false);
    setHoverIdx(null);
    goToPanel(TABS[finalIdx].panel);
  };

  const handlePointerCancel = () => {
    dragStartXRef.current = null;
    draggingRef.current = false;
    setDragging(false);
    setHoverIdx(null);
  };

  return (
    <nav
      className="fixed inset-x-3 z-40 lg:hidden"
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)" }}
      aria-label="Primary"
    >
      <div
        ref={containerRef}
        className="relative flex items-center justify-around overflow-hidden rounded-[22px] border border-white/[0.08] bg-[rgba(14,16,20,0.72)] px-1.5 py-1.5 shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset,0_18px_40px_-18px_rgba(0,0,0,0.7)] backdrop-blur-2xl"
        style={{ touchAction: "pan-y" }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
        />

        <motion.div
          aria-hidden
          style={{ x: pillX, width: pillW }}
          animate={{ scale: dragging ? 1.05 : 1 }}
          transition={SPRING}
          className="pointer-events-none absolute top-1.5 bottom-1.5 left-0 rounded-[16px] border border-emerald-400/15 bg-white/[0.06] shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset,0_8px_24px_-12px_rgba(52,211,153,0.35)]"
        >
          <span className="absolute inset-0 rounded-[16px] bg-[radial-gradient(60%_80%_at_50%_50%,rgba(52,211,153,0.18),transparent_70%)]" />
        </motion.div>

        {TABS.map((item, idx) => {
          const Icon = item.Icon;
          const active = idx === displayIdx;
          return (
            <button
              key={item.label + idx}
              type="button"
              ref={(el) => { tabRefs.current[idx] = el; }}
              aria-label={item.label}
              aria-current={idx === activeIdx ? "page" : undefined}
              onPointerDown={(e) => handlePointerDown(e, idx)}
              onPointerMove={handlePointerMove}
              onPointerUp={(e) => handlePointerEnd(e, idx)}
              onPointerCancel={handlePointerCancel}
              className="relative z-10 flex flex-1 items-center justify-center outline-none"
              style={{ WebkitTapHighlightColor: "transparent", touchAction: "pan-y" }}
            >
              <motion.span
                animate={{
                  scale: active ? (dragging ? 1.08 : 1.04) : 1,
                  y: active ? -1 : 0,
                }}
                transition={SPRING}
                className="relative flex flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-[10px] font-medium tracking-tight"
              >
                <Icon
                  className={`h-[18px] w-[18px] transition-colors duration-300 ${
                    active ? "text-emerald-300" : "text-muted-foreground"
                  }`}
                  style={active ? { filter: "drop-shadow(0 0 6px rgba(52,211,153,0.45))" } : undefined}
                />
                <span className={active ? "text-foreground" : "text-muted-foreground"}>
                  {item.label}
                </span>
              </motion.span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
