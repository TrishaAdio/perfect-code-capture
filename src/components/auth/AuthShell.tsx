import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import symdealsLogo from "@/assets/symdeals-logo.png";

/**
 * Resend-style single-centered auth layout.
 * - Pure black background with soft abstract gradient
 * - Single centered card, no split screen, no marketing panel
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white antialiased">
      {/* Abstract soft gradient backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(1100px 700px at 100% 0%, rgba(255,255,255,0.10), transparent 60%), radial-gradient(900px 600px at 0% 100%, rgba(255,255,255,0.06), transparent 60%), radial-gradient(700px 500px at 50% 50%, rgba(255,255,255,0.02), transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{
          background:
            "radial-gradient(ellipse at 85% 10%, rgba(180,180,180,0.18), transparent 55%), radial-gradient(ellipse at 10% 90%, rgba(120,120,120,0.10), transparent 55%)",
          mixBlendMode: "screen",
        }}
      />

      {/* Top bar — just a back-home link */}
      <header className="relative z-10">
        <div className="mx-auto flex max-w-6xl items-center px-6 py-6">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-[13px] font-medium text-white/60 transition-colors hover:text-white"
          >
            <span aria-hidden>‹</span> Home
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex min-h-[calc(100vh-80px)] w-full items-start justify-center px-5 pb-16 pt-6 sm:pt-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[400px]"
        >
          <div className="mb-8 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.6)]">
              <img
                src={symdealsLogo}
                alt="SymDeals"
                className="h-6 w-auto object-contain"
              />
            </div>
          </div>
          {children}
        </motion.div>
      </main>
    </div>
  );
}

export function GoogleIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.45c-.28 1.45-1.12 2.68-2.39 3.5v2.91h3.86c2.26-2.08 3.57-5.16 3.57-8.65z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.86-2.91c-1.07.72-2.45 1.16-4.08 1.16-3.13 0-5.78-2.11-6.73-4.96H1.28v3.11C3.25 21.3 7.31 24 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.38c-.24-.72-.38-1.49-.38-2.28s.14-1.56.38-2.28V6.71H1.28A11.99 11.99 0 0 0 0 12.1c0 1.94.46 3.78 1.28 5.39l3.99-3.11z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.28 6.71l3.99 3.11C6.22 6.86 8.87 4.75 12 4.75z" />
    </svg>
  );
}

export function GoogleButton({
  loading,
  onClick,
  label = "Continue with Google",
}: {
  loading?: boolean;
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-[13.5px] font-medium text-white transition-all duration-200 hover:border-white/20 hover:bg-white/[0.07] active:bg-white/[0.05] disabled:opacity-70"
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      ) : (
        <GoogleIcon className="h-[18px] w-[18px]" />
      )}
      <span>{loading ? "Connecting…" : label}</span>
    </button>
  );
}

export function AuthDivider({ label = "or" }: { label?: string }) {
  return (
    <div className="my-5 flex items-center gap-3">
      <div className="h-px flex-1 bg-white/10" />
      <span className="text-[12px] text-white/40">{label}</span>
      <div className="h-px flex-1 bg-white/10" />
    </div>
  );
}

export function PremiumField({
  label,
  type,
  value,
  onChange,
  onBlur,
  error,
  autoComplete,
  autoFocus,
  placeholder,
  rightAdornment,
  trailingLink,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: string;
  autoComplete?: string;
  autoFocus?: boolean;
  placeholder?: string;
  rightAdornment?: React.ReactNode;
  trailingLink?: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-[12.5px] font-medium text-white/70">{label}</label>
        {trailingLink ?? (error && (
          <span className="text-[11.5px] font-medium text-red-400/90">{error}</span>
        ))}
      </div>
      <div
        className={`group relative flex items-center rounded-lg border bg-white/[0.03] transition-colors duration-150 focus-within:border-white/30 focus-within:bg-white/[0.05] ${
          error ? "border-red-500/50" : "border-white/10 hover:border-white/20"
        }`}
      >
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          placeholder={placeholder}
          className="w-full bg-transparent px-3.5 py-2.5 text-[14px] text-white placeholder:text-white/30 focus:outline-none"
        />
        {rightAdornment && <div className="pr-3">{rightAdornment}</div>}
      </div>
      {trailingLink && error && (
        <p className="mt-1.5 text-[11.5px] font-medium text-red-400/90">{error}</p>
      )}
    </div>
  );
}

export function PrimaryButton({
  children,
  loading,
  disabled,
  type = "submit",
  onClick,
}: {
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  type?: "submit" | "button";
  onClick?: () => void;
}) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileTap={{ scale: 0.99 }}
      className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-[13.5px] font-semibold text-black transition-all duration-200 hover:bg-white/90 disabled:cursor-not-allowed disabled:bg-white/30 disabled:text-black/60"
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
      ) : null}
      <span>{children}</span>
    </motion.button>
  );
}
