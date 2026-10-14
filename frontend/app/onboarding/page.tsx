"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Brand } from "../components/brand";

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
    <main className="min-h-screen bg-[#121311] px-5 py-6 text-stone-100 sm:px-8">
      <header className="mx-auto flex max-w-6xl items-center justify-between">
        <Brand />
        <Link
          href="/"
          className="text-xs text-stone-500 transition hover:text-stone-200"
        >
          Exit setup
        </Link>
      </header>

      <section className="mx-auto mt-12 max-w-[560px] sm:mt-20">
        <div className="mb-8 flex items-center gap-2" aria-label="Setup progress">
          {[0, 1].map((step) => (
            <span
              key={step}
              className={`h-1 flex-1 rounded-full ${
                step === 0 ? "bg-amber-500" : "bg-white/10"
              }`}
            />
          ))}
        </div>
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-amber-500">
          Workspace setup · Step 1 of 2
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.055em] sm:text-4xl">
          Let’s set up your workspace.
        </h1>
        <p className="mt-3 text-sm leading-6 text-stone-400">
          A little context helps us tailor your equipment overview.
        </p>

        <form
          onSubmit={finishOnboarding}
          className="mt-8 space-y-5 rounded-2xl border border-white/[0.08] bg-[#191a17] p-5 sm:p-7"
        >
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-stone-300">
              Workspace name
            </span>
            <input
              autoFocus
              required
              value={workspace}
              onChange={(event) => setWorkspace(event.target.value)}
              placeholder="e.g. Acme Manufacturing"
              className="h-11 w-full rounded-lg border border-white/10 bg-[#121311] px-3.5 text-sm outline-none placeholder:text-stone-600 focus:border-amber-500/70 focus:ring-2 focus:ring-amber-500/10"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-stone-300">
              What best describes your role?
            </span>
            <select
              value={role}
              onChange={(event) => setRole(event.target.value)}
              className="h-11 w-full rounded-lg border border-white/10 bg-[#121311] px-3.5 text-sm text-stone-200 outline-none focus:border-amber-500/70"
            >
              {roles.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>

          <div>
            <p className="mb-2 text-xs font-medium text-stone-300">
              Which air-conditioning systems will you start with?
            </p>
            <div className="grid grid-cols-2 gap-2">
              {["Split AC units", "Central AC / chillers", "Air handlers", "Other AC systems"].map(
                (asset, index) => (
                  <label
                    key={asset}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-3 text-[11px] transition ${
                      index < 2
                        ? "border-amber-500/35 bg-amber-500/[0.06] text-stone-100"
                        : "border-white/[0.07] text-stone-400 hover:border-white/15"
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

        <p className="mt-5 text-center text-[10px] text-stone-600">
          AC is Sentrix’s first focus. Support for other machine types is part
          of the longer-term direction, not this initial setup.
        </p>
      </section>
    </main>
  );
}
