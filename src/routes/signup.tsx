import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { signup as apiSignup, isLoggedIn, saveSession, googleAuthUrl } from "@/lib/api";
import { InlineErrorBanner } from "@/components/InlineErrorBanner";
import {
  AuthShell,
  AuthDivider,
  GoogleButton,
  PremiumField,
  PrimaryButton,
} from "@/components/auth/AuthShell";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
  head: () => ({
    meta: [
      { title: "Create your account — SymDeals" },
      { name: "description", content: "Create a SymDeals account." },
      { property: "og:title", content: "Create your account — SymDeals" },
      { property: "og:description", content: "Create a SymDeals account." },
    ],
  }),
});

type FormState = {
  name: string;
  email: string;
  password: string;
  confirm: string;
};
type FormErrors = Partial<Record<keyof FormState, string>>;

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!form.name.trim()) errors.name = "Required";
  else if (form.name.trim().length < 2) errors.name = "Name is too short";
  if (!form.email.trim()) errors.email = "Required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    errors.email = "Enter a valid email";
  if (!form.password) errors.password = "Required";
  else if (form.password.length < 8) errors.password = "Use at least 8 characters";
  if (!form.confirm) errors.confirm = "Required";
  else if (form.confirm !== form.password) errors.confirm = "Passwords don't match";
  return errors;
}

function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<keyof FormState, boolean>>({
    name: false,
    email: false,
    password: false,
    confirm: false,
  });
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
    setTouched({ name: true, email: true, password: true, confirm: true });
    if (Object.keys(v).length > 0) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      const res = await apiSignup({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      saveSession(res);
      navigate({ to: "/verify-email", search: { next: "/dashboard" } });
    } catch (err) {
      setSubmitError(
        err instanceof Error && err.message ? err.message : "Signup failed. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const onGoogle = () => {
    setGoogleLoading(true);
    window.location.href = googleAuthUrl("/dashboard");
  };

  return (
    <>
      <AuthShell>
        <div className="mb-7 text-center">
          <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-white">
            Create a SymDeals account
          </h1>
          <p className="mt-2 text-[13.5px] text-white/55">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-white hover:underline">
              Log in
            </Link>
            .
          </p>
        </div>

        <GoogleButton loading={googleLoading} onClick={onGoogle} label="Sign up with Google" />

        <AuthDivider />

        <form className="space-y-3.5" onSubmit={onSubmit}>
          <PremiumField
            label="Full name"
            type="text"
            value={form.name}
            onChange={(v) => update("name", v)}
            onBlur={() => blur("name")}
            error={touched.name ? errors.name : undefined}
            autoComplete="name"
            placeholder="Alan Turing"
          />
          <PremiumField
            label="Email"
            type="email"
            value={form.email}
            onChange={(v) => update("email", v)}
            onBlur={() => blur("email")}
            error={touched.email ? errors.email : undefined}
            autoComplete="email"
            placeholder="alan.turing@example.com"
          />
          <PremiumField
            label="Password"
            type={showPwd ? "text" : "password"}
            value={form.password}
            onChange={(v) => update("password", v)}
            onBlur={() => blur("password")}
            error={touched.password ? errors.password : undefined}
            autoComplete="new-password"
            placeholder="At least 8 characters"
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
          <PremiumField
            label="Confirm password"
            type={showConfirm ? "text" : "password"}
            value={form.confirm}
            onChange={(v) => update("confirm", v)}
            onBlur={() => blur("confirm")}
            error={touched.confirm ? errors.confirm : undefined}
            autoComplete="new-password"
            placeholder="Re-enter password"
            rightAdornment={
              <button
                type="button"
                onClick={() => setShowConfirm((s) => !s)}
                aria-label={showConfirm ? "Hide password" : "Show password"}
                className="text-white/40 transition-colors hover:text-white/80"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
          />

          {submitError && (
            <InlineErrorBanner message={submitError} onDismiss={() => setSubmitError(null)} />
          )}

          <PrimaryButton loading={submitting}>
            {submitting ? "Creating account…" : "Create account"}
          </PrimaryButton>
        </form>

        <p className="mt-8 text-center text-[11.5px] leading-[1.6] text-white/40">
          By signing up, you agree to our{" "}
          <a href="#" className="text-white/70 hover:underline">Terms</a>,{" "}
          <a href="#" className="text-white/70 hover:underline">Acceptable Use</a>, and{" "}
          <a href="#" className="text-white/70 hover:underline">Privacy Policy</a>.
        </p>
      </AuthShell>

      <OtpVerifyModal
        open={otpOpen}
        email={signedUpEmail}
        autoSend={false}
        onClose={() => {
          setOtpOpen(false);
          setShowOnboardingLoader(true);
        }}
        onVerified={() => {
          setOtpOpen(false);
          setShowOnboardingLoader(true);
        }}
        onSkip={() => {
          setOtpOpen(false);
          setShowOnboardingLoader(true);
        }}
      />

      <OnboardingLoader
        open={showOnboardingLoader}
        onComplete={() => navigate({ to: "/dashboard" })}
      />
    </>
  );
}
