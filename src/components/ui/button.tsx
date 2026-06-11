import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // Base: dense, sharp, single-line, GPU-friendly. Subtle press + crisp focus.
  "relative inline-flex select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-[8px] text-[13px] font-medium tracking-[-0.005em] transition-[background-color,color,border-color,box-shadow,transform] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 active:scale-[0.985] [&_svg]:pointer-events-none [&_svg]:size-[14px] [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-foreground text-background shadow-[0_1px_0_rgba(255,255,255,0.18)_inset,0_1px_2px_rgba(0,0,0,0.45)] hover:bg-foreground/92",
        primary:
          "bg-primary text-primary-foreground shadow-[0_1px_0_rgba(255,255,255,0.18)_inset,0_1px_2px_rgba(0,0,0,0.35),0_0_0_1px_color-mix(in_oklab,var(--primary)_38%,transparent)] hover:bg-[color:var(--primary-hover)]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[0_1px_0_rgba(255,255,255,0.18)_inset,0_1px_2px_rgba(0,0,0,0.4)] hover:bg-destructive/90",
        outline:
          "border border-border bg-surface/40 text-foreground hover:bg-surface-elevated hover:border-[var(--border-strong)]",
        secondary:
          "bg-surface-elevated text-foreground border border-border hover:bg-[color:var(--accent)]",
        ghost:
          "text-muted-foreground hover:bg-surface-elevated hover:text-foreground",
        link:
          "text-foreground underline-offset-4 hover:underline rounded-none px-0",
      },
      size: {
        default: "h-8 px-3",
        sm: "h-7 px-2.5 text-[12px]",
        lg: "h-10 px-4 text-[13.5px]",
        xl: "h-11 px-5 text-[14px] rounded-[10px]",
        icon: "h-8 w-8",
        "icon-sm": "h-7 w-7",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
