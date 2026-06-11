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

const MOTION_LEVELS: {
  value: Exclude<MotionPreference, "auto">;
  label: string;
  blurb: string;
}[] = [
  { value: "off",     label: "Off",     blurb: "Disable all non-essential animations." },
  { value: "minimal", label: "Minimal", blurb: "Very subtle motion, faster perceived performance." },
  { value: "medium",  label: "Medium",  blurb: "Lightweight animations and fast interactions." },
  { value: "smooth",  label: "Smooth",  blurb: "Balanced premium animations." },
  { value: "high",    label: "High",    blurb: "Rich animations and enhanced parallax." },
];

function AnimationPerformanceSection() {
  const [pref, setPref] = useMotionPreference();
  const auto = detectAutoLevel();
  const effective = resolveLevel(pref);
  const isAuto = pref === "auto";
  const activeIdx = Math.max(0, MOTION_LEVELS.findIndex((l) => l.value === effective));
  const current = MOTION_LEVELS[activeIdx];
  const fillPct = MOTION_LEVELS.length === 1 ? 0 : (activeIdx / (MOTION_LEVELS.length - 1)) * 100;

  const choose = (next: MotionPreference) => {
    setPref(next);
    writeStoredPreference(next);
  };

  return (
    <SectionShell
      icon={<Gauge className="h-4 w-4" />}
      title="Animation & Performance"
      description="Drag the slider to set how much motion the app uses. Applies instantly."
    >
      {/* Auto pill */}
      <div className="flex items-center justify-between gap-3">
        <div className="text-[12px] text-muted-foreground">
          {isAuto ? (
            <>Automatic — using <span className="text-foreground font-medium">{auto}</span> on this device.</>
          ) : (
            <>Manual — currently <span className="text-foreground font-medium">{current.label}</span>.</>
          )}
        </div>
        <button
          type="button"
          onClick={() => choose(isAuto ? effective : "auto")}
          aria-pressed={isAuto}
          className={`inline-flex h-7 items-center rounded-full border px-3 text-[11.5px] font-medium transition-[border-color,background-color,color] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            isAuto
              ? "border-[color:var(--primary)]/40 bg-primary/[0.10] text-foreground"
              : "border-[var(--border)] bg-background/40 text-muted-foreground hover:border-[var(--border-strong)] hover:text-foreground"
          }`}
        >
          {isAuto ? "Auto on" : "Use Auto"}
        </button>
      </div>

      {/* Slider */}
      <div className="mt-5">
        <div className="relative h-9 select-none">
          {/* Track */}
          <div className="absolute left-2 right-2 top-1/2 h-[6px] -translate-y-1/2 rounded-full border border-[var(--border)] bg-surface/60" />
          {/* Fill */}
          <div
            className="absolute left-2 top-1/2 h-[6px] -translate-y-1/2 rounded-full bg-gradient-to-r from-[color:color-mix(in_oklab,var(--primary)_55%,transparent)] to-[color:var(--primary)] transition-[width] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{ width: `calc((100% - 16px) * ${fillPct / 100})` }}
            aria-hidden
          />
          {/* Stops */}
          <div className="absolute left-2 right-2 top-1/2 flex -translate-y-1/2 items-center justify-between">
            {MOTION_LEVELS.map((lvl, i) => {
              const reached = i <= activeIdx;
              const isCurrent = i === activeIdx;
              return (
                <button
                  key={lvl.value}
                  type="button"
                  onClick={() => choose(lvl.value)}
                  aria-label={lvl.label}
                  aria-pressed={isCurrent}
                  className="group relative flex h-9 w-9 items-center justify-center"
                >
                  <span
                    className={`block rounded-full border transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      isCurrent
                        ? "h-[18px] w-[18px] border-[color:var(--primary)] bg-background shadow-[0_0_0_4px_color-mix(in_oklab,var(--primary)_18%,transparent)]"
                        : reached
                        ? "h-[10px] w-[10px] border-[color:var(--primary)]/60 bg-[color:color-mix(in_oklab,var(--primary)_70%,transparent)]"
                        : "h-[8px] w-[8px] border-[var(--border-strong)] bg-surface"
                    }`}
                  />
                </button>
              );
            })}
          </div>
          {/* Native range — invisible, captures drag */}
          <input
            type="range"
            min={0}
            max={MOTION_LEVELS.length - 1}
            step={1}
            value={activeIdx}
            onChange={(e) => choose(MOTION_LEVELS[Number(e.target.value)].value)}
            aria-label="Animation level"
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </div>
        {/* Stop labels */}
        <div className="mt-2 flex items-center justify-between px-[2px] text-[10.5px] font-medium uppercase tracking-[0.1em] text-muted-foreground/70">
          {MOTION_LEVELS.map((lvl, i) => (
            <span
              key={lvl.value}
              className={`w-9 text-center transition-colors ${
                i === activeIdx ? "text-foreground" : ""
              }`}
            >
              {lvl.label}
            </span>
          ))}
        </div>
      </div>

      {/* Description for current level */}
      <div className="mt-4 rounded-xl border border-[var(--border)] bg-background/40 px-3.5 py-3 text-[12.5px] text-muted-foreground">
        <span className="font-medium text-foreground">{current.label}.</span>{" "}
        {current.blurb}
      </div>

      <p className="mt-3 text-[11.5px] text-muted-foreground/80">
        Saved on this device. Essential motion (loaders, alerts) stays active. Respects your system's reduce-motion preference.
      </p>
    </SectionShell>
  );
}

