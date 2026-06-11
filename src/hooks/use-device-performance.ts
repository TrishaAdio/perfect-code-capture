import { useEffect } from "react";

/**
 * Detects low-end devices and toggles a `perf-lite` class on <html>.
 * CSS uses that class to disable expensive effects (blur, large radial
 * glows, infinite animations). Runs once on mount, idempotent.
 *
 * Signals considered:
 *  - prefers-reduced-motion        → always lite
 *  - navigator.deviceMemory < 4    → lite
 *  - navigator.hardwareConcurrency < 4 → lite
 *  - Network: saveData or 2g/slow-2g → lite
 *  - Coarse pointer + small viewport (mobile) → lite by default
 */
export function useDevicePerformance() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nav = navigator as Navigator & {
      deviceMemory?: number;
      connection?: { saveData?: boolean; effectiveType?: string };
    };
    const lowMemory = typeof nav.deviceMemory === "number" && nav.deviceMemory < 4;
    const lowCpu =
      typeof navigator.hardwareConcurrency === "number" &&
      navigator.hardwareConcurrency > 0 &&
      navigator.hardwareConcurrency < 4;
    const conn = nav.connection;
    const slowNet =
      !!conn &&
      (conn.saveData === true ||
        conn.effectiveType === "2g" ||
        conn.effectiveType === "slow-2g");
    const coarseSmall =
      window.matchMedia("(pointer: coarse)").matches && window.innerWidth < 768;

    const lite = reduceMotion || lowMemory || lowCpu || slowNet || coarseSmall;
    root.classList.toggle("perf-lite", lite);
    root.classList.toggle("perf-rich", !lite);
  }, []);
}
