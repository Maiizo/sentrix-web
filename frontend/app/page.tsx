"use client";

import { useState } from "react";
import Link from "next/link";
import { Brand } from "./components/brand";
import { ThemeToggle } from "./components/theme-toggle";

type FaultScenario = "filter" | "leak" | "after_hours";

interface FaultSignatureData {
  id: FaultScenario;
  badge: string;
  tabTitle: string;
  tabTag: string;
  tabSub: string;
  currentPower: string;
  currentPowerNote: string;
  normalPower: string;
  normalPowerNote: string;
  normalMin: number;
  normalMax: number;
  currentNum: number;
  maxScale: number;
  acTemp: string;
  acTempNote: string;
  monthlyWaste: string;
  monthlyWasteNote: string;
  gaugeStatus: string;
  alertTitle: string;
  alertExplanation: string;
  alertFix: string;
  actionButtonText: string;
  actionSuccessText: string;
  tradTime: string;
  tradTimeDetail: string;
  tradWaste: string;
  tradWasteDetail: string;
  tradRisk: string;
  tradRiskDetail: string;
  tradNote: string;
}

const FAULT_SIGNATURES: Record<FaultScenario, FaultSignatureData> = {
  filter: {
    id: "filter",
    badge: "Problem 1",
    tabTitle: "Dirty Air Filter",
    tabTag: "+18% Extra Electricity",
    tabSub: "Dust blocks airflow, forcing the AC motor to strain and pull extra power",
    currentPower: "16.2 Amps",
    currentPowerNote: "18% above normal",
    normalPower: "11.5 – 13.7 A",
    normalPowerNote: "Safe normal range",
    normalMin: 11.5,
    normalMax: 13.7,
    currentNum: 16.2,
    maxScale: 22,
    acTemp: "Set to 21°C",
    acTempNote: "Remote setting",
    monthlyWaste: "$38.40 / mo",
    monthlyWasteNote: "Avoidable electric waste",
    gaugeStatus: "Power is 18% above normal safe range",
    alertTitle: "DIRTY AIR FILTER DETECTED",
    alertExplanation:
      "Your AC is working 18% harder than normal because dust is choking the air filter. The motor is running hotter and pulling surplus electricity.",
    alertFix: "Clean or replace the air filter on Unit 01 to restore normal airflow and stop wasting power.",
    actionButtonText: "📩 Alert Maintenance to Clean Filter",
    actionSuccessText: "Work order sent to maintenance team to clean filter on AC Unit 01.",
    tradTime: "3 to 6 Weeks",
    tradTimeDetail: "You only find out when people complain the room feels hot and stuffy.",
    tradWaste: "+120 kWh ($38 / month)",
    tradWasteDetail: "Silently adds $38 to your electric bill every single month.",
    tradRisk: "Blower Motor Overheats",
    tradRiskDetail: "Running choked with dust cuts years off the fan motor's lifespan.",
    tradNote: "Manual quarterly checkups miss gradual dust buildup that costs you money week after week.",
  },
  leak: {
    id: "leak",
    badge: "Problem 2",
    tabTitle: "Gas / Refrigerant Leak",
    tabTag: "+32% Motor Overload",
    tabSub: "AC runs continuously at full blast without making the room cold",
    currentPower: "19.8 Amps",
    currentPowerNote: "+32% overloaded",
    normalPower: "11.8 – 15.0 A",
    normalPowerNote: "Safe normal range",
    normalMin: 11.8,
    normalMax: 15.0,
    currentNum: 19.8,
    maxScale: 25,
    acTemp: "Set to 18°C",
    acTempNote: "Dialed to max cold",
    monthlyWaste: "$76.80 / mo",
    monthlyWasteNote: "Avoidable electric waste",
    gaugeStatus: "Dangerous overload: motor drawing near-maximum power",
    alertTitle: "GAS / REFRIGERANT LEAK DETECTED",
    alertExplanation:
      "Refrigerant gas has leaked out. The AC compressor is running at maximum power continuously, but the room temperature is not dropping.",
    alertFix: "Schedule a technician to find the gas leak and refill refrigerant before the $3,000+ compressor motor burns out.",
    actionButtonText: "🚨 Call HVAC Technician Urgently",
    actionSuccessText: "Urgent repair ticket dispatched to Lead AC Technician for gas leak inspection.",
    tradTime: "2 to 4 Weeks",
    tradTimeDetail: "Usually discovered only after the AC completely stops working or trips the breaker.",
    tradWaste: "+240 kWh ($76 / month)",
    tradWasteDetail: "Compressor runs 24/7 trying to reach a cold temperature it can't achieve.",
    tradRisk: "Compressor Burnout ($3,000+)",
    tradRiskDetail: "Without refrigerant vapor to cool the motor, the compressor burns out permanently.",
    tradNote: "Without continuous sensor monitoring, gas leaks are rarely caught until the entire cooling system breaks down.",
  },
  after_hours: {
    id: "after_hours",
    badge: "Problem 3",
    tabTitle: "AC Left On Overnight",
    tabTag: "Empty Room Waste",
    tabSub: "Cooling an empty conference room for 14 hours every single night",
    currentPower: "8.9 Amps",
    currentPowerNote: "Running at 02:30 AM",
    normalPower: "0.0 Amps",
    normalPowerNote: "Off after 7:00 PM",
    normalMin: 0.0,
    normalMax: 0.5,
    currentNum: 8.9,
    maxScale: 12,
    acTemp: "Set to 23°C",
    acTempNote: "Room is empty",
    monthlyWaste: "$57.60 / mo",
    monthlyWasteNote: "Avoidable electric waste",
    gaugeStatus: "Off-schedule: AC running in the middle of the night",
    alertTitle: "FORGOTTEN AC LEFT ON DETECTED",
    alertExplanation:
      "The AC was left running at 02:30 AM in an empty conference room outside regular operating hours.",
    alertFix: "Turn off the AC remotely or set an automatic evening shut-off rule to stop cooling empty spaces.",
    actionButtonText: "⚡ Turn Off AC Remotely",
    actionSuccessText: "Remote shutoff command sent! AC Unit 01 turned off for the night.",
    tradTime: "Months (Often Never)",
    tradTimeDetail: "Invisible because total building power is lumped together on a single utility bill.",
    tradWaste: "+180 kWh ($57 / month)",
    tradWasteDetail: "Wastes over $680 every year cooling empty air while everyone is asleep at home.",
    tradRisk: "4,200 Extra Wear Hours / Year",
    tradRiskDetail: "Puts unnecessary operating hours on the AC, causing it to fail years ahead of schedule.",
    tradNote: "Nighttime security guards and cleaning staff rarely check individual AC remotes in private rooms.",
  },
};

export default function Home() {
  const [activeScenario, setActiveScenario] = useState<FaultScenario>("filter");
  const [operatorFeedback, setOperatorFeedback] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <main className="min-h-screen bg-[var(--canvas)] font-sans text-[var(--text-primary)] transition-colors duration-200">
      {/* 1. Sticky Top Header (Larger & Clearer with Mobile & Tablet Hamburger) */}
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--canvas)]/90 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-[1280px] items-center justify-between px-4 sm:px-8">
          <div className="shrink-0">
            <Brand />
          </div>

          <nav className="hidden items-center gap-6 xl:gap-8 text-sm xl:text-base font-medium text-[var(--text-secondary)] lg:flex">
            <a className="whitespace-nowrap transition hover:text-[var(--text-primary)]" href="#overview">
              Overview
            </a>
            <a className="whitespace-nowrap transition hover:text-[var(--text-primary)]" href="#how-it-works">
              How It Works
            </a>
            <a className="whitespace-nowrap transition hover:text-[var(--text-primary)]" href="#live-panel">
              AC Panel Monitor
            </a>
            <a className="whitespace-nowrap transition hover:text-[var(--text-primary)]" href="#specifications">
              System Specs
            </a>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden items-center gap-3 xl:gap-4 lg:flex shrink-0">
            <ThemeToggle showLabel={false} />
            <Link
              href="/login"
              className="whitespace-nowrap rounded-lg px-3.5 xl:px-4 py-2.5 text-sm xl:text-base font-medium text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
            >
              Log in
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex h-11 items-center justify-center whitespace-nowrap rounded-lg bg-amber-500 px-4 xl:px-5 text-sm xl:text-base font-semibold text-[#17140d] transition hover:bg-amber-400"
            >
              Open Dashboard
            </Link>
          </div>

          {/* Mobile & Tablet Actions: ThemeToggle + Hamburger Button (< lg) */}
          <div className="flex items-center gap-2 lg:hidden">
            <ThemeToggle showLabel={false} />
            <button
              type="button"
              id="mobile-nav-toggle"
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] transition hover:bg-[var(--surface-hover)] focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="4" y1="6" x2="20" y2="6" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="18" x2="20" y2="18" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile & Tablet Dropdown Drawer Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-[var(--border)] bg-[var(--canvas)]/98 px-5 sm:px-8 py-5 shadow-2xl backdrop-blur-xl lg:hidden animate-in slide-in-from-top-2 duration-200">
            <nav className="mx-auto max-w-lg flex flex-col space-y-1">
              <a
                href="#overview"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3.5 py-2.5 text-base font-medium text-[var(--text-primary)] hover:bg-[var(--surface-hover)] hover:text-amber-500 transition"
              >
                Overview
              </a>
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3.5 py-2.5 text-base font-medium text-[var(--text-primary)] hover:bg-[var(--surface-hover)] hover:text-amber-500 transition"
              >
                How It Works
              </a>
              <a
                href="#live-panel"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3.5 py-2.5 text-base font-medium text-[var(--text-primary)] hover:bg-[var(--surface-hover)] hover:text-amber-500 transition"
              >
                AC Panel Monitor
              </a>
              <a
                href="#specifications"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3.5 py-2.5 text-base font-medium text-[var(--text-primary)] hover:bg-[var(--surface-hover)] hover:text-amber-500 transition"
              >
                System Specs
              </a>
              <div className="my-2 border-t border-[var(--border)] pt-3 flex flex-col sm:flex-row gap-2.5">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex h-11 flex-1 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition"
                >
                  Log In
                </Link>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex h-11 flex-1 items-center justify-center rounded-lg bg-amber-500 text-sm font-semibold text-[#17140d] hover:bg-amber-400 transition"
                >
                  Open Dashboard
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* 2. Split Asymmetric Industrial Hero */}
      <section className="px-4 pt-10 pb-14 sm:px-8 sm:pt-16 sm:pb-24">
        <div className="mx-auto max-w-[1280px]">
          <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
            {/* Left Column (7 cols) */}
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 font-mono text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-amber-500 max-w-full text-center sm:text-left leading-normal">
                COMMERCIAL AC CIRCUIT MONITORING · SCT-013 + AUTO-ARIMA
              </div>

              <h1 className="mt-5 text-3xl font-bold tracking-tight leading-[1.12] text-[var(--text-primary)] sm:text-5xl lg:text-6xl break-words">
                Catch AC Compressor &amp; Cooling Faults Before the Breaker Trips.
              </h1>

              <p className="mt-5 max-w-2xl text-base sm:text-xl leading-relaxed text-[var(--text-secondary)]">
                Clamp our non-invasive current sensor onto your AC distribution panel.
                Sentrix learns each unit&apos;s normal 7-day electrical rhythm in Amps and alerts your
                maintenance team the moment power draw drifts outside safe bounds.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Link
                  href="/signup"
                  className="inline-flex h-12 w-full sm:w-auto items-center justify-center rounded-xl bg-amber-500 px-6 text-base font-semibold text-[#17140d] shadow-md shadow-amber-500/20 transition hover:bg-amber-400 text-center"
                >
                  Start Monitoring Your AC Fleet →
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex h-12 w-full sm:w-auto items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] px-6 text-base font-semibold text-[var(--text-primary)] transition hover:bg-[var(--surface-hover)] text-center"
                >
                  See How It Works
                </a>
              </div>

              {/* 3 Quick Operational Facts Strip */}
              <div className="mt-10 grid grid-cols-3 gap-2 sm:gap-4 border-t border-[var(--border)] pt-6">
                <div>
                  <p className="font-mono text-2xl sm:text-4xl lg:text-5xl font-bold text-amber-500">1-Min</p>
                  <p className="mt-1 text-xs sm:text-sm font-medium text-[var(--text-secondary)]">
                    RMS Current Sampling
                  </p>
                </div>
                <div>
                  <p className="font-mono text-2xl sm:text-4xl lg:text-5xl font-bold text-[var(--text-primary)]">7-Day</p>
                  <p className="mt-1 text-xs sm:text-sm font-medium text-[var(--text-secondary)]">
                    Baseline Calibration
                  </p>
                </div>
                <div>
                  <p className="font-mono text-2xl sm:text-4xl lg:text-5xl font-bold text-emerald-500">0</p>
                  <p className="mt-1 text-xs sm:text-sm font-medium text-[var(--text-secondary)]">
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
                      <div className="absolute top-2 right-2 sm:right-12 rounded bg-red-500 px-2 py-0.5 text-[10px] sm:text-xs font-mono font-bold text-white shadow-sm">
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
            <div className="lg:col-span-6 flex flex-col justify-between min-h-[460px] rounded-2xl border-2 border-amber-500/30 bg-[#151613] p-4 sm:p-6 text-stone-100 relative overflow-hidden shadow-2xl">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs uppercase tracking-wider text-amber-400 font-bold">
                        SENTRIX KIT
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-400">
                      
                        Prototype
                      </span>
                    </div>
                    <p className="mt-0.5 font-mono text-[11px] text-stone-400">
                      Non-invasive edge node hardware
                    </p>
                  </div>
                </div>

                {/* Hardware Photo Container */}
                <div className="mt-4">
                  <div className="relative overflow-hidden rounded-xl border border-stone-800 bg-[#0d0e0c] group aspect-[4/3] sm:aspect-[16/9] w-full min-h-[220px]">
                    <img
                      src="/images/esp32-sensor-prototype.jpeg"
                      alt="Sentrix ESP32 IoT Sensor Node Prototype"
                      onError={(e) => {
                        e.currentTarget.src = "/images/esp32-sensor-prototype.jpg";
                      }}
                      className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none" />

                    {/* Top-right subtle badge */}
                    <div className="absolute top-2.5 right-2.5 pointer-events-none">
                      <span className="rounded-full border border-amber-500/30 bg-black/75 px-2.5 py-1 font-mono text-[10px] text-amber-300 backdrop-blur-md">
                        ESP32 + IR + SCT-013
                      </span>
                    </div>
                  </div>

                  {/* Technical Spec Caption under photo (outside image to avoid obscuring hardware on mobile) */}
                  <div className="mt-2.5 flex items-center justify-between gap-2 px-1 font-mono text-xs">
                    <span className="text-stone-300 font-medium truncate">
                      Sentrix Edge Node Assembly
                    </span>
                    <span className="shrink-0 rounded bg-stone-800/80 px-2 py-0.5 text-[10px] sm:text-xs text-amber-400 font-semibold uppercase tracking-wider">
                      ESP-WROOM-32
                    </span>
                  </div>
                </div>

                {/* 3 Numbered Hardware Callout Pills */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-3 rounded-lg border border-stone-800 bg-[#1e201a] px-3.5 py-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-amber-500 font-mono text-xs font-bold text-[#17140d]">
                      01
                    </span>
                    <p className="font-mono text-xs sm:text-sm text-stone-200">
                      SCT-013 Clamp <span className="text-stone-400 font-normal">(Up to 100A AC — Non-Invasive)</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3 rounded-lg border border-stone-800 bg-[#1e201a] px-3.5 py-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-amber-500 font-mono text-xs font-bold text-[#17140d]">
                      02
                    </span>
                    <p className="font-mono text-xs sm:text-sm text-stone-200">
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
              <div className="relative space-y-6 sm:space-y-8">
                {/* Vertical connecting line - mathematically centered through the middle of the dots */}
                <div
                  aria-hidden="true"
                  className="absolute left-[28px] top-7 bottom-7 w-1 -translate-x-1/2 bg-amber-500/40 rounded-full"
                />

                {/* Step 01 */}
                <div className="relative flex items-start gap-4 sm:gap-5 group rounded-xl border border-transparent p-3 hover:border-[var(--border)] hover:bg-[var(--surface)] transition">
                  <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500 font-mono text-xs font-bold text-[#17140d] ring-4 ring-[var(--canvas)] shadow-md">
                    01
                  </div>
                  <div className="flex-1 min-w-0">
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
                </div>

                {/* Step 02 */}
                <div className="relative flex items-start gap-4 sm:gap-5 group rounded-xl border border-transparent p-3 hover:border-[var(--border)] hover:bg-[var(--surface)] transition">
                  <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500 font-mono text-xs font-bold text-[#17140d] ring-4 ring-[var(--canvas)] shadow-md">
                    02
                  </div>
                  <div className="flex-1 min-w-0">
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
                </div>

                {/* Step 03 */}
                <div className="relative flex items-start gap-4 sm:gap-5 group rounded-xl border border-transparent p-3 hover:border-[var(--border)] hover:bg-[var(--surface)] transition">
                  <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500 font-mono text-xs font-bold text-[#17140d] ring-4 ring-[var(--canvas)] shadow-md">
                    03
                  </div>
                  <div className="flex-1 min-w-0">
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
                </div>

                {/* Step 04 */}
                <div className="relative flex items-start gap-4 sm:gap-5 group rounded-xl border border-transparent p-3 hover:border-[var(--border)] hover:bg-[var(--surface)] transition">
                  <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500 font-mono text-xs font-bold text-[#17140d] ring-4 ring-[var(--canvas)] shadow-md">
                    04
                  </div>
                  <div className="flex-1 min-w-0">
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
        </div>
      </section>

      {/* 4. Section #live-panel: Real-Time Problem Detection Demo */}
      <section id="live-panel" className="border-t border-[var(--border)] px-5 sm:px-8 py-16 sm:py-24">
        <div className="mx-auto max-w-[1280px]">
          {/* Section Header (Plain English) */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                <p className="font-mono text-xs font-semibold uppercase tracking-wider text-amber-500">
                  REAL-TIME DETECTION IN ACTION
                </p>
              </div>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-[var(--text-primary)] sm:text-4xl">
                Common AC Problems Sentrix Catches Early
              </h2>
              <p className="mt-3 text-base sm:text-lg leading-relaxed text-[var(--text-secondary)]">
                See how Sentrix spots hidden AC faults in minutes—saving electricity and preventing costly repairs before your room gets hot or equipment breaks down.
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-2 font-mono text-xs text-[var(--text-muted)]">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>Interactive Demo · Click a problem to test</span>
            </div>
          </div>

          {/* 3 Interactive Problem Tabs */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {(["filter", "leak", "after_hours"] as const).map((key) => {
              const item = FAULT_SIGNATURES[key];
              const isSelected = activeScenario === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setActiveScenario(key);
                    setOperatorFeedback(null);
                  }}
                  className={`group relative flex flex-col justify-between text-left rounded-xl border p-4 transition-all duration-200 ${
                    isSelected
                      ? "border-amber-500/80 bg-[var(--surface-hover)] shadow-md shadow-amber-500/5 ring-1 ring-amber-500/30"
                      : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:border-stone-600 hover:bg-[var(--surface-hover)]/70 hover:text-[var(--text-primary)]"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`font-mono text-[11px] font-semibold tracking-wider ${
                          isSelected ? "text-amber-500" : "text-[var(--text-muted)] group-hover:text-stone-300"
                        }`}
                      >
                        {item.badge}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-medium transition ${
                          isSelected
                            ? "bg-amber-500/15 text-amber-500 border border-amber-500/30 font-semibold"
                            : "bg-[var(--canvas)] text-[var(--text-muted)] border border-[var(--border)]"
                        }`}
                      >
                        {item.tabTag}
                      </span>
                    </div>

                    <h3
                      className={`mt-2 text-base font-bold transition ${
                        isSelected ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]"
                      }`}
                    >
                      {item.tabTitle}
                    </h3>
                    <p className="mt-1 text-xs text-[var(--text-secondary)] leading-relaxed">
                      {item.tabSub}
                    </p>
                  </div>

                  {/* Active bottom accent bar */}
                  {isSelected && (
                    <div className="absolute inset-x-4 -bottom-px h-0.5 bg-amber-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Dynamic 2-Column Comparison Workbench */}
          {(() => {
            const current = FAULT_SIGNATURES[activeScenario];
            const baselineLeftPct = Math.max(0, Math.min(100, (current.normalMin / current.maxScale) * 100));
            const baselineWidthPct = Math.max(
              0,
              Math.min(100 - baselineLeftPct, ((current.normalMax - current.normalMin) / current.maxScale) * 100)
            );
            const currentPct = Math.max(0, Math.min(100, (current.currentNum / current.maxScale) * 100));

            return (
              <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12 items-stretch">
                {/* Left Side (5 cols) — Without Sentrix (Waiting for Problems) */}
                <div className="lg:col-span-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-7 flex flex-col justify-between shadow-sm">
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                      <div>
                        <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
                          TRADITIONAL APPROACH
                        </span>
                        <h3 className="text-lg font-bold text-[var(--text-primary)]">
                          Without Sentrix Monitoring
                        </h3>
                      </div>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 font-mono text-[10px] font-medium text-rose-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                        No Early Warning
                      </span>
                    </div>

                    {/* 3 Plain-English Impact Points */}
                    <div className="mt-6 space-y-5">
                      <div>
                        <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
                          How Long Before You Notice?
                        </p>
                        <p className="mt-1 font-mono text-2xl font-bold text-[var(--text-primary)]">
                          {current.tradTime}
                        </p>
                        <p className="mt-1 text-sm text-[var(--text-secondary)] leading-relaxed">
                          {current.tradTimeDetail}
                        </p>
                      </div>

                      <div className="border-t border-[var(--border)] pt-4">
                        <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
                          Extra Electricity Wasted
                        </p>
                        <p className="mt-1 font-mono text-xl font-semibold text-amber-500 dark:text-amber-400">
                          {current.tradWaste}
                        </p>
                        <p className="mt-1 text-sm text-[var(--text-secondary)] leading-relaxed">
                          {current.tradWasteDetail}
                        </p>
                      </div>

                      <div className="border-t border-[var(--border)] pt-4">
                        <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
                          Breakdown Risk
                        </p>
                        <p className="mt-1 font-mono text-base font-semibold text-[var(--text-primary)]">
                          {current.tradRisk}
                        </p>
                        <p className="mt-1 text-sm text-[var(--text-secondary)] leading-relaxed">
                          {current.tradRiskDetail}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Audit observation callout */}
                  <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--canvas)] p-3.5 text-xs text-[var(--text-secondary)] leading-relaxed">
                    <span className="font-mono font-semibold text-[var(--text-muted)] mr-1.5">Takeaway:</span>
                    {current.tradNote}
                  </div>
                </div>

                {/* Right Side (7 cols) — With Sentrix (Smart 24/7 Protection) */}
                <div className="lg:col-span-7 rounded-2xl border border-amber-500/40 bg-[var(--surface)] p-6 sm:p-7 shadow-xl flex flex-col justify-between relative overflow-hidden">
                  <div>
                    {/* Console Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
                        </span>
                        <div>
                          <span className="font-mono text-[10px] uppercase tracking-wider text-amber-500 font-bold block">
                            SMART 24/7 PROTECTION
                          </span>
                          <h3 className="text-lg font-bold text-[var(--text-primary)] leading-tight">
                            With Sentrix Smart Alerts
                          </h3>
                        </div>
                      </div>
                      <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-[11px] font-semibold text-emerald-400">
                        ✓ Problem Detected in 1 Minute
                      </span>
                    </div>

                    {/* 4 Plain-Language Metric Cards */}
                    <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
                      {/* Cell 1: Current Power */}
                      <div className="flex flex-col justify-between rounded-xl border border-[var(--border)] bg-[var(--canvas)] p-3.5 min-h-[96px]">
                        <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
                          Current Power Draw
                        </p>
                        <div className="mt-1">
                          <p className="font-mono text-2xl font-bold text-amber-500 dark:text-amber-400 leading-tight">
                            {current.currentPower}
                          </p>
                          <span className="mt-0.5 block font-mono text-[10px] text-amber-500/90 font-medium leading-tight">
                            {current.currentPowerNote}
                          </span>
                        </div>
                      </div>

                      {/* Cell 2: Normal Power */}
                      <div className="flex flex-col justify-between rounded-xl border border-[var(--border)] bg-[var(--canvas)] p-3.5 min-h-[96px]">
                        <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
                          Normal Safe Power
                        </p>
                        <div className="mt-1">
                          <p className="font-mono text-xl font-bold text-[var(--text-primary)] leading-tight">
                            {current.normalPower}
                          </p>
                          <span className="mt-0.5 block font-mono text-[10px] text-[var(--text-muted)] leading-tight">
                            {current.normalPowerNote}
                          </span>
                        </div>
                      </div>

                      {/* Cell 3: AC Temperature */}
                      <div className="flex flex-col justify-between rounded-xl border border-[var(--border)] bg-[var(--canvas)] p-3.5 min-h-[96px]">
                        <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
                          AC Set Temp
                        </p>
                        <div className="mt-1">
                          <p className="font-mono text-xl font-bold text-[var(--text-primary)] leading-tight">
                            {current.acTemp}
                          </p>
                          <span className="mt-0.5 block font-mono text-[10px] text-[var(--text-muted)] leading-tight">
                            {current.acTempNote}
                          </span>
                        </div>
                      </div>

                      {/* Cell 4: Money Wasted */}
                      <div className="flex flex-col justify-between rounded-xl border border-[var(--border)] bg-[var(--canvas)] p-3.5 min-h-[96px]">
                        <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
                          Money Wasted
                        </p>
                        <div className="mt-1">
                          <p className="font-mono text-xl font-bold text-[var(--text-primary)] leading-tight">
                            {current.monthlyWaste}
                          </p>
                          <span className="mt-0.5 block font-mono text-[10px] text-amber-500/80 font-medium leading-tight">
                            {current.monthlyWasteNote}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Simple Power Usage Meter */}
                    <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--canvas)] p-3.5">
                      <div className="flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)] mb-2">
                        <span>LIVE POWER METER</span>
                        <span className="text-amber-500 font-semibold">
                          {current.gaugeStatus}
                        </span>
                      </div>
                      <div className="relative h-3 w-full rounded-full bg-[var(--surface)] overflow-hidden border border-[var(--border)]">
                        {/* Safe Zone */}
                        <div
                          className="absolute top-0 bottom-0 bg-emerald-500/20 border-x border-emerald-500/40"
                          style={{
                            left: `${baselineLeftPct}%`,
                            width: `${baselineWidthPct}%`,
                          }}
                          title={`Healthy Normal Power: ${current.normalPower}`}
                        />
                        {/* Current Usage Needle */}
                        <div
                          className="absolute top-0 bottom-0 w-2 bg-amber-500 shadow-[0_0_8px_#f59e0b] -translate-x-1/2 rounded-full"
                          style={{ left: `${currentPct}%` }}
                          title={`Current Power: ${current.currentPower}`}
                        />
                      </div>
                      <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)]">
                        <span>Low</span>
                        <span className="text-emerald-500/80 font-medium">
                          🟢 Safe Normal Zone ({current.normalPower})
                        </span>
                        <span className="text-amber-500 font-medium">▲ Current Draw ({current.currentPower})</span>
                      </div>
                    </div>

                    {/* Plain-English Smart Diagnosis Card */}
                    <div className="mt-4 rounded-xl border-l-2 border-amber-500 bg-[var(--canvas)] p-4 border-r border-t border-b border-[var(--border)]">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-amber-500">
                          ⚠️ {current.alertTitle}
                        </span>
                        <span className="font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                          Alert Sent to Phone
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                        {current.alertExplanation}
                      </p>
                      <div className="mt-2.5 flex items-start sm:items-center gap-2 pt-2 border-t border-[var(--border)]/70">
                        <span className="font-mono text-[11px] font-semibold text-amber-500 uppercase shrink-0">
                          Recommended Fix:
                        </span>
                        <span className="text-xs font-medium text-[var(--text-primary)]">
                          {current.alertFix}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* One-Click Action Console */}
                  <div className="mt-6 border-t border-[var(--border)] pt-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="font-mono text-xs font-medium text-[var(--text-secondary)]">
                        One-Click Fix:
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setOperatorFeedback("action")}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-2 text-xs font-semibold text-[#17140d] hover:bg-amber-400 shadow-sm transition"
                        >
                          <span>{current.actionButtonText}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setOperatorFeedback("dismiss")}
                          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>

                    {/* Confirmation Message */}
                    {operatorFeedback === "action" && (
                      <div className="mt-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 flex items-center justify-between gap-3 text-xs animate-in fade-in duration-200">
                        <div className="flex items-center gap-2 font-mono">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-emerald-500 text-[#17140d] font-bold text-[10px]">
                            ✓
                          </span>
                          <span className="font-semibold text-emerald-400">
                            {current.actionSuccessText}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setOperatorFeedback(null)}
                          className="font-mono text-[11px] text-emerald-400/80 hover:text-emerald-300 underline shrink-0"
                        >
                          Reset
                        </button>
                      </div>
                    )}

                    {operatorFeedback === "dismiss" && (
                      <div className="mt-3.5 rounded-xl border border-[var(--border)] bg-[var(--canvas)] p-3 flex items-center justify-between gap-3 text-xs animate-in fade-in duration-200">
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-[var(--text-muted)] text-[10px]">ℹ</span>
                          <span className="text-[var(--text-secondary)]">
                            Alert dismissed. Sentrix will continue monitoring circuit health.
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setOperatorFeedback(null)}
                          className="font-mono text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] underline shrink-0"
                        >
                          Reset
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
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
            <div className="lg:col-span-7 overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-lg">
              <table className="w-full min-w-[480px] text-left text-sm sm:text-base border-collapse">
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

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <Link
                href="/signup"
                className="inline-flex h-12 w-full sm:w-auto items-center justify-center rounded-xl bg-amber-500 px-6 text-base font-semibold text-[#17140d] shadow-md shadow-amber-500/20 transition hover:bg-amber-400 text-center"
              >
                Create Facility Workspace →
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex h-12 w-full sm:w-auto items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--canvas)] px-6 text-base font-semibold text-[var(--text-primary)] transition hover:bg-[var(--surface-hover)] text-center"
              >
                Open Live Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[var(--border)] bg-[var(--surface)] px-5 py-12 sm:px-8">
        <div className="mx-auto max-w-[1280px]">
          <div className="grid gap-10 grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
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
