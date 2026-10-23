"use client";

import { useState } from "react";
import Link from "next/link";
import { Brand } from "./components/brand";
import { ThemeToggle } from "./components/theme-toggle";

type FaultScenario = "filter" | "leak" | "after_hours";

export default function Home() {
  const [activeScenario, setActiveScenario] = useState<FaultScenario>("filter");
  const [operatorFeedback, setOperatorFeedback] = useState<string | null>(null);
  const [hardwareView, setHardwareView] = useState<"photo" | "schematic">("photo");

  return (
    <main className="min-h-screen bg-[var(--canvas)] font-sans text-[var(--text-primary)] transition-colors duration-200">
      {/* 1. Sticky Top Header (Larger & Clearer) */}
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--canvas)]/90 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-[1280px] items-center justify-between px-6 sm:px-8">
          <Brand />

          <nav className="hidden items-center gap-8 text-base font-medium text-[var(--text-secondary)] md:flex">
            <a className="transition hover:text-[var(--text-primary)]" href="#overview">
              Overview
            </a>
            <a className="transition hover:text-[var(--text-primary)]" href="#how-it-works">
              How It Works
            </a>
            <a className="transition hover:text-[var(--text-primary)]" href="#live-panel">
              AC Panel Monitor
            </a>
            <a className="transition hover:text-[var(--text-primary)]" href="#specifications">
              System Specs
            </a>
          </nav>

          <div className="flex items-center gap-4">
            <ThemeToggle showLabel={false} />
            <Link
              href="/login"
              className="rounded-lg px-4 py-2.5 text-base font-medium text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
            >
              Log in
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-amber-500 px-5 text-base font-semibold text-[#17140d] transition hover:bg-amber-400"
            >
              Open Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Split Asymmetric Industrial Hero */}
      <section className="px-6 pt-12 pb-16 sm:px-8 sm:pt-16 sm:pb-24">
        <div className="mx-auto max-w-[1280px]">
          <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
            {/* Left Column (7 cols) */}
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-1 font-mono text-xs font-semibold uppercase tracking-wider text-amber-500">
                COMMERCIAL AC CIRCUIT MONITORING · SCT-013 + AUTO-ARIMA
              </div>

              <h1 className="mt-5 text-4xl font-bold tracking-tight leading-[1.08] text-[var(--text-primary)] sm:text-5xl lg:text-6xl">
                Catch AC Compressor &amp; Cooling Faults Before the Breaker Trips.
              </h1>

              <p className="mt-6 max-w-2xl text-lg sm:text-xl leading-relaxed text-[var(--text-secondary)]">
                Clamp our non-invasive current sensor onto your AC distribution panel.
                Sentrix learns each unit&apos;s normal 7-day electrical rhythm in Amps and alerts your
                maintenance team the moment power draw drifts outside safe bounds.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/signup"
                  className="inline-flex h-12 items-center justify-center rounded-xl bg-amber-500 px-6 text-base font-semibold text-[#17140d] shadow-md shadow-amber-500/20 transition hover:bg-amber-400"
                >
                  Start Monitoring Your AC Fleet →
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex h-12 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] px-6 text-base font-semibold text-[var(--text-primary)] transition hover:bg-[var(--surface-hover)]"
                >
                  See How It Works
                </a>
              </div>

              {/* 3 Quick Operational Facts Strip */}
              <div className="mt-10 grid grid-cols-3 gap-4 border-t border-[var(--border)] pt-6">
                <div>
                  <p className="font-mono text-5xl font-bold text-amber-500">1-Min</p>
                  <p className="mt-1 text-sm font-medium text-[var(--text-secondary)]">
                    RMS Current Sampling
                  </p>
                </div>
                <div>
                  <p className="font-mono text-5xl font-bold text-[var(--text-primary)]">7-Day</p>
                  <p className="mt-1 text-sm font-medium text-[var(--text-secondary)]">
                    Baseline Calibration
                  </p>
                </div>
                <div>
                  <p className="font-mono text-5xl font-bold text-emerald-500">0</p>
                  <p className="mt-1 text-sm font-medium text-[var(--text-secondary)]">
                    Wire Cutting Required
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column (5 cols) — Concrete AC Panel Readout */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl">
                {/* Panel Header */}
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">
                      Distribution Sub-Panel
                    </p>
                    <h2 className="mt-0.5 text-base font-bold text-[var(--text-primary)] font-mono">
                      MAIN SERVER ROOM · MESH A1B2C3
                    </h2>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 font-mono text-xs font-semibold text-emerald-500">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    ROOT ONLINE
                  </span>
                </div>

                <div className="mt-5 space-y-4">
                  {/* Circuit 1: Alert State */}
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-base font-bold text-[var(--text-primary)]">
                          Chiller Unit 01 (MCB-A1)
                        </p>
                        <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                          Target Setpoint: <strong className="text-[var(--text-primary)]">18°C</strong>
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono uppercase text-red-500 font-semibold block">
                          Current Load
                        </span>
                        <p className="font-mono text-2xl font-bold text-red-500 leading-tight">
                          21.4 A
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-red-500/20 pt-2.5">
                      <span className="text-xs font-mono text-[var(--text-secondary)]">
                        Safe ARIMA Range: <strong className="text-[var(--text-primary)]">11.8 - 16.5 A</strong>
                      </span>
                      <span className="rounded bg-red-500 px-2 py-0.5 font-mono text-xs font-bold text-white">
                        OVERLOAD +4.9A: CHECK COIL / FILTER
                      </span>
                    </div>
                  </div>

                  {/* Circuit 2: Normal State */}
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--canvas)] p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-base font-bold text-[var(--text-primary)]">
                          East Office Split AC (MCB-B3)
                        </p>
                        <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                          Target Setpoint: <strong className="text-[var(--text-primary)]">23°C</strong>
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono uppercase text-[var(--text-muted)] block">
                          Current Load
                        </span>
                        <p className="font-mono text-2xl font-bold text-emerald-500 leading-tight">
                          9.6 A
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border)] pt-2.5">
                      <span className="text-xs font-mono text-[var(--text-secondary)]">
                        Safe ARIMA Range: <strong className="text-[var(--text-primary)]">8.2 - 11.0 A</strong>
                      </span>
                      <span className="rounded bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 font-mono text-xs font-semibold text-emerald-500">
                        WITHIN SAFE ZONE
                      </span>
                    </div>
                  </div>

                  {/* 24-Hour RMS Current & Safe-Zone SVG Graph */}
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--canvas)] p-4">
                    <div className="flex items-center justify-between text-xs font-mono text-[var(--text-muted)] mb-2">
                      <span className="font-semibold text-[var(--text-primary)]">
                        Chiller 01: 24-Hour RMS Current &amp; ARIMA Band
                      </span>
                      <span className="text-amber-500">ARIMA Band (11.8 - 16.5A)</span>
                    </div>

                    <div className="relative h-36 w-full overflow-hidden rounded-lg bg-[var(--surface)] p-2">
                      <svg viewBox="0 0 500 130" preserveAspectRatio="none" className="h-full w-full">
                        <defs>
                          <linearGradient id="arimaBandFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.22" />
                            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.08" />
                          </linearGradient>
                        </defs>

                        {/* ARIMA Safe Zone Shaded Band */}
                        <polygon
                          points="0,68 125,65 250,62 375,64 500,65 500,44 375,44 250,42 125,45 0,46"
                          fill="url(#arimaBandFill)"
                        />
                        {/* Upper Safe Limit Line */}
                        <line x1="0" y1="45" x2="500" y2="44" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 4" />
                        {/* Lower Safe Limit Line */}
                        <line x1="0" y1="68" x2="500" y2="65" stroke="#f59e0b" strokeWidth="1" strokeOpacity="0.4" strokeDasharray="3 3" />

                        {/* Normal Current Spline */}
                        <path
                          d="M 0 58 Q 62 52 125 56 T 250 54 T 340 52"
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />

                        {/* Anomaly Surge Spike */}
                        <path
                          d="M 340 52 Q 380 40 420 18 T 500 20"
                          fill="none"
                          stroke="#ef4444"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />

                        {/* Red Anomaly Marker at Peak */}
                        <circle cx="420" cy="18" r="5" fill="#ef4444" />
                        <circle cx="420" cy="18" r="9" fill="#ef4444" opacity="0.3" />
                      </svg>

                      {/* Anomaly Callout Tag */}
                      <div className="absolute top-2 right-12 rounded bg-red-500 px-2 py-0.5 text-xs font-mono font-bold text-white shadow-sm">
                        21.4 A Spiked Above Upper Limit
                      </div>

                      {/* X-Axis Time Labels */}
                      <div className="absolute bottom-1 inset-x-2 flex justify-between font-mono text-xs text-[var(--text-muted)]">
                        <span>00:00</span>
                        <span>06:00</span>
                        <span>12:00</span>
                        <span>18:00</span>
                        <span className="font-bold text-amber-500">24:00</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2.5 Section #overview: Smarter Air Conditioning · A Practical Climate Win */}
      <section id="overview" className="border-t border-[var(--border)] bg-[var(--canvas)] px-6 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-[1280px]">
          <div className="max-w-2xl">
            <p className="font-mono text-xs font-semibold uppercase tracking-wider text-amber-500">
              START WHERE THE ENERGY GOES
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl lg:text-5xl">
              Smarter air conditioning.
              <span className="block text-[var(--text-secondary)] font-normal">A practical climate win.</span>
            </h2>
            <p className="mt-4 text-base sm:text-lg leading-relaxed text-[var(--text-secondary)]">
              We&apos;re deliberately beginning with air conditioning—a practical way to focus our
              team and climate impact. The broader vision is a flexible platform that can
              support more machine types as Sentrix develops.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
            {/* Card 01: Connect */}
            <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-7 flex flex-col justify-between transition hover:border-amber-500/40 hover:bg-[var(--surface-hover)] shadow-sm">
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-500/25 bg-amber-500/10 text-amber-500">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />
                    </svg>
                  </div>
                  <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">
                    01 / CONNECT
                  </span>
                </div>

                <h3 className="mt-6 text-xl font-bold text-[var(--text-primary)]">
                  Start with the AC you have
                </h3>
                <p className="mt-2.5 text-base leading-relaxed text-[var(--text-secondary)]">
                  Air conditioners are our first use case. We&apos;re keeping the initial product focused
                  while building a foundation that can grow to other machine types over time.
                </p>
              </div>

              <div className="mt-6 border-t border-[var(--border)] pt-4 font-mono text-sm font-medium text-amber-500 flex items-center gap-2">
                <span className="text-amber-500 font-bold">↗</span>
                Phase 01 · Air conditioning
              </div>
            </article>

            {/* Card 02: Predict */}
            <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-7 flex flex-col justify-between transition hover:border-amber-500/40 hover:bg-[var(--surface-hover)] shadow-sm">
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-500/25 bg-amber-500/10 text-amber-500">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                  </div>
                  <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">
                    02 / PREDICT
                  </span>
                </div>

                <h3 className="mt-6 text-xl font-bold text-[var(--text-primary)]">
                  Find cooling that costs more
                </h3>
                <p className="mt-2.5 text-base leading-relaxed text-[var(--text-secondary)]">
                  Compare each unit&apos;s operating pattern over time to flag unusual energy draw,
                  extended runtimes, and potential maintenance needs.
                </p>
              </div>

              <div className="mt-6 border-t border-[var(--border)] pt-4 font-mono text-sm font-medium text-amber-500 flex items-center gap-2">
                <span className="text-amber-500 font-bold">↗</span>
                Anomalies worth investigating
              </div>
            </article>

            {/* Card 03: Improve */}
            <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-7 flex flex-col justify-between transition hover:border-amber-500/40 hover:bg-[var(--surface-hover)] shadow-sm">
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-500/25 bg-amber-500/10 text-amber-500">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                      <path d="M3 3v5h5" />
                      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                      <path d="M16 16h5v5" />
                    </svg>
                  </div>
                  <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">
                    03 / IMPROVE
                  </span>
                </div>

                <h3 className="mt-6 text-xl font-bold text-[var(--text-primary)]">
                  Connect efficiency to climate
                </h3>
                <p className="mt-2.5 text-base leading-relaxed text-[var(--text-secondary)]">
                  Turn measured energy changes into an estimated emissions impact using a grid factor
                  your team can verify and update.
                </p>
              </div>

              <div className="mt-6 border-t border-[var(--border)] pt-4 font-mono text-sm font-medium text-amber-500 flex items-center gap-2">
                <span className="text-amber-500 font-bold">↗</span>
                Transparent, configurable estimates
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* 3. Section #how-it-works: Hardware in the Field (Interactive Showcase + Annotated Frame) */}
      <section id="how-it-works" className="border-t border-[var(--border)] bg-[var(--surface)]/40 px-6 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-[1280px]">
          <div className="max-w-2xl">
            <p className="font-mono text-xs font-semibold uppercase tracking-wider text-amber-500">
              HARDWARE DEPLOYMENT
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl">
              Physical Hardware in the Field
            </h2>
            <p className="mt-4 text-base sm:text-lg leading-relaxed text-[var(--text-secondary)]">
              Non-invasive clamp sensing, infrared remote capture, and local mesh relay engineered
              for clean industrial installation into existing electrical panels.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12">
            {/* Left Column (6 cols) — Product Photo & Annotated Hardware Callout Frame */}
            <div className="lg:col-span-6 flex flex-col justify-between min-h-[460px] rounded-2xl border-2 border-amber-500/30 bg-[#151613] p-6 text-stone-100 relative overflow-hidden shadow-2xl">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-800 pb-3">
                  <div>
                    <span className="font-mono text-xs uppercase tracking-wider text-amber-400">
                      SENTRIX-HW-KIT-V2 · FIELD ASSEMBLY
                    </span>
                    <p className="mt-0.5 font-mono text-[11px] text-stone-400">
                      Non-invasive edge node prototype
                    </p>
                  </div>
                  <div className="flex items-center gap-1 rounded-lg border border-stone-800 bg-[#0d0e0c] p-1 font-mono text-xs">
                    <button
                      type="button"
                      onClick={() => setHardwareView("photo")}
                      className={`rounded px-2.5 py-1 font-medium transition ${
                        hardwareView === "photo"
                          ? "bg-amber-500 text-[#17140d] font-semibold shadow-sm"
                          : "text-stone-400 hover:text-stone-200"
                      }`}
                    >
                      📷 Hardware Photo
                    </button>
                    <button
                      type="button"
                      onClick={() => setHardwareView("schematic")}
                      className={`rounded px-2.5 py-1 font-medium transition ${
                        hardwareView === "schematic"
                          ? "bg-amber-500 text-[#17140d] font-semibold shadow-sm"
                          : "text-stone-400 hover:text-stone-200"
                      }`}
                    >
                      ⚡ Schematic
                    </button>
                  </div>
                </div>

                {/* Hardware Photo / Technical Schematic Container */}
                {hardwareView === "photo" ? (
                  <div className="relative mt-5 overflow-hidden rounded-xl border border-stone-800 bg-[#0d0e0c] group">
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-black/60 sm:aspect-[16/9]">
                      <img
                        src="/images/esp32-sensor-prototype.jpg"
                        alt="Sentrix ESP32 IoT Sensor Node Prototype"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0d0e0c] via-transparent to-black/40 pointer-events-none" />

                      {/* Top Status Badges */}
                      <div className="absolute top-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-black/70 px-2.5 py-1 font-mono text-[10px] font-semibold text-emerald-400 backdrop-blur-md">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
                          Lab Prototype Node
                        </span>
                        <span className="rounded-full border border-amber-500/30 bg-black/70 px-2.5 py-1 font-mono text-[10px] text-amber-300 backdrop-blur-md">
                          ESP32 + IR + SCT-013 Jack
                        </span>
                      </div>

                      {/* Bottom Annotations Bar */}
                      <div className="absolute bottom-3 inset-x-3 rounded-lg border border-white/10 bg-[#161813]/90 p-2.5 backdrop-blur-md">
                        <div className="flex items-center justify-between font-mono text-xs">
                          <span className="text-stone-200 font-medium">
                            Sentrix Edge Node Assembly
                          </span>
                          <span className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider">
                            ESP-WROOM-32
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative mt-5 flex min-h-[260px] items-center justify-center rounded-xl border border-stone-800 bg-[#0d0e0c] p-4">
                    <svg viewBox="0 0 540 250" className="h-full w-full" fill="none">
                      {/* Grid background lines */}
                      <defs>
                        <pattern id="schematicGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#252720" strokeWidth="0.5" />
                        </pattern>
                      </defs>
                      <rect width="540" height="250" fill="url(#schematicGrid)" />

                      {/* MCB Breaker Box */}
                      <rect x="25" y="30" width="80" height="150" rx="6" fill="#1d201a" stroke="#484a40" strokeWidth="2" />
                      <rect x="40" y="50" width="50" height="40" rx="3" fill="#2b2e25" />
                      <text x="65" y="75" fill="#f59e0b" fontSize="11" fontFamily="monospace" textAnchor="middle" fontWeight="bold">MCB 32A</text>
                      <circle cx="65" cy="115" r="7" fill="#ef4444" />
                      <text x="65" y="145" fill="#a1a198" fontSize="9" fontFamily="monospace" textAnchor="middle">LIVE FEED</text>

                      {/* Live Wire Running Out */}
                      <path d="M 65 180 L 65 220 L 220 220 L 220 80" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />

                      {/* SCT-013 Split-Core Current Transformer clamped on wire */}
                      <rect x="185" y="120" width="70" height="70" rx="10" fill="#20221c" stroke="#f59e0b" strokeWidth="2.5" />
                      <circle cx="220" cy="155" r="16" fill="#11120f" stroke="#484a40" strokeWidth="2" />
                      <text x="220" y="159" fill="#f59e0b" fontSize="10" fontFamily="monospace" textAnchor="middle" fontWeight="bold">SCT-013</text>
                      <rect x="175" y="145" width="10" height="20" rx="2" fill="#f59e0b" />

                      {/* 3.5mm Signal Cable */}
                      <path d="M 255 155 C 290 155, 300 120, 325 120" stroke="#a1a198" strokeWidth="2" strokeDasharray="3 3" />

                      {/* ESP32 Core Controller PCB */}
                      <rect x="325" y="40" width="185" height="155" rx="8" fill="#191c15" stroke="#10b981" strokeWidth="2" />
                      <text x="417" y="65" fill="#10b981" fontSize="12" fontFamily="monospace" textAnchor="middle" fontWeight="bold">ESP32 SENSOR NODE</text>

                      {/* Bias Conditioning Circuit on PCB */}
                      <rect x="345" y="80" width="70" height="45" rx="4" fill="#25291f" stroke="#383c30" />
                      <text x="380" y="100" fill="#d4d4cc" fontSize="9" fontFamily="monospace" textAnchor="middle">1.65V DC Bias</text>
                      <text x="380" y="115" fill="#f59e0b" fontSize="8" fontFamily="monospace" textAnchor="middle">Conditioning</text>

                      {/* Wi-Fi / BLE Antenna */}
                      <path d="M 475 75 L 495 75 L 495 110" stroke="#f59e0b" strokeWidth="2" />
                      <circle cx="495" cy="75" r="3" fill="#f59e0b" />
                      <text x="475" y="125" fill="#a1a198" fontSize="8" fontFamily="monospace">ESP-Mesh</text>

                      {/* IR Receiver Module */}
                      <rect x="345" y="140" width="145" height="40" rx="4" fill="#22261c" stroke="#484a40" />
                      <circle cx="365" cy="160" r="6" fill="#38bdf8" />
                      <text x="425" y="157" fill="#38bdf8" fontSize="9" fontFamily="monospace" fontWeight="bold">IR RECEIVER (38kHz)</text>
                      <text x="425" y="171" fill="#a1a198" fontSize="8" fontFamily="monospace">Decodes Remote Setpoint</text>
                    </svg>
                  </div>
                )}

                {/* 3 Numbered Hardware Callout Pills */}
                <div className="mt-5 space-y-2.5">
                  <div className="flex items-center gap-3 rounded-lg border border-stone-800 bg-[#1e201a] px-3.5 py-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-amber-500 font-mono text-xs font-bold text-[#17140d]">
                      01
                    </span>
                    <p className="font-mono text-sm text-stone-200">
                      SCT-013 Clamp <span className="text-stone-400 font-normal">(Up to 100A AC — Non-Invasive)</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3 rounded-lg border border-stone-800 bg-[#1e201a] px-3.5 py-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-amber-500 font-mono text-xs font-bold text-[#17140d]">
                      02
                    </span>
                    <p className="font-mono text-sm text-stone-200">
                      Infrared (IR) Receiver <span className="text-stone-400 font-normal">(Captures AC Remote Setpoint °C)</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3 rounded-lg border border-stone-800 bg-[#1e201a] px-3.5 py-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-amber-500 font-mono text-xs font-bold text-[#17140d]">
                      03
                    </span>
                    <p className="font-mono text-sm text-stone-200">
                      ESP32 Mesh Node <span className="text-stone-400 font-normal">(NimBLE Onboarding + Local Wi-Fi Relay)</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column (6 cols) — Vertical Connected Stepper With Visual Status Pills */}
            <div className="lg:col-span-6 flex flex-col justify-between py-2">
              <div className="relative border-l-4 border-amber-500/30 pl-6 sm:pl-8 space-y-8">
                {/* Step 01 */}
                <div className="relative group rounded-xl border border-transparent p-3 hover:border-[var(--border)] hover:bg-[var(--surface)] transition">
                  <div className="absolute -left-[35px] sm:-left-[43px] top-4 flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 font-mono text-xs font-bold text-[#17140d] ring-4 ring-[var(--canvas)]">
                    01
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-lg font-bold text-[var(--text-primary)]">
                      Snap Clamp onto AC Breaker Wire
                    </h3>
                    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-amber-500">
                      &lt; 2 Mins
                    </span>
                  </div>
                  <p className="mt-2 text-base leading-relaxed text-[var(--text-secondary)]">
                    Clamp the SCT-013 split-core sensor around the single live MCB wire.
                    Zero wire cutting, zero rewiring, and zero electrical panel shutdown required.
                  </p>
                </div>

                {/* Step 02 */}
                <div className="relative group rounded-xl border border-transparent p-3 hover:border-[var(--border)] hover:bg-[var(--surface)] transition">
                  <div className="absolute -left-[35px] sm:-left-[43px] top-4 flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 font-mono text-xs font-bold text-[#17140d] ring-4 ring-[var(--canvas)]">
                    02
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-lg font-bold text-[var(--text-primary)]">
                      Pair via Phone Bluetooth (BLE)
                    </h3>
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-emerald-500">
                      One-Time Setup
                    </span>
                  </div>
                  <p className="mt-2 text-base leading-relaxed text-[var(--text-secondary)]">
                    Open the Sentrix onboarding tool, scan the node&apos;s Bluetooth MAC sticker,
                    enter the secure 6-digit pairing PIN, and push local Wi-Fi credentials.
                  </p>
                </div>

                {/* Step 03 */}
                <div className="relative group rounded-xl border border-transparent p-3 hover:border-[var(--border)] hover:bg-[var(--surface)] transition">
                  <div className="absolute -left-[35px] sm:-left-[43px] top-4 flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 font-mono text-xs font-bold text-[#17140d] ring-4 ring-[var(--canvas)]">
                    03
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-lg font-bold text-[var(--text-primary)]">
                      7-Day Silent Baseline Calibration
                    </h3>
                    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-amber-500">
                      168 Hours
                    </span>
                  </div>
                  <p className="mt-2 text-base leading-relaxed text-[var(--text-secondary)]">
                    For 168 hours, Sentrix continuously records 1-minute RMS current alongside target AC
                    temperatures, automatically fitting an hourly Auto-ARIMA diurnal profile.
                  </p>
                </div>

                {/* Step 04 */}
                <div className="relative group rounded-xl border border-transparent p-3 hover:border-[var(--border)] hover:bg-[var(--surface)] transition">
                  <div className="absolute -left-[35px] sm:-left-[43px] top-4 flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 font-mono text-xs font-bold text-[#17140d] ring-4 ring-[var(--canvas)]">
                    04
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-lg font-bold text-[var(--text-primary)]">
                      Live Safe-Zone Anomaly Alerts
                    </h3>
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-emerald-500">
                      24/7 Protection
                    </span>
                  </div>
                  <p className="mt-2 text-base leading-relaxed text-[var(--text-secondary)]">
                    Receive immediate dashboard warnings and push alerts the moment dirty filters,
                    coil icing, or failing compressor motor windings drive current above safe bounds.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Section #live-panel: Interactive AC Fault Simulator */}
      <section id="live-panel" className="border-t border-[var(--border)] px-6 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-[1280px]">
          <div className="max-w-2xl">
            <p className="font-mono text-xs font-semibold uppercase tracking-wider text-amber-500">
              ELECTRICAL FAULT DIAGNOSTICS
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl">
              Commercial AC Failure Signatures
            </h2>
            <p className="mt-4 text-base sm:text-lg leading-relaxed text-[var(--text-secondary)]">
              Comparison of conventional delayed facility maintenance versus automated, continuous
              Sentrix electrical anomaly detection.
            </p>
          </div>

          {/* 3 Scenario Buttons */}
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                setActiveScenario("filter");
                setOperatorFeedback(null);
              }}
              className={`rounded-xl border px-4 py-3 text-base font-semibold transition ${
                activeScenario === "filter"
                  ? "border-amber-500 bg-amber-500/15 text-amber-500 shadow-sm"
                  : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
              }`}
            >
              Scenario A: Clogged AC Air Filter (+18% Current Drift)
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveScenario("leak");
                setOperatorFeedback(null);
              }}
              className={`rounded-xl border px-4 py-3 text-base font-semibold transition ${
                activeScenario === "leak"
                  ? "border-amber-500 bg-amber-500/15 text-amber-500 shadow-sm"
                  : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
              }`}
            >
              Scenario B: Refrigerant Leak / Icing (+32% Compressor Overload)
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveScenario("after_hours");
                setOperatorFeedback(null);
              }}
              className={`rounded-xl border px-4 py-3 text-base font-semibold transition ${
                activeScenario === "after_hours"
                  ? "border-amber-500 bg-amber-500/15 text-amber-500 shadow-sm"
                  : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
              }`}
            >
              Scenario C: After-Hours Forgotten AC (24/7 Idle Waste)
            </button>
          </div>

          {/* Dynamic 2-Column Visual Board */}
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left Side (5 cols) — Traditional Facility Response */}
            <div className="lg:col-span-5 rounded-2xl border border-red-500/30 bg-red-500/[0.04] p-6 sm:p-7 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 border-b border-red-500/20 pb-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded bg-red-500 text-white font-mono text-xs font-bold">
                    ✕
                  </span>
                  <h3 className="text-lg font-bold text-red-500">
                    Without Sentrix (Reactive Maintenance)
                  </h3>
                </div>

                <div className="mt-5 space-y-4">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">
                      Time to Discovery
                    </p>
                    <p className="mt-1 font-mono text-2xl font-bold text-[var(--text-primary)]">
                      {activeScenario === "filter" && "3 to 6 Weeks"}
                      {activeScenario === "leak" && "2 to 4 Weeks"}
                      {activeScenario === "after_hours" && "Months (Undetected)"}
                    </p>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                      {activeScenario === "filter" && "Noticeable only after room air turns stuffy and tenants call facility management."}
                      {activeScenario === "leak" && "Discovered after compressor motor locks up permanently or trips main panel breaker."}
                      {activeScenario === "after_hours" && "Invisible on utility bills because entire facility power is lumped together."}
                    </p>
                  </div>

                  <div className="border-t border-red-500/15 pt-3">
                    <p className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">
                      Wasted Electricity &amp; Wear
                    </p>
                    <p className="mt-1 font-mono text-xl font-bold text-red-400">
                      {activeScenario === "filter" && "+120 kWh / month excess draw"}
                      {activeScenario === "leak" && "+240 kWh / month continuous strain"}
                      {activeScenario === "after_hours" && "+180 kWh / month empty room waste"}
                    </p>
                  </div>

                  <div className="border-t border-red-500/15 pt-3">
                    <p className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">
                      Financial &amp; Equipment Damage
                    </p>
                    <p className="mt-1 text-base text-[var(--text-secondary)]">
                      {activeScenario === "filter" && "High static backpressure chokes blower motor, doubling fan replacement cycle."}
                      {activeScenario === "leak" && "Overheating compressor stator windings leads to catastrophic motor burnout ($3,000+)."}
                      {activeScenario === "after_hours" && "Premature lifespan exhaustion running 14 hours per day with nobody in the room."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
                Status: Manual quarterly inspection cycle misses continuous electrical drift.
              </div>
            </div>

            {/* Right Side (7 cols) — Sentrix Automated Detection */}
            <div className="lg:col-span-7 rounded-2xl border border-amber-500/40 bg-[var(--surface)] p-6 sm:p-7 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded bg-amber-500 font-mono text-xs font-bold text-[#17140d]">
                      ✓
                    </span>
                    <h3 className="text-lg font-bold text-[var(--text-primary)]">
                      Sentrix Predictive Triage Readout
                    </h3>
                  </div>
                  <span className="font-mono text-xs text-amber-500 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded">
                    SCT-013 AUTO-DETECTED
                  </span>
                </div>

                {/* Live Diagnostic Metrics */}
                <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="rounded-lg border border-[var(--border)] bg-[var(--canvas)] p-3">
                    <p className="font-mono text-xs uppercase text-[var(--text-muted)]">Live RMS Current</p>
                    <p className="mt-1 font-mono text-2xl font-bold text-red-500">
                      {activeScenario === "filter" && "16.2 A"}
                      {activeScenario === "leak" && "19.8 A"}
                      {activeScenario === "after_hours" && "8.9 A (02:30 AM)"}
                    </p>
                  </div>

                  <div className="rounded-lg border border-[var(--border)] bg-[var(--canvas)] p-3">
                    <p className="font-mono text-xs uppercase text-[var(--text-muted)]">ARIMA Baseline</p>
                    <p className="mt-1 font-mono text-xl font-bold text-emerald-500">
                      {activeScenario === "filter" && "11.5 - 13.7 A"}
                      {activeScenario === "leak" && "11.8 - 15.0 A"}
                      {activeScenario === "after_hours" && "0.0 - 0.5 A"}
                    </p>
                  </div>

                  <div className="rounded-lg border border-[var(--border)] bg-[var(--canvas)] p-3">
                    <p className="font-mono text-xs uppercase text-[var(--text-muted)]">Target AC Temp</p>
                    <p className="mt-1 font-mono text-xl font-bold text-[var(--text-primary)]">
                      {activeScenario === "filter" && "21°C"}
                      {activeScenario === "leak" && "18°C"}
                      {activeScenario === "after_hours" && "23°C (Unoccupied)"}
                    </p>
                  </div>

                  <div className="rounded-lg border border-[var(--border)] bg-[var(--canvas)] p-3">
                    <p className="font-mono text-xs uppercase text-[var(--text-muted)]">Monthly Savings</p>
                    <p className="mt-1 font-mono text-xl font-bold text-amber-500">
                      {activeScenario === "filter" && "$38.40 / mo"}
                      {activeScenario === "leak" && "$76.80 / mo"}
                      {activeScenario === "after_hours" && "$57.60 / mo"}
                    </p>
                  </div>
                </div>

                {/* Automated Root Cause Description */}
                <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/[0.06] p-4">
                  <p className="font-mono text-xs font-bold uppercase tracking-wider text-amber-500">
                    DIAGNOSTIC ADVISORY:
                  </p>
                  <p className="mt-1.5 text-base leading-relaxed text-[var(--text-primary)]">
                    {activeScenario === "filter" &&
                      "Airflow restriction detected: Current draw exceeded hourly upper bound (+18%) while duty cycle lengthened by 22 mins. Action: Clean or replace primary air intake filter."}
                    {activeScenario === "leak" &&
                      "Refrigerant undercharge signature: Compressor drawing continuous high amps (+32%) with zero room cooling delta. Action: Inspect expansion valve & check gas pressure immediately."}
                    {activeScenario === "after_hours" &&
                      "Off-schedule operation detected: Circuit active at 02:30 AM outside calibrated facility schedule. Action: Send remote turn-off signal or audit occupancy timer."}
                  </p>
                </div>
              </div>

              {/* Operator Action Buttons */}
              <div className="mt-6 border-t border-[var(--border)] pt-4 flex flex-wrap items-center justify-between gap-3">
                <span className="text-sm font-medium text-[var(--text-secondary)]">
                  Operator Triage Feedback:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setOperatorFeedback("Dispatched: Maintenance ticket created for facility crew.")}
                    className="rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-3.5 py-2 text-sm font-semibold text-emerald-500 hover:bg-emerald-500/25 transition"
                  >
                    ✓ Valid Issue (Dispatch)
                  </button>
                  <button
                    type="button"
                    onClick={() => setOperatorFeedback("Logged: Baseline adjusted for temporary heavy load.")}
                    className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition"
                  >
                    False Alarm (Re-Tune)
                  </button>
                </div>
              </div>

              {operatorFeedback && (
                <div className="mt-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-2.5 font-mono text-xs text-emerald-400">
                  {operatorFeedback}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 5. Section #specifications: Industrial Spec Sheet Table + Secondary Product Photo Slot */}
      <section id="specifications" className="border-t border-[var(--border)] bg-[var(--surface)]/40 px-6 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-[1280px]">
          <div className="max-w-2xl">
            <p className="font-mono text-xs font-semibold uppercase tracking-wider text-amber-500">
              TECHNICAL DATASHEET
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl">
              Industrial Hardware &amp; Field Installation
            </h2>
            <p className="mt-4 text-base sm:text-lg leading-relaxed text-[var(--text-secondary)]">
              Complete engineering specifications for the SCT-013 current conditioning stack,
              ESP-Mesh architecture, and Auto-ARIMA statistical bounds.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
            {/* Left Column (7 cols) — Striped Industrial Specification Table */}
            <div className="lg:col-span-7 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-lg">
              <table className="w-full text-left text-base border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--canvas)]">
                    <th className="py-4 px-5 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">
                      System Parameter
                    </th>
                    <th className="py-4 px-5 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">
                      Engineering Specification
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  <tr className="bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition">
                    <td className="py-3.5 px-5 font-medium text-[var(--text-primary)]">Current Sensor</td>
                    <td className="py-3.5 px-5 font-mono text-sm text-[var(--text-secondary)]">
                      SCT-013 Split-Core CT (0 - 100A AC, Non-Invasive)
                    </td>
                  </tr>
                  <tr className="bg-[var(--surface-hover)]/40 hover:bg-[var(--surface-hover)] transition">
                    <td className="py-3.5 px-5 font-medium text-[var(--text-primary)]">Edge Controller</td>
                    <td className="py-3.5 px-5 font-mono text-sm text-[var(--text-secondary)]">
                      ESP32 ADC + 1.65V DC Bias Conditioning + HLK-PM01 AC-DC
                    </td>
                  </tr>
                  <tr className="bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition">
                    <td className="py-3.5 px-5 font-medium text-[var(--text-primary)]">AC Setpoint Sensor</td>
                    <td className="py-3.5 px-5 font-mono text-sm text-[var(--text-secondary)]">
                      Infrared (IR) Remote Code Interceptor (38kHz)
                    </td>
                  </tr>
                  <tr className="bg-[var(--surface-hover)]/40 hover:bg-[var(--surface-hover)] transition">
                    <td className="py-3.5 px-5 font-medium text-[var(--text-primary)]">Local Networking</td>
                    <td className="py-3.5 px-5 font-mono text-sm text-[var(--text-secondary)]">
                      ESP-Mesh Auto-Root Election + Bluetooth LE Provisioning
                    </td>
                  </tr>
                  <tr className="bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition">
                    <td className="py-3.5 px-5 font-medium text-[var(--text-primary)]">Forecasting Engine</td>
                    <td className="py-3.5 px-5 font-mono text-sm text-[var(--text-secondary)]">
                      Auto-ARIMA (168-Hour Calibration, 24h Diurnal Seasonality)
                    </td>
                  </tr>
                  <tr className="bg-[var(--surface-hover)]/40 hover:bg-[var(--surface-hover)] transition">
                    <td className="py-3.5 px-5 font-medium text-[var(--text-primary)]">Sampling &amp; Alerts</td>
                    <td className="py-3.5 px-5 font-mono text-sm text-[var(--text-secondary)]">
                      1-Minute RMS Intervals · Web Push &amp; Dashboard Feed
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Right Column (5 cols) — MCB Field Installation Photo Card */}
            <div className="lg:col-span-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                  <h3 className="text-base font-bold text-[var(--text-primary)]">
                    MCB Breaker Installation Rule
                  </h3>
                  <span className="rounded bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 font-mono text-xs font-semibold text-emerald-500">
                    SINGLE WIRE ONLY
                  </span>
                </div>

                <div className="relative mt-4 flex min-h-[220px] items-center justify-center rounded-xl border border-[var(--border)] bg-[#11120f] p-4">
                  <svg viewBox="0 0 400 200" className="h-full w-full" fill="none">
                    {/* MCB Breaker Enclosure */}
                    <rect x="40" y="20" width="100" height="160" rx="4" fill="#1e221b" stroke="#3d4235" strokeWidth="2" />
                    <rect x="55" y="40" width="70" height="40" fill="#2d3329" rx="2" />
                    <text x="90" y="65" fill="#f59e0b" fontSize="11" fontFamily="monospace" textAnchor="middle" fontWeight="bold">MCB 40A</text>

                    {/* Neutral Wire (Bypassing clamp) */}
                    <path d="M 120 180 L 120 20" stroke="#38bdf8" strokeWidth="3" />
                    <text x="130" y="110" fill="#38bdf8" fontSize="9" fontFamily="monospace">NEUTRAL</text>

                    {/* Live Wire (Passing THROUGH clamp) */}
                    <path d="M 65 180 L 65 20" stroke="#f59e0b" strokeWidth="4" />
                    <text x="25" y="110" fill="#f59e0b" fontSize="9" fontFamily="monospace">LIVE</text>

                    {/* SCT-013 Clamp Enclosing Live Wire Only */}
                    <rect x="35" y="70" width="60" height="60" rx="8" fill="#20221c" stroke="#10b981" strokeWidth="2.5" />
                    <circle cx="65" cy="100" r="14" fill="#11120f" stroke="#484a40" strokeWidth="1.5" />
                    <circle cx="65" cy="100" r="4" fill="#f59e0b" />

                    {/* Green Checkmark Badge */}
                    <circle cx="100" cy="70" r="12" fill="#10b981" />
                    <path d="M 94 70 L 98 74 L 106 66" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />

                    {/* Explanatory callout */}
                    <rect x="180" y="50" width="190" height="95" rx="6" fill="#191d16" stroke="#343a2c" />
                    <text x="195" y="75" fill="#10b981" fontSize="11" fontFamily="monospace" fontWeight="bold">CRITICAL PRINCIPLE:</text>
                    <text x="195" y="95" fill="#e5e5dc" fontSize="10">Clamp around 1 wire</text>
                    <text x="195" y="110" fill="#e5e5dc" fontSize="10">(Live or Neutral),</text>
                    <text x="195" y="125" fill="#ef4444" fontSize="10" fontWeight="bold">never both together.</text>
                  </svg>
                </div>

                <div className="mt-4 rounded-lg bg-[var(--canvas)] p-3 border border-[var(--border)] text-sm">
                  <p className="font-semibold text-emerald-500">
                    Golden Rule of AC Current Sensing:
                  </p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)] leading-relaxed">
                    Always clamp around a single phase conductor (Live or Neutral). Clamping both conductors cancels out the magnetic flux, causing a zero current reading.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* High-Contrast Bottom Callout Bar */}
          <div className="mt-14 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 sm:p-10 flex flex-col lg:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="max-w-2xl text-center lg:text-left">
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">
                Ready to audit your facility AC circuits?
              </h3>
              <p className="mt-2 text-base sm:text-lg text-[var(--text-secondary)]">
                Deploy Sentrix non-invasive monitoring across your cooling panels in under 15 minutes.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/signup"
                className="inline-flex h-12 shrink-0 items-center justify-center rounded-xl bg-amber-500 px-6 text-base font-semibold text-[#17140d] shadow-md shadow-amber-500/20 transition hover:bg-amber-400"
              >
                Create Facility Workspace →
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex h-12 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--canvas)] px-6 text-base font-semibold text-[var(--text-primary)] transition hover:bg-[var(--surface-hover)]"
              >
                Open Live Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[var(--border)] bg-[var(--surface)] px-6 py-12 sm:px-8">
        <div className="mx-auto max-w-[1280px]">
          <div className="grid gap-10 sm:grid-cols-[1.5fr_1fr_1fr_1fr]">
            <div>
              <Brand />
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-[var(--text-secondary)]">
                Commercial AC electrical monitoring and predictive maintenance. Non-invasive clamp telemetry with automated 7-day ARIMA anomaly detection.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
                Architecture
              </h3>
              <ul className="mt-4 space-y-2.5">
                <li>
                  <a className="text-sm text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]" href="#overview">
                    Climate Overview
                  </a>
                </li>
                <li>
                  <a className="text-sm text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]" href="#how-it-works">
                    Hardware Deployment
                  </a>
                </li>
                <li>
                  <a className="text-sm text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]" href="#live-panel">
                    AC Fault Simulator
                  </a>
                </li>
                <li>
                  <a className="text-sm text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]" href="#specifications">
                    Technical Specifications
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
                Operations
              </h3>
              <ul className="mt-4 space-y-2.5">
                <li>
                  <Link className="text-sm text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]" href="/dashboard">
                    Live Panel Dashboard
                  </Link>
                </li>
                <li>
                  <Link className="text-sm text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]" href="/alerts">
                    Active Anomaly Alerts
                  </Link>
                </li>
                <li>
                  <Link className="text-sm text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]" href="/settings">
                    Facility Settings
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
                Account
              </h3>
              <ul className="mt-4 space-y-2.5">
                <li>
                  <Link className="text-sm text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]" href="/login">
                    Operator Sign In
                  </Link>
                </li>
                <li>
                  <Link className="text-sm font-semibold text-amber-500 transition hover:underline" href="/signup">
                    Create Facility Workspace
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-4 border-t border-[var(--border)] pt-6 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)] sm:flex-row sm:items-center sm:justify-between">
            <span className="flex items-center gap-2">
              <img
                src="/images/logo-text-dark.png"
                alt="Sentrix"
                className="h-4 w-auto object-contain logo-dark-theme"
              />
              <img
                src="/images/logo-text-light.png"
                alt="Sentrix"
                className="h-4 w-auto object-contain logo-light-theme"
              />
            </span>
            <span>© 2026 Sentrix. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
