/**
 * Animation & Performance preference.
 * Source of truth for how much motion the UI applies.
 *
 * Levels:
 *  - high    — rich animations, enhanced parallax (flagship devices)
 *  - smooth  — balanced premium animations (default for capable devices)
 *  - medium  — lightweight animations, fast interactions (best compatibility)
 *  - minimal — very subtle animations, designed for low-end devices
 *  - off     — disable all non-essential animations
 *  - auto    — pick automatically from device capability (the default)
 */
export type MotionLevel = "high" | "smooth" | "medium" | "minimal" | "off";
export type MotionPreference = MotionLevel | "auto";

const STORAGE_KEY = "symdeals:motion-level";

const LEVEL_CLASS: Record<MotionLevel, string> = {
  high: "perf-high",
  smooth: "perf-smooth",
  medium: "perf-medium",
  minimal: "perf-lite",
  off: "perf-off",
};

const ALL_CLASSES = Object.values(LEVEL_CLASS).concat(["perf-rich"]);

export function readStoredPreference(): MotionPreference {
  if (typeof window === "undefined") return "auto";
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    if (v === "high" || v === "smooth" || v === "medium" || v === "minimal" || v === "off") {
      return v;
    }
  } catch {
    /* ignore */
  }
  return "auto";
}

export function writeStoredPreference(pref: MotionPreference) {
  if (typeof window === "undefined") return;
  try {
    if (pref === "auto") window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, pref);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent("symdeals:motion-changed", { detail: pref }));
}

/** Detect a sensible automatic level from device signals. */
export function detectAutoLevel(): MotionLevel {
  if (typeof window === "undefined") return "smooth";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return "off";

  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean; effectiveType?: string };
  };
  const mem = nav.deviceMemory ?? 8;
  const cores = navigator.hardwareConcurrency || 8;
  const conn = nav.connection;
  const slowNet =
    !!conn &&
    (conn.saveData === true ||
      conn.effectiveType === "2g" ||
      conn.effectiveType === "slow-2g");
  const coarseSmall =
    window.matchMedia("(pointer: coarse)").matches && window.innerWidth < 768;

  if (mem <= 2 || cores <= 2 || slowNet) return "minimal";
  if (mem <= 4 || cores <= 4 || coarseSmall) return "medium";
  if (mem >= 8 && cores >= 8) return "high";
  return "smooth";
}

/** Apply a level by toggling classes on <html>. Idempotent. */
export function applyLevel(level: MotionLevel) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  ALL_CLASSES.forEach((c) => root.classList.remove(c));
  root.classList.add(LEVEL_CLASS[level]);
  if (level === "high" || level === "smooth") root.classList.add("perf-rich");
  root.dataset.motion = level;
}

/** Resolve a preference (auto → detected) to a concrete level. */
export function resolveLevel(pref: MotionPreference): MotionLevel {
  return pref === "auto" ? detectAutoLevel() : pref;
}
