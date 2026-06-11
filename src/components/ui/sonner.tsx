import { Toaster as Sonner, toast as sonnerToast } from "sonner";
import { CheckCircle2, AlertCircle, Info, XCircle, Loader2 } from "lucide-react";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      position="top-right"
      gap={12}
      offset={20}
      visibleToasts={4}
      icons={{
        success: <CheckCircle2 className="h-[18px] w-[18px] text-[color:var(--primary)]" strokeWidth={2.25} />,
        error: <XCircle className="h-[18px] w-[18px] text-destructive" strokeWidth={2.25} />,
        warning: <AlertCircle className="h-[18px] w-[18px] text-amber-400" strokeWidth={2.25} />,
        info: <Info className="h-[18px] w-[18px] text-muted-foreground" strokeWidth={2.25} />,
        loading: <Loader2 className="h-[18px] w-[18px] animate-spin text-[color:var(--primary)]" strokeWidth={2.25} />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: [
            "group relative flex w-full items-start gap-3 overflow-hidden",
            "rounded-2xl px-4 py-3.5 pr-5",
            "border border-[var(--border)]",
            "bg-surface/90 backdrop-blur-2xl backdrop-saturate-150",
            "shadow-[0_1px_0_rgba(255,255,255,0.04)_inset,0_24px_60px_-20px_rgba(0,0,0,0.7)]",
            "text-foreground",
            "transition-[border-color,box-shadow] duration-200 ease-out",
            "hover:border-[var(--border-strong)]",
          ].join(" "),
          title: "text-[13.5px] font-semibold leading-tight tracking-[-0.01em] text-foreground",
          description: "mt-1 text-[12.5px] leading-snug text-muted-foreground",
          icon: "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-surface-elevated",
          content: "min-w-0 flex-1",
          actionButton: "rounded-full bg-foreground px-2.5 py-1 text-[11.5px] font-semibold text-background hover:bg-foreground/92 transition-colors",
          cancelButton: "rounded-full border border-[var(--border)] bg-surface/50 px-2.5 py-1 text-[11.5px] font-medium text-muted-foreground hover:bg-surface-elevated hover:text-foreground transition-colors",
          closeButton: "!left-auto !right-2 !top-2 !border-[var(--border)] !bg-surface-elevated !text-muted-foreground hover:!text-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, sonnerToast as toast };
