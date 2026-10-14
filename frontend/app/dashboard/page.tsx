"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { isSupabaseConfigured, supabase } from "../lib/supabase-browser";

type IconName =
  | "overview"
  | "alerts"
  | "devices"
  | "settings"
  | "sun"
  | "moon"
  | "bell"
  | "plus"
  | "chevron"
  | "close"
  | "back";

type Device = {
  name: string;
  location: string;
  status: "healthy" | "alert";
  health: number;
  load: number;
  anomaly?: boolean;
  live?: boolean;
  sparkline: string;
};

type AlertLog = {
  id: number;
  node: string;
  timestamp: string;
  description: ReactNode;
  kind: "critical" | "resolved" | "warning";
  reviewed: boolean;
  feedback?: "valid" | "false";
  sparkline: string;
};

const initialAlerts: AlertLog[] = [
  {
    id: 1,
    node: "Central AC · Unit 03",
    timestamp: "2024.05.21_14:20:01",
    description: (
      <>
        Power draw above baseline: Expected <strong className="text-amber-600 dark:text-amber-400">4.2 kW</strong>, peaked at{" "}
        <strong className="text-red-500">7.1 kW</strong>
      </>
    ),
    kind: "critical",
    reviewed: false,
    sparkline: "0,20 12,23 24,8 36,26 48,17 60,22 72,5 84,9",
  },
  {
    id: 2,
    node: "Office AC · Unit 01",
    timestamp: "2024.05.21_13:45:12",
    description: "Thanks, this helps improve detection.",
    kind: "resolved",
    reviewed: true,
    feedback: "valid",
    sparkline: "0,15 12,14 24,17 36,11 48,15 60,10 72,12 84,8",
  },
  {
    id: 3,
    node: "Split AC · Unit 07",
    timestamp: "2024.05.21_12:10:44",
    description: (
      <>
        Cooling performance drift: Supply air normally <strong className="text-amber-600 dark:text-amber-400">14°C</strong>, now{" "}
        <strong className="text-amber-600 dark:text-amber-400">19°C</strong>
      </>
    ),
    kind: "warning",
    reviewed: false,
    sparkline: "0,14 14,16 28,13 42,18 56,12 70,9 84,7",
  },
];

const initialDevices: Device[] = [
  {
    name: "Office AC · Unit 01",
    location: "North wing · Meeting rooms",
    status: "healthy",
    anomaly: true,
    health: 98.2,
    load: 74,
    live: true,
    sparkline: "0,22 12,20 24,21 36,14 48,16 60,10 72,12 84,5",
  },
  {
    name: "Central AC · Unit 03",
    location: "Central plant · Building A",
    status: "alert",
    health: 42.8,
    load: 92,
    sparkline: "0,8 12,11 24,7 36,17 48,14 60,23 72,19 84,28",
  },
  {
    name: "Split AC · Unit 07",
    location: "Production office · Line 02",
    status: "healthy",
    health: 96.4,
    load: 61,
    sparkline: "0,20 12,17 24,18 36,10 48,13 60,7 72,10 84,4",
  },
  {
    name: "Rooftop AC · Unit 02",
    location: "Administration · Roof",
    status: "healthy",
    health: 99.1,
    load: 38,
    sparkline: "0,17 12,19 24,13 36,14 48,9 60,12 72,5 84,7",
  },
];

const navItems: { label: string; icon: IconName }[] = [
  { label: "Overview", icon: "overview" },
  { label: "Alerts", icon: "alerts" },
  { label: "Devices", icon: "devices" },
  { label: "Settings", icon: "settings" },
];

function Icon({
  name,
  className = "h-4 w-4",
}: {
  name: IconName;
  className?: string;
}) {
  const shared = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  const shapes: Record<IconName, ReactNode> = {
    overview: (
      <>
        <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
        <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
        <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
        <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
      </>
    ),
    alerts: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),
    devices: (
      <>
        <rect x="4" y="4" width="16" height="16" rx="3" />
        <path d="M9 8v8m6-8v8M7 11h10M7 14h10" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="m19.4 15 .1.1 1.1.9-1.1 1.9-1.3-.5a7.8 7.8 0 0 1-1.8 1l-.2 1.4h-2.2l-.3-1.4a7.8 7.8 0 0 1-1.8-1l-1.3.5-1.1-1.9 1.1-.9a7.6 7.6 0 0 1 0-2.1l-1.1-.9 1.1-1.9 1.3.5a7.8 7.8 0 0 1 1.8-1l.3-1.4h2.2l.2 1.4a7.8 7.8 0 0 1 1.8 1l1.3-.5 1.1 1.9-1.1.9a7.6 7.6 0 0 1 0 2.1Z" />
      </>
    ),
    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
      </>
    ),
    moon: <path d="M20.5 15.5A8.5 8.5 0 0 1 8.5 3.5 8.5 8.5 0 1 0 20.5 15.5Z" />,
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),
    plus: <path d="M12 5v14m-7-7h14" />,
    chevron: <path d="m9 18 6-6-6-6" />,
    close: <path d="m18 6-12 12M6 6l12 12" />,
    back: <path d="m15 18-6-6 6-6M9 12h12" />,
  };

  return <svg {...shared}>{shapes[name]}</svg>;
}

function TrendLine({ points, alert = false }: { points: string; alert?: boolean }) {
  return (
    <svg
      className={`h-8 w-24 ${alert ? "text-red-500/70" : "text-amber-500/80"}`}
      viewBox="0 0 84 32"
      fill="none"
      aria-hidden="true"
    >
      <polyline
        points={points}
        transform="translate(0 2)"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MetricCard({
  label,
  value,
  trend,
  alert = false,
  unit,
  caption,
}: {
  label: string;
  value: string;
  trend?: string;
  alert?: boolean;
  unit?: string;
  caption?: string;
}) {
  return (
    <article className="surface-card flex min-h-24 items-center justify-between gap-5 rounded-xl border px-5 py-4 sm:px-6">
      <div>
        <p className="eyebrow">{label}</p>
        <p
          className={`mt-1 font-mono text-[2rem] leading-none tracking-[-0.07em] ${
            alert ? "text-red-500" : "text-[var(--text-primary)]"
          }`}
        >
          {value}
          {unit && (
            <span className="ml-1.5 text-xs font-medium tracking-normal text-[var(--text-secondary)]">
              {unit}
            </span>
          )}
        </p>
        {caption && (
          <p className="mt-1.5 font-mono text-[8px] leading-4 text-[var(--text-muted)]">
            {caption}
          </p>
        )}
      </div>
      {!unit && trend && <TrendLine points={trend} alert={alert} />}
    </article>
  );
}

function DeviceCard({
  device,
  onClick,
}: {
  device: Device;
  onClick: () => void;
}) {
  const healthy = device.status === "healthy";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`surface-card group relative flex min-h-[174px] w-full flex-col rounded-xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 ${
        healthy ? "border-[var(--border)]" : "border-red-500/30"
      }`}
    >
      <span
        className={`absolute left-4 top-4 h-2 w-2 rounded-full ${
          healthy ? "bg-emerald-500 shadow-[0_0_12px_#10b98166]" : "bg-red-500"
        }`}
        aria-label={healthy ? "Healthy" : "Alert"}
      />
      <div className="flex min-h-8 items-start justify-end">
        {device.live && (
          <span className="rounded border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[9px] font-semibold tracking-widest text-emerald-600 dark:text-emerald-400">
            SAMPLE
          </span>
        )}
        {!healthy && (
          <span className="inline-flex items-center gap-1 rounded border border-red-500/20 bg-red-500/10 px-1.5 py-0.5 font-mono text-[9px] font-semibold tracking-widest text-red-500">
            <span className="h-1 w-1 rounded-full bg-red-500" />
            ALERT
          </span>
        )}
      </div>
      <div className="mt-1">
        <h3 className="text-sm font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
          {device.name}
        </h3>
        <p className="mt-1 text-[11px] text-[var(--text-muted)]">
          {device.location}
        </p>
      </div>
      <div className="mt-auto flex items-end justify-between border-t border-[var(--border)] pt-3">
        <div>
          <p className="eyebrow">Health index</p>
          <p
            className={`mt-1 font-mono text-xs ${
              healthy ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"
            }`}
          >
            {device.health.toFixed(1)}%
          </p>
        </div>
        <div className="flex items-end gap-3">
          <div className="text-right">
            <p className="eyebrow">Energy / day</p>
            <p className="mt-1 font-mono text-xs text-[var(--text-secondary)]">
              {device.load} kWh
            </p>
          </div>
          <TrendLine points={device.sparkline} alert={!healthy} />
        </div>
      </div>
    </button>
  );
}

function AlertLogs({
  alerts,
  onReview,
}: {
  alerts: AlertLog[];
  onReview: (id: number, feedback: "valid" | "false") => void;
}) {
  const [nodeFilter, setNodeFilter] = useState("All Nodes");
  const [timeRange, setTimeRange] = useState("Last 24 Hours");
  const [statusFilter, setStatusFilter] = useState<"unreviewed" | "reviewed">(
    "unreviewed",
  );

  const nodes = Array.from(new Set(alerts.map((alert) => alert.node)));
  const filteredAlerts = alerts.filter(
    (alert) =>
      alert.reviewed === (statusFilter === "reviewed") &&
      (nodeFilter === "All Nodes" || alert.node === nodeFilter),
  );

  return (
    <>
      <div className="mb-6 grid gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:flex sm:flex-wrap sm:items-end">
        <label className="block">
          <span className="eyebrow mb-1.5 block">Node filter</span>
          <select
            value={nodeFilter}
            onChange={(event) => setNodeFilter(event.target.value)}
            className="h-9 min-w-36 rounded-lg border border-[var(--border)] bg-[var(--canvas)] px-3 text-xs text-[var(--text-primary)] outline-none focus:border-amber-500"
          >
            <option>All Nodes</option>
            {nodes.map((node) => (
              <option key={node}>{node}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="eyebrow mb-1.5 block">Time range</span>
          <select
            value={timeRange}
            onChange={(event) => setTimeRange(event.target.value)}
            className="h-9 min-w-36 rounded-lg border border-[var(--border)] bg-[var(--canvas)] px-3 text-xs text-[var(--text-primary)] outline-none focus:border-amber-500"
          >
            <option>Last 24 Hours</option>
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
          </select>
        </label>
        <div className="sm:ml-auto">
          <span className="eyebrow mb-1.5 block">Status</span>
          <div className="inline-flex rounded-lg border border-[var(--border)] bg-[var(--canvas)] p-0.5">
            {(["unreviewed", "reviewed"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`rounded-md px-3 py-1.5 text-[10px] font-medium uppercase tracking-wide transition ${
                  statusFilter === status
                    ? "bg-[var(--surface)] text-[var(--text-primary)] shadow-sm"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-3 flex items-center gap-2">
        <span className="h-3 w-0.5 rounded-full bg-amber-500" />
        <h2 className="eyebrow">Recent anomalies</h2>
        <span className="font-mono text-[9px] text-[var(--text-muted)]">
          {filteredAlerts.length.toString().padStart(2, "0")}
        </span>
      </div>
      {filteredAlerts.length ? (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => (
            <AlertRow key={alert.id} alert={alert} onReview={onReview} />
          ))}
        </div>
      ) : (
        <div className="surface-card rounded-xl border border-[var(--border)] px-5 py-12 text-center text-sm text-[var(--text-muted)]">
          No {statusFilter} alerts for this filter.
        </div>
      )}
      <p className="mt-4 text-[10px] text-[var(--text-muted)]">
        Showing {filteredAlerts.length} {statusFilter} alert
        {filteredAlerts.length === 1 ? "" : "s"} · {timeRange.toLowerCase()}
      </p>
    </>
  );
}

function AlertRow({
  alert,
  onReview,
}: {
  alert: AlertLog;
  onReview: (id: number, feedback: "valid" | "false") => void;
}) {
  const resolved = alert.reviewed;
  return (
    <article
      className={`surface-card flex flex-col gap-4 rounded-xl border px-4 py-4 sm:flex-row sm:items-center sm:px-5 ${
        resolved ? "border-[var(--border)] opacity-80" : "border-[var(--border)]"
      }`}
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border ${
          alert.kind === "critical"
            ? "border-red-500/20 bg-red-500/10 text-red-500"
            : alert.kind === "warning"
              ? "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400"
              : "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        }`}
      >
        {resolved ? (
          <span className="text-sm">✓</span>
        ) : alert.kind === "warning" ? (
          <span className="font-mono text-sm">!</span>
        ) : (
          <span className="text-sm">ϟ</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h3 className="text-xs font-semibold text-[var(--text-primary)]">
            {alert.node}
          </h3>
          <time className="font-mono text-[9px] text-[var(--text-muted)]">
            {alert.timestamp}
          </time>
          {alert.kind === "critical" && (
            <span className="rounded bg-red-500/10 px-1.5 py-0.5 font-mono text-[8px] font-semibold tracking-widest text-red-500">
              CRITICAL
            </span>
          )}
        </div>
        <p
          className={`mt-1 text-[11px] leading-5 ${
            resolved ? "text-emerald-600 dark:text-emerald-400" : "text-[var(--text-secondary)]"
          }`}
        >
          {alert.description}
        </p>
      </div>
      <TrendLine points={alert.sparkline} alert={alert.kind === "critical"} />
      {resolved ? (
        <button
          onClick={() =>
            onReview(alert.id, alert.feedback === "valid" ? "false" : "valid")
          }
          className="shrink-0 text-left font-mono text-[9px] uppercase tracking-wide text-[var(--text-muted)] underline underline-offset-4 hover:text-[var(--text-primary)] sm:text-right"
        >
          Change feedback
        </button>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <button
            onClick={() => onReview(alert.id, "valid")}
            className="rounded-md bg-amber-500 px-3 py-2 text-[10px] font-semibold text-[#21170a] transition hover:bg-amber-400"
          >
            Valid Issue
          </button>
          <button
            onClick={() => onReview(alert.id, "false")}
            className="rounded-md border border-[var(--border)] px-3 py-2 text-[10px] font-medium text-[var(--text-secondary)] transition hover:bg-[var(--surface-hover)]"
          >
            False Alarm
          </button>
        </div>
      )}
    </article>
  );
}

function NodeAnalytics({
  device,
  emissionsFactor,
}: {
  device: Device;
  emissionsFactor: number;
}) {
  const isAlert = device.status === "alert" || device.anomaly === true;

  return (
    <div className="mx-auto grid w-full max-w-[1600px] gap-5 px-4 pb-8 pt-5 sm:px-6 sm:pt-7 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.42fr)] lg:gap-8 lg:px-8 lg:pt-9">
      <section className="surface-card rounded-xl border border-[var(--border)] p-4 sm:p-6 lg:p-7">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="eyebrow">AC power draw (kW) / 24h time-series</h2>
            <p
              className={`mt-1 font-mono text-[10px] ${
                isAlert ? "text-red-500" : "text-[var(--text-muted)]"
              }`}
            >
              {isAlert
                ? "Power draw is 14% above this unit’s baseline"
                : "Power draw is within this unit’s baseline"}
            </p>
          </div>
          <div className="flex items-center gap-3 text-[9px] text-[var(--text-muted)]">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 bg-[var(--chart-band)]" />
              Expected range
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-px w-3 bg-[var(--text-primary)]" />
              Power draw
            </span>
          </div>
        </div>
        <TelemetryChart />
      </section>

      <aside className="grid content-start gap-4 sm:grid-cols-2 lg:grid-cols-1">
        <AnalyticsMetric label="Latest power draw" value="4.82" unit="kW" />
        <AnalyticsMetric label="Today's average draw" value="4.21" unit="kW" />
        <AnalyticsMetric
          label="Estimated daily emissions"
          value={(device.load * emissionsFactor).toFixed(1)}
          unit="kg CO₂e"
          caption={`Illustrative: ${device.load} kWh/day × ${emissionsFactor.toFixed(2)} kg CO₂e/kWh`}
        />
        <section className="surface-card overflow-hidden rounded-xl border border-[var(--border)] sm:col-span-2 lg:col-span-1">
          <h2 className="border-b border-[var(--border)] bg-[var(--surface-hover)] px-4 py-3 font-mono text-[9px] font-semibold tracking-wider">
            Hardware metadata
          </h2>
          <dl className="space-y-3 p-4">
            {[
              ["Equipment", "Air conditioner"],
              ["Device UID", "SNTRX-AC-001"],
              ["Energy today", `${device.load} kWh (sample)`],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-3">
                <dt className="eyebrow text-[8px]">{label}</dt>
                <dd className="font-mono text-[9px] text-[var(--text-secondary)]">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </section>
        <section
          className={`rounded-xl border p-4 sm:col-span-2 lg:col-span-1 ${
            isAlert
              ? "border-red-500/20 bg-red-500/[0.06]"
              : "border-emerald-500/20 bg-emerald-500/[0.05]"
          }`}
        >
          <h2
            className={`flex items-center gap-2 text-xs font-semibold ${
              isAlert ? "text-red-500" : "text-emerald-600 dark:text-emerald-400"
            }`}
          >
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-current/10 text-[10px]">
              {isAlert ? "!" : "✓"}
            </span>
            {isAlert ? "Predictive Warning" : "System Normal"}
          </h2>
          <p className="mt-2 font-mono text-[10px] leading-5 text-[var(--text-secondary)]">
            {isAlert
              ? "Sample telemetry is 14% above this unit’s baseline. Inspect the filter, coil, and setpoint before treating this as avoidable energy use."
              : "Sample telemetry is within this unit’s baseline. Track energy use alongside indoor comfort before changing operation."}
          </p>
        </section>
      </aside>
    </div>
  );
}

function AnalyticsMetric({
  label,
  value,
  unit,
  caption,
}: {
  label: string;
  value: string;
  unit: string;
  caption?: string;
}) {
  return (
    <section className="surface-card flex min-h-[108px] flex-col justify-center rounded-xl border border-[var(--border)] px-5 py-4">
      <h2 className="eyebrow">{label}</h2>
      <p className="mt-1 font-mono text-4xl tracking-[-0.06em]">
        {value}
        <span className="ml-2 text-sm tracking-normal text-amber-600 dark:text-amber-400">
          {unit}
        </span>
      </p>
      {caption && (
        <p className="mt-1 font-mono text-[8px] text-[var(--text-muted)]">{caption}</p>
      )}
    </section>
  );
}

function TelemetryChart() {
  const times = ["0:00", "2:00", "4:00", "6:00", "8:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00"];
  const levels = ["6", "5.5", "5", "4.5", "4", "3.5"];

  return (
    <div className="w-full overflow-hidden">
      <svg
        className="block h-auto w-full"
        viewBox="0 0 900 370"
        role="img"
        aria-label="24-hour air conditioner power draw chart showing readings and expected operating range"
      >
        <g stroke="var(--chart-grid)" strokeWidth="1">
          {levels.map((_, index) => (
            <line
              key={`horizontal-${index}`}
              x1="54"
              x2="890"
              y1={62 + index * 49}
              y2={62 + index * 49}
            />
          ))}
          {times.map((time, index) => (
            <line
              key={`vertical-${time}`}
              x1={96 + index * 70}
              x2={96 + index * 70}
              y1="20"
              y2="346"
            />
          ))}
        </g>
        <g fill="var(--chart-label)" fontFamily="monospace" fontSize="8">
          {levels.map((level, index) => (
            <text key={level} x="25" y={65 + index * 49}>
              {level}
            </text>
          ))}
          {times.map((time, index) => (
            <text key={time} x={96 + index * 70} y="360" textAnchor="middle">
              {time}
            </text>
          ))}
        </g>
        <path
          d="M54 260 L110 230 L145 250 L180 190 L205 105 L230 78 L265 116 L330 150 L400 185 L470 220 L500 238 L540 215 L590 175 L650 145 L705 112 L735 55 L755 70 L785 118 L830 172 L865 210 L890 225 L890 275 L860 260 L825 245 L780 195 L750 150 L730 120 L700 145 L645 175 L590 205 L545 245 L500 278 L465 255 L395 220 L325 185 L260 150 L230 125 L205 155 L175 225 L142 285 L110 270 L54 300 Z"
          fill="var(--chart-band)"
          opacity="0.68"
        />
        <path
          d="M54 274 C78 261 96 251 110 242 S136 253 145 263 S164 252 180 229 S196 212 205 153 S219 110 230 99 S248 122 255 160 S275 175 300 190 S355 219 400 242 S462 276 480 284 S514 268 540 256 S576 233 590 215 S615 200 645 183 S686 162 705 145 S724 118 730 90 S739 39 746 42 S759 90 770 117 S800 155 830 187 S858 218 875 229 S888 234 890 233"
          fill="none"
          stroke="var(--chart-line)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <g fill="var(--chart-alert)">
          <circle cx="205" cy="104" r="4" />
          <circle cx="223" cy="84" r="4" />
          <circle cx="746" cy="42" r="4" />
        </g>
      </svg>
    </div>
  );
}

function SettingsPanel({
  onLogout,
  onFactorChange,
}: {
  onLogout: () => void;
  onFactorChange: (factor: number) => void;
}) {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(false);
  const [emissionsFactor, setEmissionsFactor] = useState("0.82");
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    try {
      const value = localStorage.getItem("sentrix-demo-settings");
      if (!value) return;
      const settings: unknown = JSON.parse(value);
      if (!settings || typeof settings !== "object") return;
      const preferences = settings as Record<string, unknown>;
      window.setTimeout(() => {
        if (typeof preferences.emailAlerts === "boolean") {
          setEmailAlerts(preferences.emailAlerts);
        }
        if (typeof preferences.weeklySummary === "boolean") {
          setWeeklySummary(preferences.weeklySummary);
        }
      }, 0);
      if (
        typeof preferences.emissionsFactor === "string" &&
        Number.isFinite(Number(preferences.emissionsFactor)) &&
        Number(preferences.emissionsFactor) >= 0
      ) {
        window.setTimeout(() => {
          setEmissionsFactor(preferences.emissionsFactor as string);
          onFactorChange(Number(preferences.emissionsFactor));
        }, 0);
      }
    } catch {
      window.setTimeout(
        () => setSaveError("Could not load saved preferences from this browser."),
        0,
      );
    }
  }, [onFactorChange]);

  function savePreferences(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      localStorage.setItem(
        "sentrix-demo-settings",
        JSON.stringify({ emailAlerts, weeklySummary, emissionsFactor }),
      );
      onFactorChange(Number(emissionsFactor));
      setSaveError("");
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch {
      setSaveError("Could not save preferences. Check this browser’s storage settings.");
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1040px] space-y-6">
      <div>
        <p className="eyebrow mb-1.5">Workspace preferences</p>
        <h1 className="text-xl font-semibold tracking-[-0.04em] sm:text-2xl">
          Settings
        </h1>
        <p className="mt-1.5 text-xs text-[var(--text-muted)] sm:text-sm">
          Manage your demo profile, climate assumptions, and notifications.
        </p>
      </div>

      <section className="surface-card overflow-hidden rounded-xl border border-[var(--border)]">
        <div className="border-b border-[var(--border)] px-5 py-4">
          <h2 className="text-sm font-semibold">Account</h2>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Profile details for this preview workspace.
          </p>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <div>
            <p className="eyebrow">Name</p>
            <p className="mt-1.5 text-sm">A. Valdez</p>
          </div>
          <div>
            <p className="eyebrow">Email</p>
            <p className="mt-1.5 text-sm">a.valdez@sentrix.example</p>
          </div>
          <p className="sm:col-span-2 text-[10px] leading-4 text-[var(--text-muted)]">
            This is sample account information. Authentication and profile editing
            are not connected to a backend yet.
          </p>
        </div>
      </section>

      <form onSubmit={savePreferences} className="space-y-6">
        <section className="surface-card overflow-hidden rounded-xl border border-[var(--border)]">
          <div className="border-b border-[var(--border)] px-5 py-4">
            <h2 className="text-sm font-semibold">Climate reporting</h2>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Use a grid emissions factor to estimate the carbon impact of AC
              electricity use.
            </p>
          </div>
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:justify-between">
            <label className="block w-full sm:max-w-xs">
              <span className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                Grid emissions factor
              </span>
              <div className="flex">
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={emissionsFactor}
                  onChange={(event) => setEmissionsFactor(event.target.value)}
                  className="h-10 min-w-0 flex-1 rounded-l-lg border border-r-0 border-[var(--border)] bg-[var(--canvas)] px-3 font-mono text-sm outline-none focus:border-amber-500"
                />
                <span className="flex items-center rounded-r-lg border border-[var(--border)] bg-[var(--surface-hover)] px-3 font-mono text-[9px] text-[var(--text-muted)]">
                  kg CO₂e / kWh
                </span>
              </div>
            </label>
            <p className="max-w-sm text-[10px] leading-4 text-[var(--text-muted)]">
              Current value is illustrative only. Replace it with an official
              factor for your region before reporting real savings.
            </p>
          </div>
        </section>

        <section className="surface-card overflow-hidden rounded-xl border border-[var(--border)]">
          <div className="border-b border-[var(--border)] px-5 py-4">
            <h2 className="text-sm font-semibold">Notifications</h2>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Choose what you would like to receive.
            </p>
          </div>
          <div className="divide-y divide-[var(--border)]">
            <PreferenceToggle
              label="AC anomaly alerts"
              description="Notify me when an AC unit’s sample readings differ from baseline."
              checked={emailAlerts}
              onChange={setEmailAlerts}
            />
            <PreferenceToggle
              label="Weekly energy summary"
              description="A weekly overview of energy use and estimated emissions."
              checked={weeklySummary}
              onChange={setWeeklySummary}
            />
          </div>
        </section>

        <div className="flex flex-col-reverse items-start justify-between gap-3 sm:flex-row sm:items-center">
          <p
            aria-live="polite"
            className={`text-xs ${
              saveError
                ? "text-red-500"
                : "text-emerald-600 dark:text-emerald-400"
            }`}
          >
            {saveError || (saved ? "Preferences saved in this browser." : "")}
          </p>
          <button
            type="submit"
            className="rounded-lg bg-amber-500 px-4 py-2.5 text-xs font-semibold text-[#20170a] transition hover:bg-amber-400"
          >
            Save preferences
          </button>
        </div>
      </form>

      <section className="overflow-hidden rounded-xl border border-red-500/20 bg-red-500/[0.035]">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold">Sign out</h2>
            <p className="mt-1 max-w-lg text-xs leading-5 text-[var(--text-muted)]">
              End this temporary demo session on this tab and return to the login
              screen. No account credentials are stored.
            </p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-red-500/30 px-4 py-2.5 text-xs font-semibold text-red-500 transition hover:bg-red-500/10"
          >
            <span aria-hidden="true">↪</span>
            Log out
          </button>
        </div>
      </section>
    </div>
  );
}

function PreferenceToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4">
      <span>
        <span className="block text-xs font-medium">{label}</span>
        <span className="mt-1 block text-[10px] leading-4 text-[var(--text-muted)]">
          {description}
        </span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 shrink-0 accent-amber-500"
      />
    </label>
  );
}

export default function Home({ initialNav = "Overview" }: { initialNav?: string }) {
  const router = useRouter();
  const [isDark, setIsDark] = useState(true);
  const [emissionsFactor, setEmissionsFactor] = useState(0.82);
  const [activeNav, setActiveNav] = useState(initialNav);
  const [devices, setDevices] = useState(initialDevices);
  const [alerts, setAlerts] = useState(initialAlerts);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [deviceName, setDeviceName] = useState("");
  const [deviceLocation, setDeviceLocation] = useState("");

  const alertCount = devices.filter((device) => device.status === "alert").length;
  const estimatedEnergy = devices.reduce((total, device) => total + device.load, 0);
  const estimatedEmissions = estimatedEnergy * emissionsFactor;

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace("/login");
    });
  }, [router]);

  async function logout() {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    sessionStorage.removeItem("sentrix-demo-session");
    router.replace("/login");
  }

  function navigateTo(label: string) {
    setSelectedDevice(null);
    setActiveNav(label);
  }

  function reviewAlert(id: number, feedback: "valid" | "false") {
    setAlerts((current) =>
      current.map((alert) =>
        alert.id === id
          ? {
              ...alert,
              reviewed: true,
              feedback,
              description:
                feedback === "valid"
                  ? "Thanks, this helps improve detection."
                  : "Marked as a false alarm. Feedback saved.",
              kind: "resolved",
            }
          : alert,
      ),
    );
  }

  function addDevice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = deviceName.trim();
    const location = deviceLocation.trim();
    if (!name || !location) return;

    setDevices((current) => [
      ...current,
      {
        name,
        location,
        status: "healthy",
        health: 100,
        load: 0,
        sparkline: "0,20 12,18 24,17 36,14 48,12 60,9 72,8 84,5",
      },
    ]);
    setDeviceName("");
    setDeviceLocation("");
    setShowAddDevice(false);
  }

  return (
    <div
      className={`dashboard-shell min-h-screen bg-[var(--canvas)] text-[var(--text-primary)] ${
        isDark ? "dark" : "light"
      }`}
      data-theme={isDark ? "dark" : "light"}
    >
      <div className="flex min-h-screen">
        {!selectedDevice && (
        <aside className="sidebar hidden w-[224px] shrink-0 flex-col border-r border-[var(--border)] bg-[var(--sidebar)] md:flex">
          <a
            href="#overview"
            onClick={() => navigateTo("Overview")}
            className="flex h-[68px] items-center gap-3 border-b border-[var(--border)] px-6"
            aria-label="Sentrix home"
          >
            <BrandMark />
            <span className="text-sm font-semibold tracking-[-0.03em]">Sentrix</span>
          </a>
          <nav className="space-y-1 px-3 py-6" aria-label="Main navigation">
            {navItems.map((item) => (
              <NavButton
                key={item.label}
                item={item}
                active={activeNav === item.label}
                alertCount={alertCount}
                onClick={() => navigateTo(item.label)}
              />
            ))}
          </nav>
          <div className="mt-auto flex items-center gap-3 border-t border-[var(--border)] px-5 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 to-orange-500 text-[10px] font-bold text-[#382315]">
              AV
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium">A. Valdez</p>
              <p className="mt-0.5 truncate text-[10px] text-[var(--text-muted)]">
                System administrator
              </p>
            </div>
            <button
              className="ml-auto text-[var(--text-muted)] transition hover:text-[var(--text-primary)]"
              aria-label="Profile options"
            >
              <Icon name="chevron" className="h-3.5 w-3.5" />
            </button>
          </div>
        </aside>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-[var(--border)] bg-[var(--header)] px-4 sm:px-6 lg:px-8">
            {selectedDevice ? (
              <div className="flex min-w-0 items-center gap-3">
                <button
                  onClick={() => setSelectedDevice(null)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--border)] text-[var(--text-secondary)] transition hover:bg-[var(--surface-hover)]"
                  aria-label="Back to devices"
                >
                  <Icon name="back" />
                </button>
                <div className="min-w-0">
                  <h1 className="truncate text-sm font-semibold sm:text-base">
                    {selectedDevice.name}
                  </h1>
                  <span
                    className={`mt-0.5 inline-flex items-center gap-1.5 font-mono text-[9px] font-semibold tracking-widest ${
                      selectedDevice.status === "alert"
                        ? "text-red-500"
                        : "text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        selectedDevice.status === "alert" ? "bg-red-500" : "bg-emerald-500"
                      }`}
                    />
                    {selectedDevice.status === "alert" ? "ALERT · SAMPLE" : "SAMPLE"}
                  </span>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 md:hidden">
                  <BrandMark />
                  <span className="text-sm font-semibold tracking-[-0.03em]">Sentrix</span>
                </div>
                <div className="hidden items-center gap-3 md:flex">
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {activeNav === "Overview" ? "Global Overview" : activeNav}
                  </span>
                  <span className="h-4 w-px bg-[var(--border)]" />
                  <span className="text-xs text-[var(--text-muted)]">
                    Operations / Global
                  </span>
                </div>
              </>
            )}
            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setIsDark((current) => !current)}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 text-xs text-[var(--text-secondary)] transition hover:border-amber-500/50 sm:px-3"
                aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
              >
                <Icon name={isDark ? "moon" : "sun"} className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{isDark ? "Dark" : "Light"}</span>
              </button>
              {!selectedDevice && (
              <>
              <div className="relative">
                <button
                  onClick={() => setShowNotifications((current) => !current)}
                  className="relative flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-secondary)] transition hover:bg-[var(--surface-hover)]"
                  aria-label="Notifications"
                  aria-expanded={showNotifications}
                >
                  <Icon name="bell" className="h-[17px] w-[17px]" />
                  {alertCount > 0 && (
                    <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-red-500 ring-2 ring-[var(--header)]" />
                  )}
                </button>
                {showNotifications && (
                  <div className="surface-card absolute right-0 top-11 z-30 w-72 rounded-xl border p-4 shadow-xl">
                    <p className="text-sm font-semibold">Notifications</p>
                    <p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">
                      {alertCount
                        ? `${alertCount} device alert${alertCount === 1 ? "" : "s"} need attention.`
                        : "All systems are running smoothly."}
                    </p>
                    {alertCount > 0 && (
                      <button
                        onClick={() => {
                          navigateTo("Alerts");
                          setShowNotifications(false);
                        }}
                        className="mt-3 text-xs font-medium text-amber-600 hover:text-amber-500 dark:text-amber-400"
                      >
                        View alerts →
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="hidden h-8 w-px bg-[var(--border)] sm:block" />
              <div className="hidden items-center gap-2.5 sm:flex">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 to-orange-500 text-[10px] font-bold text-[#382315]">
                  AV
                </div>
                <span className="text-xs font-medium text-[var(--text-secondary)]">
                  A. Valdez
                </span>
              </div>
              <button
                onClick={() => setShowAddDevice(true)}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-amber-500 px-3 text-xs font-semibold text-[#20170a] shadow-sm shadow-amber-500/15 transition hover:bg-amber-400 sm:ml-1 sm:px-3.5"
              >
                <Icon name="plus" className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Add Device</span>
                <span className="sm:hidden">Add</span>
              </button>
              </>
              )}
            </div>
          </header>

          <main
            id="overview"
            className={
              selectedDevice
                ? "flex-1"
                : "mx-auto w-full max-w-[1600px] flex-1 px-4 pb-24 pt-6 sm:px-6 sm:pt-8 md:pb-10 lg:px-8 lg:pt-9"
            }
          >
            {selectedDevice ? (
              <NodeAnalytics device={selectedDevice} emissionsFactor={emissionsFactor} />
            ) : activeNav === "Alerts" ? (
              <div className="mx-auto w-full max-w-[1600px] px-0 pt-0 sm:px-0">
                <div className="mb-5">
                  <p className="eyebrow mb-1.5">Sentrix intelligence</p>
                  <h1 className="text-xl font-semibold tracking-[-0.04em] sm:text-2xl">
                    Alert Logs
                  </h1>
                </div>
                <AlertLogs alerts={alerts} onReview={reviewAlert} />
              </div>
            ) : activeNav === "Settings" ? (
              <SettingsPanel
                onLogout={logout}
                onFactorChange={setEmissionsFactor}
              />
            ) : (
            <>
            <div className="mb-6 flex items-end justify-between gap-4 md:mb-8">
              <div>
                <p className="eyebrow mb-2">Wednesday, October 14, 2026</p>
                <h1 className="text-xl font-semibold tracking-[-0.045em] sm:text-2xl">
                  {activeNav === "Overview" ? "Global Overview" : activeNav}
                </h1>
                <p className="mt-1.5 text-xs text-[var(--text-muted)] sm:text-sm">
                  AC energy use, unit health, and estimated climate impact.
                </p>
              </div>
              <div className="hidden items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 sm:flex">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b98199]" />
                <span className="font-mono text-[10px] tracking-wider text-[var(--text-secondary)]">
                  AC FLEET · SAMPLE DATA
                </span>
              </div>
            </div>

            <section
              className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3"
              aria-label="Cooling and climate summary"
            >
              <MetricCard
                label="Active AC units"
                value={devices.length.toString().padStart(2, "0")}
                trend="0,23 12,19 24,21 36,14 48,16 60,10 72,12 84,5"
              />
              <MetricCard
                label="Anomalies today"
                value="03"
                trend="0,7 12,12 24,8 36,18 48,14 60,23 72,19 84,28"
                alert
              />
              <MetricCard
                label="Estimated daily emissions"
                value={estimatedEmissions.toFixed(1)}
                unit="kg CO₂e"
                caption={`${estimatedEnergy} kWh/day · illustrative ${emissionsFactor.toFixed(2)} kg CO₂e/kWh`}
              />
            </section>

            <section className="mt-8 md:mt-10" aria-label="Node telemetry">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <h2 className="eyebrow">Air-conditioning units</h2>
                  <span className="rounded-md border border-[var(--border)] px-1.5 py-0.5 font-mono text-[9px] text-[var(--text-muted)]">
                    {devices.length.toString().padStart(2, "0")} UNITS
                  </span>
                </div>
                <button
                  onClick={() => navigateTo("Devices")}
                  className="text-[11px] text-[var(--text-muted)] transition hover:text-[var(--text-primary)]"
                >
                  View all
                </button>
              </div>
              {devices.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {devices.map((device) => (
                    <DeviceCard
                      key={device.name}
                      device={device}
                      onClick={() => setSelectedDevice(device)}
                    />
                  ))}
                </div>
              ) : (
                <div className="surface-card rounded-xl border border-[var(--border)] px-5 py-10 text-center text-sm text-[var(--text-muted)]">
                  No devices connected yet.
                </div>
              )}
            </section>

            <div className="mt-7 flex items-center justify-between border-t border-[var(--border)] pt-4 text-[10px] text-[var(--text-muted)]">
              <span>Illustrative sample readings · carbon estimate uses a configurable grid factor.</span>
              <span className="hidden font-mono sm:block">DEMO DATA</span>
            </div>
            </>
            )}
          </main>
        </div>
      </div>

      {!selectedDevice && <nav
        className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-[var(--border)] bg-[var(--sidebar)] px-2 pb-[env(safe-area-inset-bottom)] pt-2 md:hidden"
        aria-label="Mobile navigation"
      >
        {navItems.map((item) => (
          <NavButton
            key={item.label}
            item={item}
            active={activeNav === item.label}
            alertCount={alertCount}
            onClick={() => navigateTo(item.label)}
            mobile
          />
        ))}
      </nav>}

      {showAddDevice && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowAddDevice(false);
          }}
        >
          <form
            onSubmit={addDevice}
            className="surface-card w-full max-w-md rounded-2xl border border-[var(--border)] p-5 shadow-2xl sm:p-6"
          >
            <div className="mb-5 flex items-start justify-between">
              <div>
                <p className="eyebrow">Device management</p>
                <h2 className="mt-1 text-lg font-semibold tracking-tight">
                  Add a device
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowAddDevice(false)}
                className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-hover)]"
                aria-label="Close"
              >
                <Icon name="close" />
              </button>
            </div>
            <label className="mb-4 block">
              <span className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                Device name
              </span>
              <input
                autoFocus
                required
                value={deviceName}
                onChange={(event) => setDeviceName(event.target.value)}
                placeholder="e.g. Boiler Room 2"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--canvas)] px-3 py-2.5 text-sm outline-none placeholder:text-[var(--text-muted)] focus:border-amber-500"
              />
            </label>
            <label className="mb-6 block">
              <span className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                Location
              </span>
              <input
                required
                value={deviceLocation}
                onChange={(event) => setDeviceLocation(event.target.value)}
                placeholder="e.g. North wing · Level 2"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--canvas)] px-3 py-2.5 text-sm outline-none placeholder:text-[var(--text-muted)] focus:border-amber-500"
              />
            </label>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddDevice(false)}
                className="rounded-lg border border-[var(--border)] px-3.5 py-2 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-amber-500 px-3.5 py-2 text-xs font-semibold text-[#20170a] hover:bg-amber-400"
              >
                Add device
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function BrandMark() {
  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-500 text-[#20170a]">
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
        <path
          d="M5 12h3l2-5 4 10 2-5h3"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function NavButton({
  item,
  active,
  alertCount,
  onClick,
  mobile = false,
}: {
  item: { label: string; icon: IconName };
  active: boolean;
  alertCount: number;
  onClick: () => void;
  mobile?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={
        mobile
          ? `relative flex flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-[9px] transition ${
              active ? "text-amber-600 dark:text-amber-400" : "text-[var(--text-muted)]"
            }`
          : `flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs transition ${
              active
                ? "bg-amber-500/10 font-medium text-amber-700 dark:text-amber-400"
                : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
            }`
      }
    >
      <span className="relative">
        <Icon name={item.icon} className={mobile ? "h-[18px] w-[18px]" : "h-4 w-4"} />
        {item.label === "Alerts" && alertCount > 0 && (
          <span
            className={`absolute flex items-center justify-center rounded-full bg-red-500 font-mono text-[8px] text-white ${
              mobile ? "-right-2 -top-1 h-3.5 min-w-3.5 px-0.5" : "-right-2 -top-1 h-3.5 min-w-3.5 px-0.5"
            }`}
          >
            {alertCount}
          </span>
        )}
      </span>
      <span>{item.label}</span>
    </button>
  );
}
