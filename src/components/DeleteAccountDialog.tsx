import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, KeyRound, Loader2, ShieldAlert, CheckCircle2, X } from "lucide-react";
import { toast } from "sonner";
import { type AuthUser, clearSession, deleteAccount } from "@/lib/api";

type Step = "intro" | "verify" | "final" | "loading" | "done";

const CONFIRM_PHRASE = "DELETE MY ACCOUNT";

export function DeleteAccountDialog({
  open,
  onClose,
  user,
}: {
  open: boolean;
  onClose: () => void;
  user: AuthUser | null;
}) {
  const [step, setStep] = useState<Step>("intro");
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const firstFieldRef = useRef<HTMLInputElement | null>(null);

  const isOAuth = user?.provider === "google" || user?.hasPassword === false;

  useEffect(() => {
    if (!open) return;
    setStep("intro");
    setPassword("");
    setConfirmText("");
    setError(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && step !== "loading") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose, step]);

  useEffect(() => {
    if (step === "verify") {
      // small delay to allow modal transition
      const t = setTimeout(() => firstFieldRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [step]);

  if (!open || typeof window === "undefined") return null;

  const canContinueVerify = isOAuth
    ? confirmText.trim() === CONFIRM_PHRASE
    : password.length > 0;

  const submit = async () => {
    setError(null);
    setStep("loading");
    try {
      await deleteAccount(
        isOAuth ? { confirmText: CONFIRM_PHRASE } : { currentPassword: password }
      );
      setStep("done");
      // Wipe session immediately. Redirect after a short success view.
      clearSession();
      setTimeout(() => {
        window.location.assign("/");
      }, 1800);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to delete account";
      setError(msg);
      setStep(isOAuth ? "verify" : "verify");
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-account-title"
      className="fixed inset-0 z-[100] flex items-end justify-center bg-background/70 p-0 backdrop-blur-md sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && step !== "loading") onClose();
      }}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-t-2xl border border-[var(--border)] bg-surface shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] animate-in fade-in-0 slide-in-from-bottom-6 sm:rounded-2xl sm:slide-in-from-bottom-2 sm:duration-200"
      >
        {step !== "loading" && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-background/60 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {step === "intro" && (
          <IntroStep
            onCancel={onClose}
            onContinue={() => setStep("verify")}
          />
        )}

        {step === "verify" && (
          <VerifyStep
            isOAuth={isOAuth}
            email={user?.email ?? ""}
            password={password}
            setPassword={setPassword}
            confirmText={confirmText}
            setConfirmText={setConfirmText}
            error={error}
            canContinue={canContinueVerify}
            firstFieldRef={firstFieldRef}
            onCancel={onClose}
            onContinue={() => {
              setError(null);
              setStep("final");
            }}
          />
        )}

        {step === "final" && (
          <FinalStep
            onCancel={onClose}
            onDelete={submit}
          />
        )}

        {step === "loading" && <LoadingStep />}

        {step === "done" && <DoneStep />}
      </div>
    </div>,
    document.body
  );
}

function StepHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="px-6 pb-4 pt-7 text-center sm:text-left">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 text-red-400 sm:mx-0">
        {icon}
      </div>
      <h2
        id="delete-account-title"
        className="mt-4 font-display text-[1.2rem] font-semibold tracking-[-0.02em] text-foreground"
      >
        {title}
      </h2>
      <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function Footer({
  cancelLabel = "Cancel",
  onCancel,
  primary,
}: {
  cancelLabel?: string;
  onCancel: () => void;
  primary: React.ReactNode;
}) {
  return (
    <div className="flex flex-col-reverse gap-2 border-t border-[var(--border)] bg-background/30 px-6 py-4 sm:flex-row sm:justify-end">
      <button
        type="button"
        onClick={onCancel}
        className="inline-flex h-10 items-center justify-center rounded-full border border-[var(--border)] bg-background/60 px-5 text-[13px] font-semibold text-foreground transition-colors hover:border-[var(--border-strong)] hover:bg-background"
      >
        {cancelLabel}
      </button>
      {primary}
    </div>
  );
}

function IntroStep({ onCancel, onContinue }: { onCancel: () => void; onContinue: () => void }) {
  return (
    <>
      <StepHeader
        icon={<AlertTriangle className="h-5 w-5" />}
        title="Delete Account"
        subtitle="This action cannot be undone."
      />
      <div className="px-6 pb-2">
        <p className="text-[12.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/80">
          You will permanently lose
        </p>
        <ul className="mt-3 space-y-2 text-[13.5px] text-foreground/90">
          {[
            "Account access",
            "Order history",
            "Saved preferences",
            "Notifications",
            "Profile information",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2.5">
              <span className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-red-400/80" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
      <Footer
        onCancel={onCancel}
        primary={
          <button
            type="button"
            onClick={onContinue}
            className="inline-flex h-10 items-center justify-center rounded-full bg-red-500 px-5 text-[13px] font-semibold text-white shadow-[0_10px_24px_-10px_rgba(239,68,68,0.65)] transition-transform hover:bg-red-500/95 active:scale-[0.985]"
          >
            Continue
          </button>
        }
      />
    </>
  );
}

function VerifyStep({
  isOAuth,
  email,
  password,
  setPassword,
  confirmText,
  setConfirmText,
  error,
  canContinue,
  firstFieldRef,
  onCancel,
  onContinue,
}: {
  isOAuth: boolean;
  email: string;
  password: string;
  setPassword: (v: string) => void;
  confirmText: string;
  setConfirmText: (v: string) => void;
  error: string | null;
  canContinue: boolean;
  firstFieldRef: React.MutableRefObject<HTMLInputElement | null>;
  onCancel: () => void;
  onContinue: () => void;
}) {
  return (
    <>
      <StepHeader
        icon={<KeyRound className="h-5 w-5" />}
        title="Verify it's you"
        subtitle={
          isOAuth
            ? "Your account uses Google sign-in. Type the confirmation phrase to continue."
            : `Confirm your password for ${email}.`
        }
      />
      <form
        className="px-6 pb-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (canContinue) onContinue();
        }}
      >
        {isOAuth ? (
          <label className="block">
            <span className="mb-1.5 block text-[11.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Type <span className="font-mono text-red-400">{CONFIRM_PHRASE}</span>
            </span>
            <input
              ref={firstFieldRef}
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              placeholder={CONFIRM_PHRASE}
              className="block w-full rounded-lg border border-[var(--border)] bg-background/60 px-3 py-2.5 font-mono text-[14px] tracking-wider text-foreground outline-none transition-colors placeholder:text-muted-foreground/40 hover:border-[var(--border-strong)] focus:border-red-500/60 focus:ring-2 focus:ring-red-500/25"
            />
          </label>
        ) : (
          <label className="block">
            <span className="mb-1.5 block text-[11.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Current password
            </span>
            <input
              ref={firstFieldRef}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="block w-full rounded-lg border border-[var(--border)] bg-background/60 px-3 py-2.5 text-[14px] text-foreground outline-none transition-colors hover:border-[var(--border-strong)] focus:border-red-500/60 focus:ring-2 focus:ring-red-500/25"
            />
          </label>
        )}
        {error && (
          <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12.5px] text-red-300">
            {error}
          </p>
        )}
      </form>
      <Footer
        onCancel={onCancel}
        primary={
          <button
            type="button"
            disabled={!canContinue}
            onClick={onContinue}
            className="inline-flex h-10 items-center justify-center rounded-full bg-red-500 px-5 text-[13px] font-semibold text-white shadow-[0_10px_24px_-10px_rgba(239,68,68,0.65)] transition-transform hover:bg-red-500/95 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
          >
            Continue
          </button>
        }
      />
    </>
  );
}

function FinalStep({ onCancel, onDelete }: { onCancel: () => void; onDelete: () => void }) {
  return (
    <>
      <StepHeader
        icon={<ShieldAlert className="h-5 w-5" />}
        title="Final confirmation"
        subtitle="Your account and associated data will be permanently deleted."
      />
      <div className="px-6 pb-2 text-[13px] text-muted-foreground">
        <p className="rounded-lg border border-red-500/25 bg-red-500/[0.06] px-3.5 py-3 text-red-200/90">
          This is the last step. There is no undo, no recovery, and no support reversal.
        </p>
      </div>
      <Footer
        onCancel={onCancel}
        primary={
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex h-10 items-center justify-center rounded-full bg-red-500 px-5 text-[13px] font-semibold text-white shadow-[0_10px_24px_-10px_rgba(239,68,68,0.65)] transition-transform hover:bg-red-500/95 active:scale-[0.985]"
          >
            Delete Account
          </button>
        }
      />
    </>
  );
}

function LoadingStep() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <Loader2 className="h-7 w-7 animate-spin text-red-400" />
      <p className="mt-4 text-[14px] font-semibold text-foreground">Deleting your account…</p>
      <p className="mt-1 text-[12.5px] text-muted-foreground">
        Removing profile, preferences, cart, and sessions.
      </p>
    </div>
  );
}

function DoneStep() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
        <CheckCircle2 className="h-6 w-6" />
      </div>
      <p className="mt-4 font-display text-[1.1rem] font-semibold tracking-[-0.02em] text-foreground">
        Account deleted
      </p>
      <p className="mt-1.5 max-w-[22rem] text-[13px] text-muted-foreground">
        We've signed you out and removed your data. Redirecting you to the homepage…
      </p>
    </div>
  );
}

// Toast hook (re-exported for parent convenience).
export function notifyDeleted() {
  toast.success("Account deleted");
}
