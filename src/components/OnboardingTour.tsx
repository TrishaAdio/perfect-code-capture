import { useEffect, useLayoutEffect, useState } from "react";

const STORAGE_PREFIX = "tour_seen:";

function getCurrentUserId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("symdeals.user");
    if (!raw) return null;
    const u = JSON.parse(raw) as { id?: string; email?: string };
    return u?.id || u?.email || null;
  } catch {
    return null;
  }
}

function getStorageKey(): string | null {
  const uid = getCurrentUserId();
  return uid ? `${STORAGE_PREFIX}${uid}` : null;
}

type TourStep = {
  selector: string;
  title: string;
  body: string;
  placement?: "top" | "bottom";
};

const STEPS: TourStep[] = [
  {
    selector: '[data-tour="categories"]',
    title: "Categories",
    body: "Browse services by category to find what you need faster.",
    placement: "bottom",
  },
  {
    selector: '[data-tour="products"]',
    title: "Products",
    body: "Explore available services and choose what fits your needs.",
    placement: "top",
  },
  {
    selector: '[data-tour="search"]',
    title: "Search",
    body: "Use search to quickly find any service.",
    placement: "bottom",
  },
];

type Rect = { top: number; left: number; width: number; height: number };

function getRect(selector: string): Rect | null {
  const el = document.querySelector(selector) as HTMLElement | null;
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

export function OnboardingTour() {
  const [phase, setPhase] = useState<"hidden" | "welcome" | "tour" | "final">("hidden");
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const key = getStorageKey();
      if (!key) return; // no logged-in user → don't show tour
      if (!localStorage.getItem(key)) {
        const t = setTimeout(() => setPhase("welcome"), 400);
        return () => clearTimeout(t);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const finish = () => {
    try {
      const key = getStorageKey();
      if (key) localStorage.setItem(key, "true");
    } catch {
      /* ignore */
    }
    setPhase("hidden");
  };

  useLayoutEffect(() => {
    if (phase !== "tour") return;
    const step = STEPS[stepIndex];
    if (!step) return;

    const el = document.querySelector(step.selector) as HTMLElement | null;
    if (!el) {
      if (stepIndex < STEPS.length - 1) setStepIndex((i) => i + 1);
      else setPhase("final");
      return;
    }

    el.scrollIntoView({ behavior: "smooth", block: "center" });

    let raf = 0;
    const measure = () => {
      const r = getRect(step.selector);
      if (r) setRect(r);
    };
    const t = setTimeout(() => {
      measure();
      raf = requestAnimationFrame(measure);
    }, 500);

    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);

    return () => {
      clearTimeout(t);
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [phase, stepIndex]);

  const next = () => {
    if (stepIndex < STEPS.length - 1) setStepIndex((i) => i + 1);
    else setPhase("final");
  };

  if (phase === "hidden") return null;

  // ---------- WELCOME ----------
  if (phase === "welcome") {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
        <div
          className="absolute inset-0 bg-black/75 backdrop-blur-md animate-in fade-in duration-300"
          onClick={finish}
        />
        <div className="relative w-full max-w-md rounded-2xl border border-white/15 bg-background/95 p-7 text-center shadow-[0_10px_60px_-10px_rgba(0,0,0,0.7)] animate-in fade-in zoom-in-95 duration-500">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            Welcome to SymDeals
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Take a quick tour to understand how everything works.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button
              onClick={() => {
                setStepIndex(0);
                setPhase("tour");
              }}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-foreground px-6 text-sm font-semibold text-background transition-transform hover:scale-[1.02]"
            >
              Start Tour
            </button>
            <button
              onClick={finish}
              className="inline-flex h-11 items-center justify-center rounded-lg border border-white/15 bg-transparent px-6 text-sm font-medium text-foreground transition-colors hover:border-white/30"
            >
              Skip
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- FINAL ----------
  if (phase === "final") {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-500" />
        <div className="relative w-full max-w-md rounded-2xl border border-white/15 bg-background/95 p-8 text-center shadow-[0_10px_60px_-10px_rgba(0,0,0,0.7)] animate-in fade-in zoom-in-95 duration-500">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            You are ready to explore
          </h2>
          <button
            onClick={finish}
            className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-lg bg-foreground px-6 text-sm font-semibold text-background transition-transform hover:scale-[1.02]"
          >
            Finish
          </button>
        </div>
      </div>
    );
  }

  // ---------- TOUR STEP ----------
  const step = STEPS[stepIndex];
  const pad = 10;
  const spotlight = rect
    ? {
        top: Math.max(8, rect.top - pad),
        left: Math.max(8, rect.left - pad),
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
      }
    : null;

  let tooltipStyle: React.CSSProperties = {
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
  };
  if (spotlight) {
    const vw = typeof window !== "undefined" ? window.innerWidth : 1024;
    const vh = typeof window !== "undefined" ? window.innerHeight : 800;
    const tooltipH = 150;
    const tooltipW = Math.min(360, vw - 24);
    const below = spotlight.top + spotlight.height + 16;
    const above = spotlight.top - tooltipH - 16;
    const placeBelow = step.placement !== "top" && below + tooltipH < vh;
    const centerX = spotlight.left + spotlight.width / 2;
    const clampedLeft = Math.min(
      Math.max(centerX, tooltipW / 2 + 12),
      vw - tooltipW / 2 - 12,
    );
    tooltipStyle = placeBelow
      ? { top: below, left: clampedLeft, transform: "translateX(-50%)" }
      : above > 16
        ? { top: above, left: clampedLeft, transform: "translateX(-50%)" }
        : { top: 24, left: "50%", transform: "translateX(-50%)" };
  }

  return (
    <div className="fixed inset-0 z-[100]">
      {spotlight ? (
        <div
          className="pointer-events-auto absolute rounded-xl animate-tour-glow transition-all duration-500 ease-in-out"
          style={{
            top: spotlight.top,
            left: spotlight.left,
            width: spotlight.width,
            height: spotlight.height,
          }}
          onClick={next}
        />
      ) : null}

      {/* Dim backdrop without spotlight cutout — keeps focus minimal */}
      <div
        className="absolute inset-0 -z-10 bg-black/55 backdrop-blur-[2px] transition-opacity duration-500"
        onClick={next}
      />

      {/* Tooltip */}
      <div
        className="absolute z-10 w-[min(92vw,360px)] rounded-xl border border-white/15 bg-background/95 p-5 shadow-[0_10px_40px_-8px_rgba(0,0,0,0.6)] backdrop-blur-md transition-all duration-500 ease-in-out animate-in fade-in zoom-in-95"
        style={tooltipStyle}
      >
        <div className="flex items-center justify-between">
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Step {stepIndex + 1} of {STEPS.length}
          </span>
          <button
            onClick={finish}
            className="text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Skip
          </button>
        </div>
        <h3 className="mt-2 font-display text-lg font-semibold text-foreground">{step.title}</h3>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">{step.body}</p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === stepIndex ? "w-6 bg-foreground" : "w-1.5 bg-white/20"
                }`}
              />
            ))}
          </div>
          <button
            onClick={next}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-foreground px-4 text-[13px] font-semibold text-background transition-transform hover:scale-[1.03]"
          >
            {stepIndex < STEPS.length - 1 ? "Next" : "Finish"}
          </button>
        </div>
      </div>
    </div>
  );
}
