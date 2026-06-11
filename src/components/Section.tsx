import { cn } from "@/lib/utils";

/**
 * Unified marketing section primitive — Linear/Vercel feel.
 * Provides consistent vertical rhythm, an optional eyebrow label, headline,
 * and dek. Use across Features / How It Works / FAQ / Support / etc.
 */
export function Section({
  eyebrow,
  title,
  description,
  align = "center",
  className,
  containerClassName,
  headerClassName,
  children,
  id,
}: {
  eyebrow?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  align?: "center" | "left";
  className?: string;
  containerClassName?: string;
  headerClassName?: string;
  children?: React.ReactNode;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        "relative py-20 sm:py-28",
        className,
      )}
    >
      <div className={cn("mx-auto max-w-6xl px-5 sm:px-6", containerClassName)}>
        {(eyebrow || title || description) && (
          <div
            className={cn(
              "mx-auto max-w-2xl",
              align === "center" ? "text-center" : "text-left mx-0 max-w-3xl",
              headerClassName,
            )}
          >
            {eyebrow && (
              <div
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border border-border bg-surface/50 px-2.5 py-[5px] backdrop-blur-md",
                )}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span className="text-[10.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  {eyebrow}
                </span>
              </div>
            )}
            {title && (
              <h2 className="mt-5 font-display text-[1.875rem] font-semibold leading-[1.1] tracking-[-0.03em] text-foreground sm:text-[2.5rem] sm:leading-[1.06]">
                {title}
              </h2>
            )}
            {description && (
              <p className="mx-auto mt-4 max-w-xl text-[14.5px] leading-[1.65] text-muted-foreground sm:text-[15.5px]">
                {description}
              </p>
            )}
          </div>
        )}
        {children && <div className={cn(eyebrow || title || description ? "mt-14 sm:mt-16" : "")}>{children}</div>}
      </div>
    </section>
  );
}
