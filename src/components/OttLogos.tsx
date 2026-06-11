// Inline SVG marks of major OTT platforms used as floating accents.
// These are simplified glyph-style representations for visual signaling.

export function NetflixMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="nfx" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff1f1f" />
          <stop offset="100%" stopColor="#b00610" />
        </linearGradient>
      </defs>
      <rect x="6" y="4" width="52" height="56" rx="10" fill="#0a0a0a" />
      <path
        d="M22 14h6l8 22V14h6v36h-6l-8-22v22h-6z"
        fill="url(#nfx)"
      />
    </svg>
  );
}

export function PrimeMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect x="4" y="4" width="56" height="56" rx="12" fill="#0f1726" />
      <text
        x="32"
        y="34"
        textAnchor="middle"
        fontFamily="system-ui, sans-serif"
        fontWeight="800"
        fontSize="14"
        fill="#ffffff"
      >
        prime
      </text>
      <path
        d="M14 42c8 6 28 6 36 0"
        stroke="#00a8e1"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M48 40l4 4-6 1z" fill="#00a8e1" />
    </svg>
  );
}

export function YouTubeMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect x="2" y="12" width="60" height="40" rx="10" fill="#ff0033" />
      <path d="M27 23l16 9-16 9z" fill="#ffffff" />
    </svg>
  );
}

export function DisneyHotstarMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="hs" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1f80e0" />
          <stop offset="100%" stopColor="#0a3a8c" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="56" height="56" rx="14" fill="url(#hs)" />
      <path
        d="M32 14l4.4 11.4L48 26l-9 7.4L42.4 46 32 39l-10.4 7L25 33.4 16 26l11.6-.6z"
        fill="#ffffff"
      />
    </svg>
  );
}

export function SpotifyMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <circle cx="32" cy="32" r="28" fill="#1db954" />
      <path
        d="M18 26c10-3 22-2 30 2M19 34c8-2 19-2 26 2M20 42c7-2 16-1 21 1.5"
        stroke="#0a0a0a"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export function SonyLivMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect x="4" y="4" width="56" height="56" rx="12" fill="#0b1a3a" />
      <text x="32" y="30" textAnchor="middle" fontFamily="system-ui, sans-serif" fontWeight="800" fontSize="11" fill="#ffffff">SONY</text>
      <text x="32" y="46" textAnchor="middle" fontFamily="system-ui, sans-serif" fontWeight="800" fontSize="13" fill="#e6322a">LIV</text>
    </svg>
  );
}

export function Zee5Mark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="z5" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#a21caf" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="56" height="56" rx="12" fill="url(#z5)" />
      <text x="32" y="40" textAnchor="middle" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="20" fill="#ffffff">ZEE5</text>
    </svg>
  );
}

export function AppleTvMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect x="4" y="4" width="56" height="56" rx="12" fill="#0a0a0a" />
      <path
        d="M28 18c0-3 2.4-6 5.6-6 .3 2.6-1.4 5.4-3 6.6-1.5 1.2-3.2 2-2.6-.6zM22 26c4-2.4 8-2.4 11 0 1-1 3-1 5 0 3 1.6 4 5.4 2 9.4-1.6 3.2-3.6 6.4-5.6 6.4-1.6 0-2.6-1-4.4-1s-3 1-4.6 1c-2 0-4-3.2-5.6-6.4-2-4-1-7.8 2.2-9.4z"
        fill="#ffffff"
      />
      <text x="32" y="56" textAnchor="middle" fontFamily="system-ui, sans-serif" fontWeight="800" fontSize="9" fill="#ffffff">TV+</text>
    </svg>
  );
}

export function MxPlayerMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect x="4" y="4" width="56" height="56" rx="12" fill="#1a1a1a" />
      <text x="32" y="40" textAnchor="middle" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="20" fill="#f7b500">MX</text>
    </svg>
  );
}

export function CrunchyrollMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect x="4" y="4" width="56" height="56" rx="12" fill="#0a0a0a" />
      <path d="M44 32a12 12 0 11-12-12 8 8 0 1012 12z" fill="#f47521" />
      <circle cx="40" cy="24" r="2.5" fill="#ffffff" />
    </svg>
  );
}

export function JioCinemaMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="jc" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ff2e63" />
          <stop offset="100%" stopColor="#a81d6b" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="56" height="56" rx="12" fill="url(#jc)" />
      <text x="32" y="40" textAnchor="middle" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="18" fill="#ffffff">Jio</text>
    </svg>
  );
}

export function YouTubePremiumMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect x="2" y="12" width="60" height="40" rx="10" fill="#0a0a0a" />
      <path d="M27 23l16 9-16 9z" fill="#ff0033" />
    </svg>
  );
}
