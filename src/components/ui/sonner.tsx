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
        success: <CheckCircle2 className="h-[18px] w-[18px] text-emerald-400" strokeWidth={2.25} />,
        error: <XCircle className="h-[18px] w-[18px] text-red-400" strokeWidth={2.25} />,
        warning: <AlertCircle className="h-[18px] w-[18px] text-amber-400" strokeWidth={2.25} />,
        info: <Info className="h-[18px] w-[18px] text-sky-400" strokeWidth={2.25} />,
        loading: <Loader2 className="h-[18px] w-[18px] animate-spin text-emerald-400" strokeWidth={2.25} />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: [
            "group relative flex w-full items-start gap-3 overflow-hidden",
            "rounded-2xl px-4 py-3.5 pr-5",
            "border border-white/[0.07]",
            "bg-[rgba(14,16,20,0.85)] backdrop-blur-2xl backdrop-saturate-150",
            "shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset,0_20px_50px_-20px_rgba(0,0,0,0.8),0_8px_24px_-12px_rgba(0,0,0,0.5)]",
            "text-foreground",
            "transition-all duration-300 ease-out",
            "hover:border-emerald-400/25 hover:shadow-[0_1px_0_0_rgba(52,211,153,0.12)_inset,0_24px_60px_-20px_rgba(0,0,0,0.85),0_0_30px_-8px_rgba(52,211,153,0.25)]",
            "data-[type=success]:border-emerald-400/20",
            "data-[type=error]:border-red-400/25",
            "data-[type=warning]:border-amber-400/25",
          ].join(" "),
          title: "font-display text-[14px] font-semibold leading-tight tracking-tight text-white",
          description: "mt-1 text-[12.5px] leading-snug text-white/60",
          icon: "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.04]",
          content: "min-w-0 flex-1",
          actionButton: "rounded-md bg-emerald-500 px-2.5 py-1 text-[11.5px] font-semibold text-emerald-950 hover:bg-emerald-400 transition-colors",
          cancelButton: "rounded-md bg-white/[0.06] px-2.5 py-1 text-[11.5px] font-medium text-white/70 hover:bg-white/[0.1] transition-colors",
          closeButton: "!left-auto !right-2 !top-2 !border-white/10 !bg-white/[0.04] !text-white/60 hover:!bg-white/[0.1] hover:!text-white",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, sonnerToast as toast };
