import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { login as apiLogin, isLoggedIn, saveSession, googleAuthUrl } from "@/lib/api";
import { InlineErrorBanner } from "@/components/InlineErrorBanner";
import {
  AuthShell,
  AuthDivider,
  GoogleButton,
  PremiumField,
  PrimaryButton,
} from "@/components/auth/AuthShell";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Log in — SymDeals" },
      {
        name: "description",
        content: "Log in to your SymDeals account.",
      },
      { property: "og:title", content: "Log in — SymDeals" },
      {
        property: "og:description",
        content: "Log in to your SymDeals account.",
      },
    ],
  }),
});

type FormState = { email: string; password: string };
type FormErrors = Partial<Record<keyof FormState, string>>;

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!form.email.trim()) errors.email = "Required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    errors.email = "Enter a valid email";
  if (!form.password) errors.password = "Required";
  return errors;
}

function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>({ email: "", password: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<keyof FormState, boolean>>({
    email: false,
    password: false,
  });
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoggedIn()) navigate({ to: "/dashboard" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (key: keyof FormState, value: string) => {
    const next = { ...form, [key]: value };
    setForm(next);
    if (touched[key]) setErrors(validate(next));
    if (submitError) setSubmitError(null);
  };
  const blur = (key: keyof FormState) => {
    setTouched((t) => ({ ...t, [key]: true }));
    setErrors(validate(form));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = validate(form);
    setErrors(v);
    setTouched({ email: true, password: true });
    if (Object.keys(v).length > 0) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      const res = await apiLogin({
        email: form.email.trim(),
        password: form.password,
      });
      saveSession(res);
      navigate({ to: "/dashboard" });
    } catch (err) {
      setSubmitError(
        err instanceof Error && err.message ? err.message : "Login failed. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const onGoogle = () => {
    setGoogleLoading(true);
    window.location.href = googleAuthUrl("/dashboard");
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("auth_error");
    if (!code) return;
    const friendly: Record<string, string> = {
      google_cancelled: "Google sign-in was cancelled.",
      google_unavailable: "Google sign-in is temporarily unavailable.",
      google_email_unverified: "Your Google email is not verified.",
      google_account_conflict: "This email is already linked to another account.",
      google_state_mismatch: "Sign-in session expired. Please try again.",
    };
    setSubmitError(friendly[code] || "Google sign-in failed. Please try again.");
    params.delete("auth_error");
    const qs = params.toString();
    window.history.replaceState({}, "", window.location.pathname + (qs ? `?${qs}` : ""));
  }, []);

  return (
    <AuthShell>
      <div className="mb-7 text-center">
        <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-white">
          Log in to SymDeals
        </h1>
        <p className="mt-2 text-[13.5px] text-white/55">
          Don't have an account?{" "}
          <Link to="/signup" className="font-medium text-white hover:underline">
            Sign up
          </Link>
          .
        </p>
      </div>

      <GoogleButton loading={googleLoading} onClick={onGoogle} label="Log in with Google" />

      <AuthDivider />

      <form className="space-y-3.5" onSubmit={onSubmit}>
        <PremiumField
          label="Email"
          type="email"
          value={form.email}
          onChange={(v) => update("email", v)}
          onBlur={() => blur("email")}
          error={touched.email ? errors.email : undefined}
          autoComplete="email"
          autoFocus
          placeholder="alan.turing@example.com"
        />

        <PremiumField
          label="Password"
          type={showPwd ? "text" : "password"}
          value={form.password}
          onChange={(v) => update("password", v)}
          onBlur={() => blur("password")}
          error={touched.password ? errors.password : undefined}
          autoComplete="current-password"
          placeholder="••••••••••••"
          trailingLink={
            <Link
              to="/forgot-password"
              className="text-[11.5px] font-medium text-white/55 transition-colors hover:text-white"
            >
              Forgot password?
            </Link>
          }
          rightAdornment={
            <button
              type="button"
              onClick={() => setShowPwd((s) => !s)}
              aria-label={showPwd ? "Hide password" : "Show password"}
              className="text-white/40 transition-colors hover:text-white/80"
            >
              {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
        />

        {submitError && (
          <InlineErrorBanner message={submitError} onDismiss={() => setSubmitError(null)} />
        )}

        <PrimaryButton loading={submitting}>
          {submitting ? "Logging in…" : "Log in"}
        </PrimaryButton>
      </form>

      <p className="mt-8 text-center text-[11.5px] text-white/40">
        By logging in, you agree to our{" "}
        <a href="#" className="text-white/70 hover:underline">Terms</a> and{" "}
        <a href="#" className="text-white/70 hover:underline">Privacy Policy</a>.
      </p>
    </AuthShell>
  );
}
