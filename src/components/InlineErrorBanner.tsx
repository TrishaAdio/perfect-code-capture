import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, X } from "lucide-react";

type Props = {
  message: string | null;
  onDismiss: () => void;
  /** Auto-dismiss after this many ms. Set to 0 to disable. */
  autoDismissMs?: number;
};

/**
 * Premium inline error banner for auth/checkout forms.
 * - Smooth fade in/out
 * - Auto-dismisses after a few seconds
 * - Manual close button
 * - Never renders raw infrastructure details (callers should pass sanitized text)
 */
export function InlineErrorBanner({ message, onDismiss, autoDismissMs = 6000 }: Props) {
  useEffect(() => {
    if (!message || !autoDismissMs) return;
    const id = window.setTimeout(onDismiss, autoDismissMs);
    return () => window.clearTimeout(id);
  }, [message, autoDismissMs, onDismiss]);

  return (
    <AnimatePresence initial={false}>
      {message && (
        <motion.div
          key={message}
          role="alert"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-[12px] font-medium text-destructive"
        >
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span className="min-w-0 flex-1 leading-snug">{message}</span>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            className="-m-1 ml-1 rounded p-1 text-destructive/70 transition-colors hover:bg-destructive/15 hover:text-destructive"
          >
            <X className="h-3 w-3" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
