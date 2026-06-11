import { useEffect, useState, type FormEvent } from "react";
import { Gauge, KeyRound, Mail, Settings as SettingsIcon, User as UserIcon } from "lucide-react";
import {
  detectAutoLevel,
  resolveLevel,
  writeStoredPreference,
  type MotionPreference,
} from "@/lib/animation-preference";
import { useMotionPreference } from "@/hooks/use-device-performance";
import { toast } from "sonner";
import {
  type AuthUser,
  fetchMe,
  updateCachedUser,
  updateEmail,
  updateName,
  updatePassword,
} from "@/lib/api";

export function ProfilePanel({
  initialUser,
  onUserChange: onUserChangeProp,
}: {
  initialUser?: AuthUser | null;
  onUserChange?: (u: AuthUser) => void;
}) {
  const [user, setUser] = useState<AuthUser | null>(initialUser ?? null);
  const [loading, setLoading] = useState(!initialUser);

  useEffect(() => {
    if (initialUser) {
      setUser(initialUser);
      setLoading(false);
      return;
    }
    void (async () => {
      try {
        const me = await fetchMe();
        setUser(me.user);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onUserChange = (u: AuthUser) => {
    setUser(u);
    updateCachedUser(u);
    onUserChangeProp?.(u);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-surface/50 px-2.5 py-[5px] backdrop-blur-sm">
        <SettingsIcon className="h-3 w-3 text-primary" />
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Settings
        </span>
      </div>
      <h1 className="mt-4 font-display text-[2rem] font-semibold leading-[1.05] tracking-[-0.03em] text-foreground sm:text-[2.25rem]">
        Settings
      </h1>
      <p className="mt-2 text-[14px] text-muted-foreground">
        Account preferences, security, and performance. Email and password changes require your current password.
      </p>

      {loading ? (
        <div className="mt-10 grid gap-5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-2xl border border-[var(--border)] bg-surface/50"
            />
          ))}
        </div>
      ) : (
        <div className="mt-10 grid gap-5">
          <NameSection user={user} onUserChange={onUserChange} />
          <EmailSection user={user} onUserChange={onUserChange} />
          <PasswordSection />
          <AnimationPerformanceSection />
        </div>
      )}
    </div>
  );
}

function SectionShell({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-surface/50 p-6 shadow-card backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-primary/10 text-primary">
          {icon}
        </div>
        <div>
          <h2 className="font-display text-[1.05rem] font-semibold tracking-[-0.02em] text-foreground">
            {title}
          </h2>
          <p className="mt-0.5 text-[12.5px] text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </span>
      <input
        {...props}
        className="block w-full rounded-lg border border-[var(--border)] bg-background/60 px-3 py-2.5 text-[14px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 hover:border-[var(--border-strong)] focus:border-primary/60 focus:ring-2 focus:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-60"
      />
    </label>
  );
}

function SubmitButton({
  loading,
  children,
}: {
  loading: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="inline-flex items-center justify-center rounded-full bg-foreground px-5 py-2.5 text-[13px] font-semibold tracking-[-0.005em] text-background shadow-[0_1px_0_rgba(255,255,255,0.18)_inset,0_10px_28px_-12px_color-mix(in_oklab,var(--foreground)_55%,transparent)] transition-transform active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? "Saving…" : children}
    </button>
  );
}

function NameSection({
  user,
  onUserChange,
}: {
  user: AuthUser | null;
  onUserChange: (u: AuthUser) => void;
}) {
  const [name, setName] = useState(user?.name ?? "");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setName(user?.name ?? "");
  }, [user?.name]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      toast.error("Name is too short");
      return;
    }
    if (trimmed === user?.name) {
      toast.info("Nothing to update");
      return;
    }
    setSubmitting(true);
    try {
      const res = await updateName({ name: trimmed });
      onUserChange(res.user);
      toast.success("Name updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update name");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SectionShell
      icon={<UserIcon className="h-4 w-4" />}
      title="Name"
      description="Your display name across SymDeals."
    >
      <form onSubmit={onSubmit} className="grid gap-4">
        <Field
          label="Full name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          required
          autoComplete="name"
        />
        <div>
          <SubmitButton loading={submitting}>Update name</SubmitButton>
        </div>
      </form>
    </SectionShell>
  );
}

function EmailSection({
  user,
  onUserChange,
}: {
  user: AuthUser | null;
  onUserChange: (u: AuthUser) => void;
}) {
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await updateEmail({
        newEmail: newEmail.trim().toLowerCase(),
        currentPassword,
      });
      onUserChange(res.user);
      setNewEmail("");
      setCurrentPassword("");
      toast.success("Email updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update email");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SectionShell
      icon={<Mail className="h-4 w-4" />}
      title="Email"
      description={`Current: ${user?.email ?? "—"}`}
    >
      <form onSubmit={onSubmit} className="grid gap-4">
        <Field
          label="New email"
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          maxLength={255}
          required
          autoComplete="email"
          placeholder="you@example.com"
        />
        <Field
          label="Current password"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          autoComplete="current-password"
          placeholder="Enter your current password"
        />
        <div>
          <SubmitButton loading={submitting}>Update email</SubmitButton>
        </div>
      </form>
    </SectionShell>
  );
}

function PasswordSection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    setSubmitting(true);
    try {
      await updatePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      toast.success("Password updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update password");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SectionShell
      icon={<KeyRound className="h-4 w-4" />}
      title="Password"
      description="Use at least 8 characters. Choose something unique."
    >
      <form onSubmit={onSubmit} className="grid gap-4">
        <Field
          label="Current password"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
        <Field
          label="New password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
        />
        <div>
          <SubmitButton loading={submitting}>Update password</SubmitButton>
        </div>
      </form>
    </SectionShell>
  );
}

/* ---------- Animation & Performance ---------- */

const MOTION_OPTIONS: {
  value: MotionPreference;
  label: string;
  blurb: string;
  bullets: string[];
}[] = [
  {
    value: "high",
    label: "High",
    blurb: "Rich animations, premium transitions, enhanced parallax.",
    bullets: ["Advanced micro-interactions", "Intended for powerful devices"],
  },
  {
    value: "smooth",
    label: "Smooth",
    blurb: "Balanced experience with premium animations.",
    bullets: ["Optimized performance", "Recommended for most users"],
  },
  {
    value: "medium",
    label: "Medium",
    blurb: "Lightweight animations and fast interactions.",
    bullets: ["Reduced visual effects", "Best compatibility"],
  },
  {
    value: "minimal",
    label: "Minimal",
    blurb: "Very subtle animations, faster perceived performance.",
    bullets: ["Designed for low-end devices"],
  },
  {
    value: "off",
    label: "Off",
    blurb: "Disable all non-essential animations.",
    bullets: ["Respects accessibility preferences"],
  },
];

function AnimationPerformanceSection() {
  const [pref, setPref] = useMotionPreference();
  const auto = detectAutoLevel();
  const effective = resolveLevel(pref);

  const choose = (next: MotionPreference) => {
    setPref(next);
    writeStoredPreference(next);
  };

  return (
    <SectionShell
      icon={<Gauge className="h-4 w-4" />}
      title="Animation & Performance"
      description={`Currently ${pref === "auto" ? `Auto (${auto})` : effective}. Applies instantly across the app.`}
    >
      <div className="grid gap-2.5">
        <button
          type="button"
          onClick={() => choose("auto")}
          aria-pressed={pref === "auto"}
          className={`group flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-[border-color,background-color] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            pref === "auto"
              ? "border-[color:var(--primary)]/40 bg-primary/[0.06]"
              : "border-[var(--border)] bg-background/40 hover:border-[var(--border-strong)]"
          }`}
        >
          <div>
            <div className="text-[13.5px] font-semibold text-foreground">Automatic</div>
            <div className="mt-0.5 text-[12px] text-muted-foreground">
              Detect device capability and pick the best level ({auto}).
            </div>
          </div>
          <Indicator selected={pref === "auto"} />
        </button>

        {MOTION_OPTIONS.map((opt) => {
          const selected = pref === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => choose(opt.value)}
              aria-pressed={selected}
              className={`group flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-[border-color,background-color] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                selected
                  ? "border-[color:var(--primary)]/40 bg-primary/[0.06]"
                  : "border-[var(--border)] bg-background/40 hover:border-[var(--border-strong)]"
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[13.5px] font-semibold text-foreground">{opt.label}</span>
                  {opt.value === "medium" && (
                    <span className="rounded-full border border-[var(--border)] bg-surface/60 px-1.5 py-px text-[9.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      Default
                    </span>
                  )}
                </div>
                <div className="mt-0.5 text-[12px] text-muted-foreground">{opt.blurb}</div>
                <ul className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11.5px] text-muted-foreground/85">
                  {opt.bullets.map((b) => (
                    <li key={b} className="before:mr-1 before:text-muted-foreground/40 before:content-['•']">{b}</li>
                  ))}
                </ul>
              </div>
              <Indicator selected={selected} />
            </button>
          );
        })}
      </div>
      <p className="mt-4 text-[11.5px] text-muted-foreground/80">
        Your preference is saved on this device and respected on every page. Pages that need essential motion (loaders, alerts) stay active.
      </p>
    </SectionShell>
  );
}

function Indicator({ selected }: { selected: boolean }) {
  return (
    <span
      aria-hidden
      className={`mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors duration-150 ${
        selected ? "border-[color:var(--primary)] bg-primary/15" : "border-[var(--border-strong)] bg-transparent"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full bg-primary transition-transform duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          selected ? "scale-100" : "scale-0"
        }`}
      />
    </span>
  );
}
