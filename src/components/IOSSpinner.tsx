type Props = {
  size?: number;
  className?: string;
  /** Tailwind text-* color class applied to the spinner segments. */
  tone?: string;
};

/**
 * iOS-style segmented activity indicator.
 * 12 tapered bars rotated around a center, each fading out of phase.
 * Inherits `currentColor` from `tone` so it tints with the design system.
 */
export function IOSSpinner({ size = 20, className = "", tone = "text-primary" }: Props) {
  const bars = Array.from({ length: 12 });
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block ${tone} ${className}`}
      style={{ width: size, height: size }}
    >
      <span
        className="relative block"
        style={{ width: size, height: size }}
      >
        {bars.map((_, i) => (
          <span
            key={i}
            className="absolute left-1/2 top-1/2 block rounded-full bg-current"
            style={{
              width: Math.max(1.5, size * 0.085),
              height: size * 0.28,
              marginLeft: -Math.max(1.5, size * 0.085) / 2,
              marginTop: -size * 0.5,
              transformOrigin: `50% ${size * 0.5}px`,
              transform: `rotate(${i * 30}deg)`,
              animation: "ios-spinner-fade 1s linear infinite",
              animationDelay: `${(i - 12) * (1 / 12)}s`,
              opacity: 0.15,
            }}
          />
        ))}
      </span>
      <style>{`
        @keyframes ios-spinner-fade {
          0% { opacity: 1; }
          100% { opacity: 0.15; }
        }
      `}</style>
    </span>
  );
}
