import {
  ArrowUpRight,
  Headphones,
  Instagram,
  Lock,
  MessageCircle,
  Send,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

type Channel = {
  name: string;
  tagline: string;
  status: string;
  reply: string;
  href: string;
  Icon: typeof Instagram;
  accent: string; // tailwind color stem e.g. "emerald"
  brand: string; // hex glow color
  primary?: boolean;
};

const channels: Channel[] = [
  {
    name: "WhatsApp",
    tagline: "Direct line to our support team",
    status: "Online now",
    reply: "Usually replies in 2 mins",
    href: "https://wa.me/918389393923",
    Icon: MessageCircle,
    accent: "emerald",
    brand: "16,185,129",
    primary: true,
  },
  {
    name: "Telegram",
    tagline: "Community + instant updates",
    status: "Active community",
    reply: "Replies within 5 mins",
    href: "https://t.me/SymDealsAdmin",
    Icon: Send,
    accent: "sky",
    brand: "56,189,248",
  },
  {
    name: "Instagram",
    tagline: "DM support & announcements",
    status: "Live",
    reply: "Replies within an hour",
    href: "https://www.instagram.com/symdeals/",
    Icon: Instagram,
    accent: "fuchsia",
    brand: "232,121,249",
  },
];

const faqs = [
  {
    q: "How fast do you reply?",
    a: "Most messages get a real human response within minutes, 24/7.",
  },
  {
    q: "Is my purchase protected?",
    a: "Every order is verified end-to-end and backed by our delivery guarantee.",
  },
  {
    q: "Order not delivered yet?",
    a: "Share your order ID with us — we'll resolve it instantly on chat.",
  },
];

export function SupportPanel() {
  return (
    <div>
      <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1">
        <Headphones className="h-3 w-3 text-emerald-400" />
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Concierge Support
        </span>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-12">
        {/* LEFT — narrative + trust + faqs */}
        <div className="min-w-0">
          <h1 className="font-display text-[2rem] font-semibold leading-[1.05] tracking-[-0.028em] text-foreground sm:text-[2.5rem]">
            Real humans.{" "}
            <span className="bg-gradient-to-r from-emerald-300 to-emerald-500 bg-clip-text text-transparent">
              Instant help.
            </span>
          </h1>
          <p className="mt-4 max-w-md text-[14.5px] leading-[1.7] text-muted-foreground">
            Our support team is online around the clock. Pick a channel on the
            right — we usually reply in under two minutes.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Pill icon={<Zap className="h-3 w-3" />} tone="emerald">
              Avg. reply 2 min
            </Pill>
            <Pill icon={<ShieldCheck className="h-3 w-3" />} tone="emerald">
              Verified team
            </Pill>
            <Pill icon={<Sparkles className="h-3 w-3" />}>24 / 7</Pill>
          </div>

          {/* Slim premium security notice */}
          <div className="mt-7 flex items-start gap-3 rounded-xl border border-amber-400/20 bg-amber-400/[0.04] px-4 py-3">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />
            <p className="text-[12.5px] leading-[1.55] text-muted-foreground">
              We{" "}
              <span className="font-semibold text-foreground">
                never ask for payments
              </span>{" "}
              outside this website. All deals close on-platform only.
            </p>
          </div>

          {/* Quick FAQs */}
          <div className="mt-8">
            <h2 className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Quick answers
            </h2>
            <div className="mt-3 divide-y divide-border/60 overflow-hidden rounded-2xl border border-border bg-surface/40">
              {faqs.map((f) => (
                <details
                  key={f.q}
                  className="group/faq px-4 py-3.5 transition-colors open:bg-surface/60"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                    <span className="font-display text-[13.5px] font-medium tracking-tight text-foreground">
                      {f.q}
                    </span>
                    <span className="grid h-5 w-5 place-items-center rounded-full border border-border text-muted-foreground transition-transform duration-200 group-open/faq:rotate-45">
                      <span className="text-[14px] leading-none">+</span>
                    </span>
                  </summary>
                  <p className="mt-2 text-[12.5px] leading-[1.6] text-muted-foreground">
                    {f.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — interactive support channels */}
        <div className="min-w-0">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-[14px] font-semibold tracking-tight text-foreground">
              Choose a channel
            </h2>
            <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-emerald-300/80">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              Team online
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {channels.map((c) => (
              <ChannelCard key={c.name} channel={c} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const ACCENTS: Record<
  string,
  {
    text: string;
    hoverText: string;
    hoverBorder: string;
    hoverBg: string;
    dot: string;
    ring: string;
  }
> = {
  emerald: {
    text: "text-emerald-300",
    hoverText: "group-hover/ch:text-emerald-300",
    hoverBorder: "group-hover/ch:border-emerald-400/50",
    hoverBg: "group-hover/ch:bg-emerald-400/10",
    dot: "bg-emerald-400",
    ring: "bg-emerald-400/60",
  },
  sky: {
    text: "text-sky-300",
    hoverText: "group-hover/ch:text-sky-300",
    hoverBorder: "group-hover/ch:border-sky-400/50",
    hoverBg: "group-hover/ch:bg-sky-400/10",
    dot: "bg-sky-400",
    ring: "bg-sky-400/60",
  },
  fuchsia: {
    text: "text-fuchsia-300",
    hoverText: "group-hover/ch:text-fuchsia-300",
    hoverBorder: "group-hover/ch:border-fuchsia-400/50",
    hoverBg: "group-hover/ch:bg-fuchsia-400/10",
    dot: "bg-fuchsia-400",
    ring: "bg-fuchsia-400/60",
  },
};

function ChannelCard({ channel: c }: { channel: Channel }) {
  const s = ACCENTS[c.accent];

  return (
    <a
      href={c.href}
      target="_blank"
      rel="noopener noreferrer"
      className={`group/ch relative isolate flex items-center gap-4 overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.045] to-white/[0.01] p-4 transition-all duration-300 ease-out hover:-translate-y-[2px] active:translate-y-0 active:scale-[0.997] sm:gap-5 sm:p-5 ${
        c.primary ? "ring-1 ring-emerald-400/15" : ""
      }`}
      style={{
        backgroundImage: `radial-gradient(120% 120% at 0% 0%, rgba(${c.brand},0.08), transparent 55%)`,
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-500 group-hover/ch:opacity-100"
        style={{
          background: `radial-gradient(60% 80% at 50% 0%, rgba(${c.brand},0.18), transparent 70%)`,
        }}
      />

      <div
        className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-gradient-to-b from-white/[0.07] to-white/[0.02] text-foreground transition-all duration-300 sm:h-14 sm:w-14 ${s.hoverBorder} ${s.hoverText}`}
      >
        <c.Icon className="h-[19px] w-[19px] sm:h-[21px] sm:w-[21px]" />
        <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
          <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${s.ring} opacity-80`} />
          <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ring-2 ring-background ${s.dot}`} />
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-display text-[15.5px] font-semibold tracking-tight text-foreground sm:text-[16.5px]">
            {c.name}
          </p>
          {c.primary && (
            <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.12em] text-emerald-300">
              Fastest
            </span>
          )}
        </div>
        <p className="mt-0.5 text-[12.5px] leading-snug text-muted-foreground">
          {c.tagline}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className={`inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] ${s.text}`}>
            <span className="relative flex h-1.5 w-1.5">
              <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${s.ring}`} />
              <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${s.dot}`} />
            </span>
            {c.status}
          </span>
          <span className="text-[10.5px] text-muted-foreground/70">
            • {c.reply}
          </span>
        </div>
      </div>

      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.03] text-muted-foreground transition-all duration-300 ${s.hoverBorder} ${s.hoverBg} ${s.hoverText}`}
      >
        <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover/ch:-translate-y-0.5 group-hover/ch:translate-x-0.5" />
      </div>
    </a>
  );
}

function Pill({
  children,
  icon,
  tone = "default",
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
  tone?: "default" | "emerald";
}) {
  const cls =
    tone === "emerald"
      ? "border-emerald-400/25 bg-emerald-400/5 text-emerald-300"
      : "border-border bg-surface/60 text-muted-foreground";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.12em] ${cls}`}
    >
      {icon}
      {children}
    </span>
  );
}
