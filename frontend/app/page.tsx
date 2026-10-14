import Link from "next/link";
import { Brand, BrandMark } from "./components/brand";

function PreviewChart() {
  return (
    <div className="relative h-full min-h-48 overflow-hidden rounded-xl border border-white/[0.07] bg-[#151614] p-4 sm:min-h-56 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-stone-500">
            AC energy draw
          </p>
          <p className="mt-1 text-xs text-stone-300">AC Unit 01 · Last 24 hours</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/[0.07] px-2 py-1 font-mono text-[9px] text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          SAMPLE
        </span>
      </div>
      <div className="relative h-[145px] sm:h-[178px]">
        <div className="absolute inset-0 flex flex-col justify-between">
          {[0, 1, 2, 3, 4].map((line) => (
            <div key={line} className="h-px w-full bg-white/[0.055]" />
          ))}
        </div>
        <div className="absolute inset-0 flex justify-between">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((line) => (
            <div key={line} className="h-full w-px bg-white/[0.035]" />
          ))}
        </div>
        <svg
          viewBox="0 0 720 180"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
          role="img"
          aria-label="Air conditioner energy use line chart"
        >
          <path
            d="M0 108 L35 98 L70 112 L105 92 L140 45 L175 82 L210 98 L245 102 L280 116 L315 125 L350 109 L385 95 L420 82 L455 65 L490 30 L525 5 L560 49 L595 81 L630 105 L665 117 L720 123 L720 180 L0 180Z"
            fill="url(#chartFill)"
          />
          <path
            d="M0 108 L35 98 L70 112 L105 92 L140 45 L175 82 L210 98 L245 102 L280 116 L315 125 L350 109 L385 95 L420 82 L455 65 L490 30 L525 5 L560 49 L595 81 L630 105 L665 117 L720 123"
            fill="none"
            stroke="#f5a623"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
          <defs>
            <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
              <stop stopColor="#f5a623" stopOpacity=".2" />
              <stop offset="1" stopColor="#f5a623" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div className="mt-3 flex justify-between font-mono text-[8px] text-stone-600">
        <span>00:00</span>
        <span>06:00</span>
        <span>12:00</span>
        <span>18:00</span>
        <span>NOW</span>
      </div>
    </div>
  );
}

function DashboardPreview() {
  return (
    <div className="relative mx-auto max-w-[950px]">
      <div className="absolute -inset-8 rounded-[40px] bg-amber-500/[0.08] blur-3xl" />
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.11] bg-[#171815] shadow-[0_35px_100px_-35px_rgba(0,0,0,.9)]">
        <div className="flex h-11 items-center gap-2 border-b border-white/[0.07] px-4">
          <span className="h-2 w-2 rounded-full bg-red-400/90" />
          <span className="h-2 w-2 rounded-full bg-amber-400/90" />
          <span className="h-2 w-2 rounded-full bg-emerald-400/90" />
          <div className="mx-auto hidden rounded border border-white/[0.07] px-3 py-1 font-mono text-[8px] tracking-widest text-stone-500 sm:block">
            SENTRIX-COOLING / AC_UNIT_01
          </div>
          <span className="ml-auto text-xs text-stone-500">•••</span>
        </div>
        <div className="grid gap-3 p-3 sm:grid-cols-[205px_minmax(0,1fr)] sm:p-4">
          <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-col">
            <div className="rounded-xl border border-white/[0.06] bg-[#1e1f1c] p-3 sm:flex-1 sm:p-4">
              <p className="font-mono text-[8px] uppercase tracking-widest text-stone-500">
                AC power draw
              </p>
              <div className="mt-2 font-mono text-2xl tracking-tight text-stone-100 sm:text-3xl">
                4.82<span className="ml-1 text-xs text-amber-500">kW</span>
              </div>
              <p className="mt-1 text-[9px] text-stone-500">+2.4% vs yesterday</p>
            </div>
            <div className="rounded-xl border border-red-500/20 bg-red-500/[0.035] p-3 sm:flex-1 sm:p-4">
              <div className="flex items-center justify-between">
                <p className="font-mono text-[8px] uppercase tracking-widest text-stone-500">
                  System status
                </p>
                <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
              </div>
              <p className="mt-2 text-xs font-semibold tracking-wide text-red-400 sm:text-sm">
                ALERT DETECTED
              </p>
              <p className="mt-1.5 text-[9px] leading-4 text-stone-500">
                Unusual energy use · check filter
              </p>
            </div>
            <div className="hidden rounded-xl border border-white/[0.06] bg-[#1e1f1c] p-3 sm:block">
              <p className="font-mono text-[8px] uppercase tracking-widest text-stone-500">
                Cooling units
              </p>
              <p className="mt-1 font-mono text-lg text-stone-100">
                12 <span className="text-xs text-emerald-400">● sample units</span>
              </p>
            </div>
          </div>
          <PreviewChart />
        </div>
        <div className="flex items-center justify-between border-t border-white/[0.06] px-4 py-2.5 font-mono text-[8px] tracking-wider text-stone-600">
          <span>AC MONITORING · DEMO</span>
          <span>SAMPLE ENERGY + CLIMATE ESTIMATE</span>
          <span className="hidden sm:inline">ILLUSTRATIVE TELEMETRY</span>
        </div>
      </div>
    </div>
  );
}

const features = [
  {
    icon: "⌘",
    label: "01 / CONNECT",
    title: "Start with the AC you have",
    text: "Air conditioners are our first use case. We’re keeping the initial product focused while building a foundation that can grow to other machine types over time.",
    detail: "Phase 01 · Air conditioning",
  },
  {
    icon: "⌁",
    label: "02 / PREDICT",
    title: "Find cooling that costs more",
    text: "Compare each unit’s operating pattern over time to flag unusual energy draw, extended runtimes, and potential maintenance needs.",
    detail: "Anomalies worth investigating",
  },
  {
    icon: "↻",
    label: "03 / IMPROVE",
    title: "Connect efficiency to climate",
    text: "Turn measured energy changes into an estimated emissions impact using a grid factor your team can verify and update.",
    detail: "Transparent, configurable estimates",
  },
];

const stats = [
  ["01", "Start with air conditioning"],
  ["↓ kWh", "Track electricity use"],
  ["CO₂e", "Estimate climate impact"],
  ["↻", "Learn from maintenance feedback"],
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#121311] font-sans text-stone-100">
      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#121311]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[68px] max-w-[1240px] items-center justify-between px-5 sm:px-8">
          <Brand />
          <nav className="hidden items-center gap-8 text-xs text-stone-400 md:flex">
            <a className="transition hover:text-white" href="#features">Platform</a>
            <a className="transition hover:text-white" href="#solutions">Solutions</a>
            <a className="transition hover:text-white" href="#impact">Impact</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 text-xs text-stone-300 transition hover:text-white"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-amber-500 px-4 py-2.5 text-xs font-semibold text-[#17140d] shadow-[0_4px_20px_-8px_#f59e0b] transition hover:bg-amber-400"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <section className="relative px-5 pb-14 pt-16 sm:px-8 sm:pb-20 sm:pt-24">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-0 mx-auto h-[500px] max-w-5xl bg-[radial-gradient(ellipse_at_top,rgba(245,166,35,0.12),transparent_67%)]" />
        <div className="relative mx-auto max-w-5xl text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/[0.06] px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.15em] text-amber-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
            Climate intelligence for cooling
          </div>
          <h1 className="mx-auto max-w-4xl text-[clamp(2.6rem,7vw,5.2rem)] font-semibold leading-[1.01] tracking-[-0.065em] text-[#f2f0e8]">
            Keep cool air.
            <br className="hidden sm:block" /> Waste{" "}
            <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-orange-500 bg-clip-text text-transparent">
              less energy.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-sm leading-6 text-stone-400 sm:text-base sm:leading-7">
            We’re starting with air conditioners: spot inefficient operation,
            catch faults earlier, and help buildings use less electricity—and
            emit less carbon. The longer-term vision is to bring that insight
            to other machines, too.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-amber-500 px-5 text-xs font-semibold text-[#17140d] transition hover:bg-amber-400"
            >
              Start monitoring <span aria-hidden="true">→</span>
            </Link>
            <a
              href="#features"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.035] px-5 text-xs font-medium text-stone-300 transition hover:border-white/20 hover:bg-white/[0.06]"
            >
              Explore the platform <span aria-hidden="true">↓</span>
            </a>
          </div>
          <div className="mt-4 text-[10px] text-stone-600">
            AC is our first focus—not the limit of where Sentrix can go.
          </div>
        </div>
        <div className="mx-auto mt-12 max-w-5xl sm:mt-16">
          <DashboardPreview />
        </div>
      </section>

      <section className="border-y border-white/[0.06] bg-white/[0.018] px-5 py-7 sm:px-8 sm:py-8">
        <div className="mx-auto flex max-w-[1120px] flex-col items-center justify-between gap-5 sm:flex-row">
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-stone-600">
            Focused today. Designed to grow.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-semibold tracking-tight text-stone-500 sm:gap-x-10">
            <span>AC · FIRST</span>
            <span className="text-amber-500">→</span>
            <span>MORE MACHINE TYPES · OVER TIME</span>
            <span className="text-amber-500">→</span>
            <span>LOWER-ENERGY OPERATIONS</span>
          </div>
        </div>
      </section>

      <section id="features" className="px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-[1120px]">
          <div className="max-w-2xl">
            <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-amber-500">
              Start where the energy goes
            </p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.05em] sm:text-4xl">
              Smarter air conditioning.
              <br />
              <span className="text-stone-500">A practical climate win.</span>
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-6 text-stone-400">
              We’re deliberately beginning with air conditioning—a practical
              way to focus our team and climate impact. The broader vision is a
              flexible platform that can support more machine types as Sentrix
              develops.
            </p>
          </div>
          <div className="mt-10 grid gap-3 md:grid-cols-3">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="group rounded-xl border border-white/[0.075] bg-[#191a17] p-5 transition duration-200 hover:-translate-y-1 hover:border-amber-500/25 hover:bg-[#1c1d19] sm:p-6"
              >
                <div className="flex items-start justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-amber-500/15 bg-amber-500/[0.08] font-mono text-lg text-amber-400">
                    {feature.icon}
                  </span>
                  <span className="font-mono text-[8px] tracking-[0.13em] text-stone-600">
                    {feature.label}
                  </span>
                </div>
                <h3 className="mt-6 text-sm font-semibold tracking-tight text-stone-100">
                  {feature.title}
                </h3>
                <p className="mt-2 min-h-[72px] text-xs leading-5 text-stone-400">
                  {feature.text}
                </p>
                <div className="mt-5 border-t border-white/[0.06] pt-4 font-mono text-[9px] text-amber-400">
                  <span className="mr-1.5">↗</span>
                  {feature.detail}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="solutions" className="px-5 pb-20 sm:px-8 sm:pb-28">
        <div className="mx-auto grid max-w-[1120px] items-center gap-9 rounded-2xl border border-white/[0.07] bg-[linear-gradient(115deg,#1c1d19,#171815_58%,#201b12)] p-6 sm:p-10 lg:grid-cols-[1fr_0.75fr] lg:p-12">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-amber-500">
              From signal to climate impact
            </p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.05em] sm:text-4xl">
              Make energy waste
              <br />
              visible—and fixable.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-6 text-stone-400">
              See which AC units run longer or draw more power than expected.
              Estimate the associated emissions, prioritize a check, and track
              whether the intervention helped.
            </p>
            <Link
              href="/signup"
              className="mt-7 inline-flex items-center gap-2 text-xs font-semibold text-amber-400 transition hover:text-amber-300"
            >
              Explore our starting point <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/[0.07] bg-black/20 p-4">
              <p className="font-mono text-[8px] uppercase tracking-widest text-stone-500">
                Emissions factor
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-amber-400">
                0.82<span className="ml-1 text-sm font-medium">kg CO₂e/kWh</span>
              </p>
              <p className="mt-1 text-[10px] text-stone-500">Set to your local grid</p>
            </div>
            <div className="rounded-xl border border-white/[0.07] bg-black/20 p-4">
              <p className="font-mono text-[8px] uppercase tracking-widest text-stone-500">
                Impact tracking
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-stone-100">
                kWh<span className="ml-1 text-sm font-medium text-amber-400">↓</span>
              </p>
              <p className="mt-1 text-[10px] text-stone-500">Compare before and after</p>
            </div>
            <div className="col-span-2 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.04] p-4">
              <p className="font-mono text-[8px] uppercase tracking-widest text-stone-500">
                Cooling efficiency
              </p>
              <div className="mt-3 flex items-end justify-between">
                <p className="text-sm font-medium text-stone-200">Build an AC energy baseline</p>
                <span className="font-mono text-xs text-emerald-400">STEP 01</span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                <div className="h-full w-[86%] rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="impact" className="border-y border-white/[0.06] bg-[#151613] px-5 py-14 sm:px-8 sm:py-16">
        <div className="mx-auto grid max-w-[1120px] grid-cols-2 gap-x-5 gap-y-9 md:grid-cols-4">
          {stats.map(([value, label]) => (
            <div key={label}>
              <p className="font-mono text-3xl font-medium tracking-[-0.04em] text-amber-400 sm:text-4xl">
                {value}
              </p>
              <p className="mt-2 text-[10px] text-stone-500">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-5 py-16 text-center sm:px-8 sm:py-20">
        <div className="mx-auto max-w-2xl">
          <BrandMark className="mx-auto h-10 w-10 rounded-xl" />
          <p className="mt-5 font-mono text-[9px] uppercase tracking-[0.22em] text-amber-500">
            Better cooling. Lighter footprint.
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">
            Cool the space.
            <span className="text-stone-500"> Not the planet.</span>
          </h2>
          <p className="mt-3 text-sm text-stone-400">
            Start with your AC units, uncover energy waste, and measure the
            climate impact of better operation.
          </p>
          <Link
            href="/signup"
            className="mt-7 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-amber-500 px-5 text-xs font-semibold text-[#17140d] transition hover:bg-amber-400"
          >
            Create your workspace <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/[0.06] bg-[#151613] px-5 py-9 sm:px-8">
        <div className="mx-auto max-w-[1120px]">
          <div className="grid gap-8 sm:grid-cols-[1.5fr_1fr_1fr_1fr]">
            <div>
              <Brand />
              <p className="mt-3 max-w-[240px] text-[10px] leading-5 text-stone-500">
                Starting with AC energy efficiency, with a longer-term vision
                to bring climate-focused insights to more machines.
              </p>
            </div>
            {(
              [
                ["Product", ["Overview", "Platform", "Hardware nodes", "Security"]],
                ["Company", ["About us", "Solutions", "Case studies", "Contact"]],
                ["Account", ["Log in", "Get started"]],
              ] as [string, string[]][]
            ).map(([heading, items]) => (
              <div key={heading}>
                <h3 className="text-[10px] font-semibold text-stone-200">{heading}</h3>
                <ul className="mt-3 space-y-2">
                  {items.map((item) => (
                    <li key={item}>
                      <Link
                        className="text-[10px] text-stone-500 transition hover:text-stone-200"
                        href={
                          item === "Log in"
                            ? "/login"
                            : item === "Get started"
                              ? "/signup"
                              : "#features"
                        }
                      >
                        {item}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-col gap-3 border-t border-white/[0.06] pt-5 font-mono text-[8px] uppercase tracking-widest text-stone-600 sm:flex-row sm:items-center sm:justify-between">
            <span>Sentrix · Starting with AC. Built to grow.</span>
            <span>© 2026 Sentrix. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
