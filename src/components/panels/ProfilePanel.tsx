import { useEffect, useState, type FormEvent } from "react";
import { KeyRound, Mail, User as UserIcon } from "lucide-react";
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
        <UserIcon className="h-3 w-3 text-primary" />
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Account
        </span>
      </div>
      <h1 className="mt-4 font-display text-[2rem] font-semibold leading-[1.05] tracking-[-0.03em] text-foreground sm:text-[2.25rem]">
        My profile
      </h1>
      <p className="mt-2 text-[14px] text-muted-foreground">
        Update your account details. Email and password changes require your current password.
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
          label="Full Name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          required
          autoComplete="name"
        />
        <div>
          <SubmitButton loading={submitting}>Update Name</SubmitButton>
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
          label="New Email"
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          maxLength={255}
          required
          autoComplete="email"
          placeholder="you@example.com"
        />
        <Field
          label="Current Password"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          autoComplete="current-password"
          placeholder="Enter your current password"
        />
        <div>
          <SubmitButton loading={submitting}>Update Email</SubmitButton>
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
          label="Current Password"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
        <Field
          label="New Password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
        />
        <div>
          <SubmitButton loading={submitting}>Update Password</SubmitButton>
        </div>
      </form>
    </SectionShell>
  );
}
