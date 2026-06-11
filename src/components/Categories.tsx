import { Link } from "@tanstack/react-router";
import {
  Tv,
  Music2,
  Sparkles,
  Cloud,
  GraduationCap,
  Gamepad2,
  ArrowUpRight,
} from "lucide-react";

const categories = [
  { icon: Tv, name: "Streaming", count: "20+ services", to: "/signup" },
  { icon: Music2, name: "Music", count: "Spotify, YT Music", to: "/signup" },
  { icon: Sparkles, name: "AI Tools", count: "ChatGPT, Claude", to: "/signup" },
  { icon: Cloud, name: "Productivity", count: "Drive, Office", to: "/signup" },
  { icon: GraduationCap, name: "Learning", count: "Courses, eBooks", to: "/signup" },
  { icon: Gamepad2, name: "Gaming", count: "Xbox, PSN", to: "/signup" },
];

export function Categories() {
  return (
    <section className="relative border-t border-border py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <div className="label-uppercase">Catalog</div>
            <h2 className="mt-4 font-display text-3xl font-semibold leading-[1.1] tracking-[-0.025em] text-foreground md:text-4xl">
              Everything you subscribe to,
              <br />
              <span className="text-gradient-emerald">in one place.</span>
            </h2>
          </div>
          <Link
            to="/signup"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/60 px-4 py-2 text-[12.5px] font-medium text-foreground transition-all hover:border-muted-foreground/40 hover:bg-surface-elevated"
          >
            View all categories
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c, i) => {
            const Icon = c.icon;
            return (
              <Link
                key={c.name}
                to={c.to}
                className="hover-lift group relative flex items-center justify-between overflow-hidden rounded-2xl border border-border bg-surface/60 p-6 transition-all hover:border-muted-foreground/25 hover:bg-surface-elevated/80 animate-fade-up"
                style={{ animationDelay: `${i * 0.04}s` }}
              >
                {/* Soft hover glow */}
                <div className="pointer-events-none absolute -inset-px rounded-2xl bg-[radial-gradient(60%_60%_at_30%_30%,rgba(16,185,129,0.06),transparent_70%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                <div className="relative flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background/60">
                    <Icon className="h-4.5 w-4.5 text-foreground/85" />
                  </div>
                  <div>
                    <div className="font-display text-[14.5px] font-semibold tracking-tight text-foreground">
                      {c.name}
                    </div>
                    <div className="mt-0.5 text-[12px] text-muted-foreground">
                      {c.count}
                    </div>
                  </div>
                </div>
                <ArrowUpRight className="relative h-4 w-4 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
