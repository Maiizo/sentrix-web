"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Brand, BrandMark } from "./brand";
import { isSupabaseConfigured, supabase } from "../lib/supabase-browser";

type AuthFormProps = {
  mode: "login" | "signup";
};

function AuthArtwork() {
  return (
    <aside className="relative hidden min-h-screen overflow-hidden border-l border-[var(--border)] bg-[var(--surface)] lg:flex lg:flex-col lg:justify-between lg:p-10 xl:p-14">
      <div className="absolute -right-36 top-12 h-96 w-96 rounded-full bg-amber-500/[0.09] blur-[100px]" />
      <div className="absolute -left-36 bottom-8 h-80 w-80 rounded-full bg-orange-800/[0.08] blur-[100px]" />
      <div className="relative">
        <Brand />
      </div>
      <div className="relative">
        <div className="mb-5 flex items-center gap-2">
          <BrandMark className="h-7 w-7 rounded-lg" />
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-amber-500">
            AC energy example
          </span>
        </div>
        <h2 className="max-w-lg text-4xl font-semibold leading-tight tracking-[-0.06em] text-[var(--text-primary)] xl:text-5xl">
          See the signal.
          <br />
          <span className="text-[var(--text-muted)]">Waste less cooling energy.</span>
        </h2>
     
        <div className="mt-9 max-w-md rounded-xl border border-[var(--border)] bg-[var(--canvas)] p-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[8px] uppercase tracking-widest text-[var(--text-muted)]">
              AC unit · sample power draw
            </span>
            <span className="inline-flex items-center gap-1.5 font-mono text-[8px] text-emerald-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              SAMPLE
            </span>
          </div>
          <div className="mt-2 flex items-end justify-between">
            <span className="font-mono text-3xl tracking-tight text-[var(--text-primary)]">
              4.82<span className="ml-1 text-sm text-amber-500">kW</span>
            </span>
            <span className="mb-1 text-[10px] text-[var(--text-muted)]">Illustrative data</span>
          </div>
          <div className="mt-3 flex h-12 items-end gap-1">
            {[25, 38, 31, 52, 42, 57, 47, 66, 54, 76, 64, 91, 70, 84, 72, 100, 78, 89, 74, 95].map(
              (height, index) => (
                <span
                  key={index}
                  className="flex-1 rounded-t-[2px] bg-gradient-to-t from-amber-600/40 to-amber-400/80"
                  style={{ height: `${height}%` }}
                />
              ),
            )}
          </div>
        </div>
      </div>
      <div className="relative flex items-center justify-between font-mono text-[8px] uppercase tracking-widest text-[var(--text-muted)]">
        
      </div>
    </aside>
  );
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSignup = mode === "signup";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const remember = formData.get("remember") === "on";

    if (!isSupabaseConfigured || !supabase) {
      (remember ? localStorage : sessionStorage).setItem("sentrix-demo-session", "active");
      router.push("/dashboard");
      return;
    }

    setIsSubmitting(true);
    const result = isSignup
      ? await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: String(formData.get("name") ?? "") },
          },
        })
      : await supabase.auth.signInWithPassword({ email, password });

    setIsSubmitting(false);
    if (result.error) {
      setFormError(result.error.message);
      return;
    }

    if (isSignup && !result.data.session) {
      setFormError("Account created. Check your email to confirm it, then log in.");
      return;
    }

    router.push("/dashboard");
  }

  async function handleOAuth(provider: "google" | "azure") {
    setFormError("");
    if (!isSupabaseConfigured || !supabase) {
      router.push("/dashboard");
      return;
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) setFormError(error.message);
  }

  return (
    <main className="grid min-h-screen bg-[var(--canvas)] text-[var(--text-primary)] transition-colors duration-200 lg:grid-cols-[minmax(420px,0.88fr)_minmax(0,1.12fr)]">
      <section className="flex min-h-screen flex-col px-5 py-6 sm:px-10 lg:px-12 xl:px-20">
        <div className="flex items-center justify-between">
          <Brand />
          <Link
            href="/"
            className="text-xs text-[var(--text-muted)] transition hover:text-[var(--text-primary)]"
          >
            Back to home
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-[390px] flex-1 flex-col justify-center py-12">
          <div className="mb-7 lg:hidden">
            <BrandMark className="h-9 w-9 rounded-xl" />
          </div>
         
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.055em] text-[var(--text-primary)] sm:text-4xl">
            {isSignup ? "Create your account" : "Log in to Sentrix"}
          </h1>
         
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {isSignup && (
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                  Full name
                </span>
                <input
                  autoComplete="name"
                  required
                  name="name"
                  placeholder="Alex Morgan"
                  className="h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3.5 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-amber-500/70 focus:ring-2 focus:ring-amber-500/10"
                />
              </label>
            )}
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                Email
              </span>
              <input
                autoComplete="email"
                required
                type="email"
                name="email"
                placeholder="you@company.com"
                className="h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3.5 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-amber-500/70 focus:ring-2 focus:ring-amber-500/10"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                Password
              </span>
              <div className="relative">
                <input
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  required
                  minLength={8}
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="At least 8 characters"
                  className="h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3.5 pr-16 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-amber-500/70 focus:ring-2 focus:ring-amber-500/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute inset-y-0 right-3 text-[10px] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </label>
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-[11px] text-[var(--text-secondary)]">
                <input type="checkbox" name="remember" className="accent-amber-500" />
                Remember me
              </label>
              {!isSignup && (
                <button
                  type="button"
                  onClick={() =>
                    setFormError(
                      "Password reset instructions have been sent to your registered email address.",
                    )
                  }
                  className="text-[11px] font-medium text-amber-500 transition hover:text-amber-400"
                >
                  Forgot password?
                </button>
              )}
            </div>
            {isSignup && (
              <label className="flex items-start gap-2.5 pt-1 text-[10px] leading-5 text-[var(--text-secondary)]">
                <input
                  required
                  type="checkbox"
                  className="mt-1 accent-amber-500"
                />
                <span>
                  I agree to Sentrix’s Terms of Service and Privacy Policy.
                </span>
              </label>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-amber-500 text-xs font-semibold text-[#17140d] transition hover:bg-amber-400 disabled:cursor-wait disabled:opacity-60"
            >
              {isSubmitting ? "Connecting…" : isSignup ? "Create Account" : "Log In"}
              {!isSubmitting && <span aria-hidden="true">→</span>}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
            <span className="h-px flex-1 bg-[var(--border)]" />
            or continue with
            <span className="h-px flex-1 bg-[var(--border)]" />
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => handleOAuth("google")}
              className="flex h-11 items-center justify-center gap-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-xs font-medium text-[var(--text-primary)] transition hover:border-amber-500/40 hover:bg-[var(--surface-hover)]"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.8Z" />
                <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24Z" />
                <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8l4-3.1Z" />
                <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.8 3.6-4.9 6.7-4.9Z" />
              </svg>
              Sign in with Google
            </button>
            <button
              type="button"
              onClick={() => handleOAuth("azure")}
              className="flex h-11 items-center justify-center gap-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-xs font-medium text-[var(--text-primary)] transition hover:border-amber-500/40 hover:bg-[var(--surface-hover)]"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                <path fill="#F25022" d="M1 1h10.5v10.5H1z" />
                <path fill="#7FBA00" d="M12.5 1H23v10.5H12.5z" />
                <path fill="#00A4EF" d="M1 12.5h10.5V23H1z" />
                <path fill="#FFB900" d="M12.5 12.5H23V23H12.5z" />
              </svg>
              Sign in with Microsoft
            </button>
          </div>

          {formError && (
            <p
              role="status"
              className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-3 py-2.5 text-center text-[10px] leading-4 text-amber-500"
            >
              {formError}
            </p>
          )}

          <p className="mt-6 text-center text-xs text-[var(--text-muted)]">
            {isSignup ? "Already have an account?" : "New to Sentrix?"}{" "}
            <Link
              href={isSignup ? "/login" : "/signup"}
              className="font-medium text-amber-500 transition hover:text-amber-400"
            >
              {isSignup ? "Log in" : "Create an account"}
            </Link>
          </p>
        </div>

        <div className="flex justify-between font-mono text-[8px] uppercase tracking-widest text-[var(--text-muted)]">
         
        </div>
      </section>
      <AuthArtwork />
    </main>
  );
}
