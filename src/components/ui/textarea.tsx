import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[72px] w-full rounded-[10px] border border-[var(--border)] bg-surface/40 px-3 py-2 text-[13px] text-foreground shadow-[0_1px_0_rgba(255,255,255,0.03)_inset] transition-[border-color,box-shadow,background-color] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] placeholder:text-muted-foreground hover:border-[var(--border-strong)] focus-visible:outline-none focus-visible:border-[color:var(--primary)] focus-visible:ring-[2px] focus-visible:ring-[color:color-mix(in_oklab,var(--primary)_25%,transparent)] disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
