import { LogOut } from "lucide-react";
import { useEffect } from "react";

type Props = {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function LogoutConfirmDialog({ open, onCancel, onConfirm }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-title"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close"
        onClick={onCancel}
        className="absolute inset-0 bg-background/70 backdrop-blur-sm animate-fade-up"
      />

      {/* Card */}
      <div
        className="relative w-full max-w-sm rounded-xl border border-border bg-surface shadow-elegant animate-fade-up"
        style={{ animationDelay: "0.02s" }}
      >
        <div className="px-6 pt-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
            <LogOut className="h-5 w-5 text-destructive" />
          </div>
          <h2
            id="logout-title"
            className="mt-4 font-display text-[18px] font-bold tracking-tight text-foreground"
          >
            Log out of SymDeals?
          </h2>
          <p className="mt-1.5 text-[13.5px] leading-[1.55] text-muted-foreground">
            Are you sure you want to log out? You'll need to sign in again to
            access your dashboard.
          </p>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2 border-t border-border bg-surface-elevated/40 px-5 py-3 rounded-b-xl">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center rounded-md border border-border bg-surface px-4 py-2 text-[13px] font-semibold text-foreground transition-colors hover:bg-surface-elevated"
          >
            No, cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex items-center justify-center rounded-md bg-destructive px-4 py-2 text-[13px] font-semibold text-destructive-foreground transition-all hover:bg-destructive/90"
          >
            Yes, log out
          </button>
        </div>
      </div>
    </div>
  );
}
