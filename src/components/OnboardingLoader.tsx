import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import symdealsLogo from "@/assets/symdeals-logo.png";

const DURATION_MS = 4000;
const SUCCESS_MS = 700;

export function OnboardingLoader({
  open,
  onComplete,
}: {
  open: boolean;
  onComplete: () => void;
}) {
  const [phase, setPhase] = useState<"success" | "loading">("success");

  useEffect(() => {
    if (!open) {
      setPhase("success");
      return;
    }
    const toLoading = window.setTimeout(() => setPhase("loading"), SUCCESS_MS);
    const done = window.setTimeout(onComplete, DURATION_MS);
    return () => {
      window.clearTimeout(toLoading);
      window.clearTimeout(done);
    };
  }, [open, onComplete]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="onboarding-loader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-background"
        >
          <div className="flex w-full max-w-sm flex-col items-center px-6 text-center">
            <AnimatePresence mode="wait">
              {phase === "success" ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="flex flex-col items-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 240, damping: 16 }}
                    className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 ring-1 ring-primary/30"
                  >
                    <Check className="h-7 w-7 text-primary" strokeWidth={3} />
                  </motion.div>
                  <p className="mt-4 text-[14px] font-semibold text-foreground">
                    Account created
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="flex flex-col items-center"
                >
                  <img
                    src={symdealsLogo}
                    alt="SymDeals"
                    className="h-6 w-auto opacity-90"
                  />
                  <div className="mt-7 flex items-center gap-1.5">
                    <Dot delay={0} />
                    <Dot delay={0.15} />
                    <Dot delay={0.3} />
                  </div>
                  <p className="mt-5 text-[13.5px] font-medium text-muted-foreground">
                    Preparing your dashboard...
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <motion.span
      className="block h-2 w-2 rounded-full bg-primary"
      animate={{ opacity: [0.25, 1, 0.25], scale: [0.8, 1, 0.8] }}
      transition={{ duration: 1.1, repeat: Infinity, delay, ease: "easeInOut" }}
    />
  );
}
