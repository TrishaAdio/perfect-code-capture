import { useEffect, useRef } from "react";

/**
 * Cinematic ambient background:
 * - Base black wash
 * - Slow drifting emerald + teal + navy radial glows (GPU-accelerated transforms)
 * - Subtle grid overlay (low opacity)
 * - Gentle parallax driven by mouse position
 *
 * Fixed to the viewport so it spans the entire page without seams.
 */
export function AmbientBackground() {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (document.documentElement.classList.contains("perf-lite")) return;

    let raf = 0;
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;

    const onMove = (e: MouseEvent) => {
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;
      // -1 .. 1 range, then scaled down for subtlety
      tx = ((e.clientX / w) * 2 - 1) * 18;
      ty = ((e.clientY / h) * 2 - 1) * 18;
    };

    const tick = () => {
      cx += (tx - cx) * 0.045;
      cy += (ty - cy) * 0.045;
      el.style.setProperty("--mx", `${cx.toFixed(2)}px`);
      el.style.setProperty("--my", `${cy.toFixed(2)}px`);
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      aria-hidden
      className="ambient-root pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      {/* Deep base wash — pure noir foundation */}
      <div className="absolute inset-0 ambient-base" />

      {/* Layered animated glows (each on its own transform layer for GPU) */}
      <div className="absolute inset-0 ambient-layer ambient-emerald" />
      <div className="absolute inset-0 ambient-layer ambient-blue" />
      <div className="absolute inset-0 ambient-layer ambient-teal" />
      <div className="absolute inset-0 ambient-layer ambient-navy" />

      {/* Soft grid (very low opacity) */}
      <div className="absolute inset-0 ambient-grid" />

      {/* Vignette to soften edges */}
      <div className="absolute inset-0 ambient-vignette" />
    </div>
  );
}
