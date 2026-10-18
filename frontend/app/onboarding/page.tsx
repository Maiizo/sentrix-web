"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Brand } from "../components/brand";
import { ThemeToggle } from "../components/theme-toggle";

const roles = [
  "Facilities / Building operations",
  "HVAC maintenance",
  "Energy / Sustainability",
  "Engineering",
  "Other",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [workspace, setWorkspace] = useState("");
  const [role, setRole] = useState(roles[0]);

  function finishOnboarding(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sessionStorage.setItem("sentrix-demo-session", "active");
    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen bg-[var(--canvas)] px-5 py-6 text-[var(--text-primary)] transition-colors duration-200 sm:px-8">
      <header className="mx-auto flex max-w-6xl items-center justify-between">
        <Brand />
        <div className="flex items-center gap-3">
          <ThemeToggle showLabel={false} />
          <Link
            href="/"
            className="text-xs text-[var(--text-muted)] transition hover:text-[var(--text-primary)]"
          >
            Exit setup
          </Link>
        </div>
      </header>

      <section className="mx-auto mt-12 max-w-[560px] sm:mt-20">
        <div className="mb-8 flex items-center gap-2" aria-label="Setup progress">
          {[0, 1].map((step) => (
            <span
              key={step}
              className={`h-1 flex-1 rounded-full ${
                step === 0 ? "bg-amber-500" : "bg-[var(--border)]"
              }`}
            />
          ))}
        </div>
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-amber-500">
          Workspace setup · Step 1 of 2
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.055em] text-[var(--text-primary)] sm:text-4xl">
          Set up your workspace
        </h1>

        <form
          onSubmit={finishOnboarding}
          className="mt-8 space-y-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-7 shadow-sm"
        >
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
              Workspace name
            </span>
            <input
              autoFocus
              required
              value={workspace}
              onChange={(event) => setWorkspace(event.target.value)}
              placeholder="e.g. Acme Manufacturing"
              className="h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--canvas)] px-3.5 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:border-amber-500/70 focus:ring-2 focus:ring-amber-500/10"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
              What best describes your role?
            </span>
            <select
              value={role}
              onChange={(event) => setRole(event.target.value)}
              className="h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--canvas)] px-3.5 text-sm text-[var(--text-primary)] outline-none focus:border-amber-500/70"
            >
              {roles.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <div>
            <p className="mb-2 text-xs font-medium text-[var(--text-secondary)]">
              Which air-conditioning systems will you start with?
            </p>
            <div className="grid grid-cols-2 gap-2">
              {["Split AC units", "Central AC / chillers", "Air handlers", "Other AC systems"].map(
                (asset, index) => (
                  <label
                    key={asset}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-3 text-[11px] transition ${
                      index < 2
                        ? "border-amber-500/35 bg-amber-500/[0.06] text-[var(--text-primary)] font-medium"
                        : "border-[var(--border)] bg-[var(--canvas)] text-[var(--text-muted)] hover:border-amber-500/30"
                    }`}
                  >
                    <input
                      type="checkbox"
                      defaultChecked={index < 2}
                      className="accent-amber-500"
                    />
                    {asset}
                  </label>
                ),
              )}
            </div>
          </div>

          <button
            type="submit"
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-amber-500 text-xs font-semibold text-[#17140d] transition hover:bg-amber-400"
          >
            Create workspace <span aria-hidden="true">→</span>
          </button>
        </form>
      </section>
    </main>
  );
}
