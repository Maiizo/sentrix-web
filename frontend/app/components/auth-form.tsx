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
    <aside className="relative hidden min-h-screen overflow-hidden border-l border-white/[0.07] bg-[#171815] lg:flex lg:flex-col lg:justify-between lg:p-10 xl:p-14">
      <div className="absolute -right-36 top-12 h-96 w-96 rounded-full bg-amber-500/[0.09] blur-[100px]" />
      <div className="absolute -left-36 bottom-8 h-80 w-80 rounded-full bg-orange-800/[0.08] blur-[100px]" />
      <div className="relative">
        <Brand />
      </div>
      <div className="relative">
        <div className="mb-5 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-amber-500/15 bg-amber-500/[0.08] text-amber-400">
            <BrandMark className="h-5 w-5 rounded-md" />
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-amber-400">
            AC energy example
          </span>
        </div>
        <h2 className="max-w-lg text-4xl font-semibold leading-tight tracking-[-0.06em] text-stone-100 xl:text-5xl">
          See the signal.
          <br />
          <span className="text-stone-500">Waste less cooling energy.</span>
        </h2>
        <p className="mt-4 max-w-md text-sm leading-6 text-stone-400">
          One clear view of AC energy use, cooling health, and the alerts that
          deserve your team’s attention.
        </p>
        <div className="mt-9 max-w-md rounded-xl border border-white/[0.08] bg-[#1c1d19] p-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[8px] uppercase tracking-widest text-stone-500">
              AC unit · sample power draw
            </span>
            <span className="inline-flex items-center gap-1.5 font-mono text-[8px] text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              SAMPLE
            </span>
          </div>
          <div className="mt-2 flex items-end justify-between">
            <span className="font-mono text-3xl tracking-tight text-stone-100">
              4.82<span className="ml-1 text-sm text-amber-400">kW</span>
            </span>
            <span className="mb-1 text-[10px] text-stone-500">Illustrative data</span>
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
      <div className="relative flex items-center justify-between font-mono text-[8px] uppercase tracking-widest text-stone-600">
        <span>Smarter cooling. Clear decisions.</span>
        <span>01 — 03</span>
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

    if (!isSupabaseConfigured || !supabase) {
      sessionStorage.setItem("sentrix-demo-session", "active");
      router.push(isSignup ? "/onboarding" : "/dashboard");
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

    router.push(isSignup ? "/onboarding" : "/dashboard");
  }

  return (
    <main className="grid min-h-screen bg-[#121311] text-stone-100 lg:grid-cols-[minmax(420px,0.88fr)_minmax(0,1.12fr)]">
      <section className="flex min-h-screen flex-col px-5 py-6 sm:px-10 lg:px-12 xl:px-20">
        <div className="flex items-center justify-between">
          <Brand />
          <Link
            href="/"
            className="text-xs text-stone-500 transition hover:text-stone-200"
          >
            Back to home
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-[390px] flex-1 flex-col justify-center py-12">
          <div className="mb-7 lg:hidden">
            <BrandMark className="h-9 w-9 rounded-xl" />
          </div>
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-amber-500">
            {isSignup ? "Start with Sentrix" : "Welcome back"}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.055em] sm:text-4xl">
            {isSignup ? "Create your account" : "Log in to Sentrix"}
          </h1>
          <p className="mt-2 text-sm text-stone-400">
            {isSignup
              ? "Set up your workspace and bring your fleet into focus."
              : "Your operation is right where you left it."}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {isSignup && (
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-stone-300">
                  Full name
                </span>
                <input
                  autoComplete="name"
                  required
                  name="name"
                  placeholder="Alex Morgan"
                  className="h-11 w-full rounded-lg border border-white/10 bg-[#191a17] px-3.5 text-sm text-stone-100 outline-none transition placeholder:text-stone-600 focus:border-amber-500/70 focus:ring-2 focus:ring-amber-500/10"
                />
              </label>
            )}
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-stone-300">
                Work email
              </span>
              <input
                autoComplete="email"
                required
                type="email"
                name="email"
                placeholder="you@company.com"
                className="h-11 w-full rounded-lg border border-white/10 bg-[#191a17] px-3.5 text-sm text-stone-100 outline-none transition placeholder:text-stone-600 focus:border-amber-500/70 focus:ring-2 focus:ring-amber-500/10"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-stone-300">
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
                  className="h-11 w-full rounded-lg border border-white/10 bg-[#191a17] px-3.5 pr-16 text-sm text-stone-100 outline-none transition placeholder:text-stone-600 focus:border-amber-500/70 focus:ring-2 focus:ring-amber-500/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute inset-y-0 right-3 text-[10px] text-stone-500 hover:text-stone-200"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </label>
            {isSignup && (
              <label className="flex items-start gap-2.5 pt-1 text-[10px] leading-5 text-stone-400">
                <input
                  required
                  type="checkbox"
                  className="mt-1 accent-amber-500"
                />
                <span>
                  I agree to Sentrix’s terms and understand this preview does not
                  create a persistent account.
                </span>
              </label>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-amber-500 text-xs font-semibold text-[#17140d] transition hover:bg-amber-400 disabled:cursor-wait disabled:opacity-60"
            >
              {isSubmitting ? "Connecting…" : isSignup ? "Create account" : "Log in"}
              {!isSubmitting && <span aria-hidden="true">→</span>}
            </button>
          </form>

          {formError && (
            <p
              role="status"
              className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-3 py-2.5 text-center text-[10px] leading-4 text-amber-300"
            >
              {formError}
            </p>
          )}

          <p className="mt-6 text-center text-xs text-stone-500">
            {isSignup ? "Already have an account?" : "New to Sentrix?"}{" "}
            <Link
              href={isSignup ? "/login" : "/signup"}
              className="font-medium text-amber-400 transition hover:text-amber-300"
            >
              {isSignup ? "Log in" : "Create an account"}
            </Link>
          </p>

          <p className="mt-8 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-center text-[10px] leading-4 text-stone-500">
            Preview mode: this form does not send or store your credentials.
          </p>
        </div>

        <div className="flex justify-between font-mono text-[8px] uppercase tracking-widest text-stone-600">
          <span>Sentrix · AC climate intelligence</span>
          <span>Secure workspace</span>
        </div>
      </section>
      <AuthArtwork />
    </main>
  );
}
