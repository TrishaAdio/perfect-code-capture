import { useEffect, useState } from "react";
import {
  applyLevel,
  readStoredPreference,
  resolveLevel,
  type MotionPreference,
} from "@/lib/animation-preference";

/**
 * Mount-once: resolves the stored MotionPreference (or auto-detects) and
 * applies the matching `perf-*` class to <html>. Listens for cross-component
 * preference changes so the entire UI updates without a reload.
 */
export function useDevicePerformance() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const apply = () => applyLevel(resolveLevel(readStoredPreference()));
    apply();

    const onChange = () => apply();
    window.addEventListener("symdeals:motion-changed", onChange);
    const mm = window.matchMedia("(prefers-reduced-motion: reduce)");
    mm.addEventListener?.("change", onChange);
    return () => {
      window.removeEventListener("symdeals:motion-changed", onChange);
      mm.removeEventListener?.("change", onChange);
    };
  }, []);
}

/** Reactive accessor for components that need to render based on the preference. */
export function useMotionPreference(): [MotionPreference, (p: MotionPreference) => void] {
  const [pref, setPref] = useState<MotionPreference>(() => readStoredPreference());

  useEffect(() => {
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<MotionPreference>).detail;
      if (detail) setPref(detail);
      else setPref(readStoredPreference());
    };
    window.addEventListener("symdeals:motion-changed", onChange);
    return () => window.removeEventListener("symdeals:motion-changed", onChange);
  }, []);

  return [pref, setPref];
}
