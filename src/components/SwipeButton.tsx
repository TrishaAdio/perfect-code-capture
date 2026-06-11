import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowRight, Check, Loader2, Lock } from "lucide-react";

type SwipeState = "idle" | "loading" | "success";

const THUMB_WIDTH = 48; // px
const TRACK_PADDING = 4; // total horizontal padding inside track (2px each side)

export function SwipeButton({
  label = "DRAG SLIDER TO THE RIGHT",
  loadingLabel = "CREATING ACCOUNT…",
  successLabel = "ACCOUNT CREATED",
  onConfirm,
  shake = false,
  disabled = false,
  resetSignal = 0,
}: {
  label?: string;
  loadingLabel?: string;
  successLabel?: string;
  onConfirm: () => void;
  shake?: boolean;
  /** When true, slider is faded and not interactive (e.g. form not yet valid). */
  disabled?: boolean;
  /** Increment to force the slider back to its idle state (e.g. on submit error). */
  resetSignal?: number;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const shakeRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [state, setState] = useState<SwipeState>("idle");
  const [dragging, setDragging] = useState(false);
  const [trackWidth, setTrackWidth] = useState(0);
  const startXRef = useRef(0);
  const startProgressRef = useRef(0);
  const progressRef = useRef(0);
  const draggingRef = useRef(false);
  const loadingTimerRef = useRef<number | null>(null);
  const confirmTimerRef = useRef<number | null>(null);

  const updateProgress = useCallback((next: number) => {
    progressRef.current = next;
    setProgress(next);
  }, []);

  useEffect(() => {
    if (!shake || !shakeRef.current) return;
    const animation = shakeRef.current.animate(
      [
        { transform: "translateX(0)" },
        { transform: "translateX(-7px)" },
        { transform: "translateX(7px)" },
        { transform: "translateX(-5px)" },
        { transform: "translateX(5px)" },
        { transform: "translateX(0)" },
      ],
      { duration: 400, easing: "ease-in-out" },
    );
    return () => animation.cancel();
  }, [shake]);

  // Reset back to idle when parent signals (e.g. registration failed).
  useEffect(() => {
    if (resetSignal === 0) return;
    if (loadingTimerRef.current) window.clearTimeout(loadingTimerRef.current);
    if (confirmTimerRef.current) window.clearTimeout(confirmTimerRef.current);
    draggingRef.current = false;
    setState("idle");
    updateProgress(0);
    setDragging(false);
  }, [resetSignal, updateProgress]);

  useEffect(() => {
    return () => {
      if (loadingTimerRef.current) window.clearTimeout(loadingTimerRef.current);
      if (confirmTimerRef.current) window.clearTimeout(confirmTimerRef.current);
    };
  }, []);

  // Measure track width on mount + on resize so the slider is ready immediately.
  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const measure = () => setTrackWidth(track.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const maxTranslate = Math.max(0, trackWidth - THUMB_WIDTH - TRACK_PADDING);

  const finish = useCallback(() => {
    setState("loading");
    updateProgress(1);
    loadingTimerRef.current = window.setTimeout(() => {
      setState("success");
      confirmTimerRef.current = window.setTimeout(() => {
        onConfirm();
      }, 500);
    }, 800);
  }, [onConfirm, updateProgress]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (state !== "idle" || maxTranslate <= 0 || disabled) return;
    draggingRef.current = true;
    setDragging(true);
    startXRef.current = e.clientX;
    startProgressRef.current = progressRef.current;
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current || state !== "idle" || maxTranslate <= 0) return;
    const dx = e.clientX - startXRef.current;
    const next = Math.min(
      1,
      Math.max(0, startProgressRef.current + dx / maxTranslate),
    );
    updateProgress(next);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setDragging(false);
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    if (progressRef.current > 0.92) {
      finish();
    } else {
      updateProgress(0);
    }
  };

  const translate = progress * maxTranslate;
  const textOpacity = Math.max(0, 1 - progress * 1.8);

  return (
    <div
      className={`space-y-2 transition-opacity duration-300 ${disabled ? "opacity-50" : "opacity-100"}`}
    >
      <div className="label-uppercase">
        {state === "loading"
          ? loadingLabel
          : state === "success"
            ? successLabel
            : disabled
              ? "COMPLETE FORM TO CONTINUE"
              : label}
      </div>
      <div ref={shakeRef}>
        <div
          ref={trackRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className={`relative h-12 w-full select-none overflow-hidden rounded-md border bg-input px-0.5 py-0.5 transition-colors duration-300 ${
            disabled ? "border-border" : "border-primary/40"
          }`}
          style={{ touchAction: "none" }}
        >
          {/* Filled green progress trail */}
          <div
            className="absolute inset-y-0.5 left-0.5 rounded-[5px] bg-primary/15"
            style={{
              width: `${translate + 48}px`,
              transition: dragging
                ? "none"
                : "width 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          />

          {/* Track guide line */}
          <div className="pointer-events-none absolute left-14 right-3 top-1/2 h-px -translate-y-1/2 bg-border" />

          {/* Idle label */}
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground transition-opacity"
            style={{ opacity: state === "idle" ? textOpacity : 0 }}
          >
            {disabled ? "Locked" : "Slide to register"}
          </div>

          {state === "loading" && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Processing
            </div>
          )}
          {state === "success" && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
              <Check className="h-3.5 w-3.5" />
              Verified
            </div>
          )}

          {/* Thumb */}
          <button
            type="button"
            aria-label="Slide to confirm"
            aria-disabled={state !== "idle" || disabled}
            tabIndex={state === "idle" && !disabled ? 0 : -1}
            className={`absolute top-0.5 left-0.5 flex h-11 w-12 touch-none items-center justify-center rounded-[5px] text-primary-foreground transition-all duration-300 active:cursor-grabbing disabled:cursor-not-allowed ${
              disabled
                ? "cursor-not-allowed bg-muted-foreground/40"
                : "cursor-grab bg-primary"
            }`}
            style={{
              transform: `translateX(${translate}px)`,
              touchAction: "none",
              transition: dragging
                ? "none"
                : "transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), background-color 0.3s",
              boxShadow: disabled
                ? "none"
                : "0 0 0 1px rgba(0,0,0,0.2) inset, 0 4px 12px -2px rgba(0,175,126,0.4)",
            }}
          >
            {state === "loading" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : state === "success" ? (
              <Check className="h-4 w-4" />
            ) : disabled ? (
              <Lock className="h-4 w-4" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
