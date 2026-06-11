// Console protection — production only.
// Overrides console methods, periodically clears the console, and prints a
// single styled greeting. Skipped in dev to preserve developer experience.

let installed = false;

export function installConsoleShield() {
  if (installed) return;
  if (typeof window === "undefined") return;
  if (!import.meta.env.PROD) return;
  installed = true;

  const noop = () => {};
  const methods = [
    "log",
    "warn",
    "error",
    "info",
    "debug",
    "trace",
    "table",
    "dir",
    "group",
    "groupCollapsed",
    "groupEnd",
  ] as const;

  for (const m of methods) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (console as any)[m] = noop;
    } catch {
      /* ignore */
    }
  }

  const greet = () => {
    try {
      const native = (console as unknown as { clear?: () => void }).clear;
      native?.call(console);
    } catch {
      /* ignore */
    }
    try {
      // Use Function to bypass our overrides via a fresh reference.
      const raw = new Function("return console")() as Console;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (raw as any).log(
        "%cNice try kid 😄",
        [
          "color:#00f0ff",
          "font-size:22px",
          "font-weight:700",
          "font-family:'SF Mono',Menlo,monospace",
          "text-shadow:0 0 8px #00f0ff,0 0 16px #00f0ff66",
          "padding:6px 0",
        ].join(";"),
      );
    } catch {
      /* ignore */
    }
  };

  greet();

  // Lightweight periodic clear (every 2s) — negligible CPU.
  window.setInterval(greet, 2000);
}
