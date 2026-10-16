"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense } from "react";
import { useSentrix, type Device } from "../../../lib/sentrix-store";
import { TelemetryChart } from "./telemetry-chart";

function getCalibrationDay(startedAt: string): number {
  const diffMs = Math.max(0, Date.now() - new Date(startedAt).getTime());
  const day = Math.floor(diffMs / (24 * 60 * 60 * 1000)) + 1;
  return Math.max(1, Math.min(7, day));
}

function DynamicSensorStatusBadge({ device }: { device: Device }) {
  if (device.status === "CALIBRATING") {
    const day = getCalibrationDay(device.calibrationStartedAt);
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 font-mono text-xs font-semibold text-amber-600 dark:text-amber-400">
        <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
        Calibrating (Day {day}/7)
      </span>
    );
  }

  if (device.status === "ACTIVE") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
        <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
        Monitoring Active
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 font-mono text-xs font-semibold text-red-500">
      <span className="h-2 w-2 rounded-full bg-red-500" />
      Node Offline
    </span>
  );
}

function SensorAnalyticsContent() {
  const params = useParams();
  const groupSlug = typeof params?.groupName === "string" ? params.groupName : "";
  const sensorId = typeof params?.sensorId === "string" ? params.sensorId : "";

  const { ready, groups, devices, alerts, submitAlertFeedback, resolveAlert, getTelemetryWithBounds } = useSentrix();

  if (!ready) {
    return (
      <p className="py-24 text-center font-mono text-xs text-[var(--text-muted)]">
        Loading sensor analytics…
      </p>
    );
  }

  const group = groups.find((g) => g.slug === groupSlug);
  const device = devices.find((d) => d.id === sensorId || d.macAddress === sensorId);

  if (!group || !device) {
    return (
      <div className="py-24 text-center">
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">Sensor Not Found</h1>
        <p className="mb-4 mt-1 text-xs text-[var(--text-muted)]">
          Could not locate the requested sensor in this location mesh.
        </p>
        <Link
          href={group ? `/dashboard/${group.slug}` : "/dashboard"}
          className="text-xs text-amber-600 hover:text-amber-500 dark:text-amber-400"
        >
          ← Return to {group ? group.name : "Dashboard"}
        </Link>
      </div>
    );
  }

  // Get current 24h telemetry to pull expected bounds
  const telemetry = getTelemetryWithBounds(device.id, "24h");
  const latestTelemetry = telemetry[telemetry.length - 1];
  const expectedMin = latestTelemetry?.lowerBound ?? (device.liveRmsAmps > 0 ? (device.liveRmsAmps * 0.88).toFixed(2) : "0.00");
  const expectedMax = latestTelemetry?.upperBound ?? (device.liveRmsAmps > 0 ? (device.liveRmsAmps * 1.12).toFixed(2) : "0.00");

  // Local Alerts for this sensor
  const localAlerts = alerts
    .filter((a) => a.deviceId === device.id)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return (
    <div className="space-y-6">
      {/* 1. Header & Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
        <Link href="/dashboard" className="transition hover:text-[var(--text-primary)]">
          Dashboard
        </Link>
        <span>/</span>
        <Link href={`/dashboard/${group.slug}`} className="transition hover:text-[var(--text-primary)]">
          {group.name}
        </Link>
        <span>/</span>
        <span className="font-medium text-[var(--text-primary)]">{device.name}</span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border)] pb-6">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
              {device.name}
            </h1>
            <span className="rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 font-mono text-[11px] text-[var(--text-muted)]">
              {device.macAddress}
            </span>
            <DynamicSensorStatusBadge device={device} />
          </div>
          <p className="mt-2 text-xs text-[var(--text-muted)] sm:text-sm">
            Monitored AC branch breaker on <span className="text-[var(--text-secondary)] font-medium">{group.name}</span> (MESH {group.meshId}).
          </p>
        </div>

        <Link
          href={`/dashboard/${group.slug}`}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-xs font-medium text-[var(--text-secondary)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
        >
          ← Back to {group.name}
        </Link>
      </div>

      {/* 2. Live Metric Cards Section */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Live RMS Current Card */}
        <div className="surface-card rounded-xl border border-[var(--border)] p-5">
          <p className="eyebrow">Real-Time RMS Current</p>
          <div className="mt-2 flex items-baseline gap-2 font-mono">
            <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-primary)]">
              {device.liveRmsAmps > 0 ? device.liveRmsAmps.toFixed(2) : "0.00"}
            </span>
            <span className="text-base text-amber-500 font-semibold">Amps</span>
          </div>
          <p className="mt-2 font-mono text-[10px] text-[var(--text-muted)]">
            Continuous electrical root-mean-square current draw
          </p>
        </div>

        {/* Target AC Temperature Setpoint */}
        <div className="surface-card rounded-xl border border-[var(--border)] p-5">
          <p className="eyebrow">Target AC Setpoint</p>
          <div className="mt-2 flex items-baseline gap-2 font-mono">
            <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-amber-600 dark:text-amber-400">
              {device.targetTempC}
            </span>
            <span className="text-base text-[var(--text-secondary)]">°C</span>
          </div>
          <p className="mt-2 font-mono text-[10px] text-[var(--text-muted)]">
            Thermostat control setpoint for this cooling circuit
          </p>
        </div>

        {/* Expected ARIMA Range */}
        <div className="surface-card rounded-xl border border-[var(--border)] p-5">
          <p className="eyebrow">Expected Auto-ARIMA Range</p>
          <div className="mt-2 flex items-baseline gap-2 font-mono">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {expectedMin} – {expectedMax}
            </span>
            <span className="text-xs text-[var(--text-muted)]">A</span>
          </div>
          <p className="mt-2 font-mono text-[10px] text-[var(--text-muted)]">
            95% Confidence interval computed dynamically from diurnal load
          </p>
        </div>
      </div>

      {/* 3. Node Analytics Chart (Core Feature - Recharts) */}
      <TelemetryChart deviceId={device.id} />

      {/* 4. Local Alert Mini-Feed */}
      <section aria-label="Local Sensor Anomalies" className="surface-card rounded-xl border border-[var(--border)] p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="eyebrow">Anomaly History for this Sensor</h3>
            <span className="rounded-md border border-[var(--border)] px-1.5 py-0.5 font-mono text-[9px] text-[var(--text-muted)]">
              {localAlerts.length.toString().padStart(2, "0")} RECORDED
            </span>
          </div>
          <Link
            href="/alerts"
            className="text-xs font-medium text-amber-600 dark:text-amber-400 hover:text-amber-500 transition"
          >
            Open Global Alert Logs →
          </Link>
        </div>

        {localAlerts.length === 0 ? (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--canvas)] p-8 text-center text-xs text-[var(--text-muted)]">
            No historical anomalies recorded for this MCB breaker. Circuit operating within baseline parameters.
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)] rounded-lg border border-[var(--border)] bg-[var(--canvas)]">
            {localAlerts.map((alert) => (
              <div key={alert.id} className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-mono text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wider ${
                        alert.severity === "CRITICAL"
                          ? "bg-red-500/15 text-red-500 border border-red-500/30"
                          : "bg-amber-500/15 text-amber-500 border border-amber-500/30"
                      }`}
                    >
                      {alert.severity}
                    </span>
                    <time className="font-mono text-[10px] text-[var(--text-muted)]">
                      {new Date(alert.timestamp).toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </time>
                    {alert.isResolved && (
                      <span className="font-mono text-[9px] text-emerald-500 font-semibold">
                        ✓ Resolved
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-primary)] font-mono">
                    Measured Draw: <strong className="text-red-500">{alert.actualValue.toFixed(2)} A</strong> (Threshold: {alert.expectedMin.toFixed(2)} – {alert.expectedMax.toFixed(2)} A)
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {alert.userFeedback !== null ? (
                    <span className="font-mono text-[10px] text-[var(--text-muted)]">
                      Feedback: {alert.userFeedback ? "✓ Valid Issue" : "✕ False Alarm"}
                    </span>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => submitAlertFeedback(alert.id, true)}
                        className="rounded border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-[10px] font-medium text-[var(--text-secondary)] hover:text-emerald-500 hover:border-emerald-500/40"
                      >
                        Valid Issue
                      </button>
                      <button
                        type="button"
                        onClick={() => submitAlertFeedback(alert.id, false)}
                        className="rounded border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-[10px] font-medium text-[var(--text-secondary)] hover:text-amber-500 hover:border-amber-500/40"
                      >
                        False Alarm
                      </button>
                    </>
                  )}
                  {!alert.isResolved && (
                    <button
                      type="button"
                      onClick={() => resolveAlert(alert.id)}
                      className="rounded bg-amber-500 px-2.5 py-1 font-mono text-[10px] font-semibold text-[#20170a] hover:bg-amber-400"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default function SensorDetailPage() {
  return (
    <Suspense
      fallback={
        <p className="py-24 text-center font-mono text-xs text-[var(--text-muted)]">
          Loading sensor analytics…
        </p>
      }
    >
      <SensorAnalyticsContent />
    </Suspense>
  );
}
