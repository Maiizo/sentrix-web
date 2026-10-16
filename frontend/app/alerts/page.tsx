"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { AppShell } from "../components/app-shell";
import {
  useSentrix,
  type AlertSeverity,
} from "../lib/sentrix-store";

type DateFilter = "all" | "24h" | "7d";
type SeverityFilter = "all" | AlertSeverity;
type StatusFilter = "all" | "unresolved" | "resolved";

function formatRelativeTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function formatExactDate(isoString: string): string {
  return new Date(isoString).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AlertsContent() {
  const {
    ready,
    alerts,
    devices,
    groups,
    submitAlertFeedback,
    resolveAlert,
    dispatchMaintenance,
    simulateNewAnomaly,
  } = useSentrix();

  // 4 Top-bar Filter Controls
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("unresolved");

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  function triggerSimulateAnomaly() {
    // Request notification permission if not yet decided
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      Notification.requestPermission();
    }

    const newAlert = simulateNewAnomaly();
    const dev = devices.find((d) => d.id === newAlert.deviceId);
    showToast(
      `CRITICAL Anomaly simulated on ${dev?.name ?? "AC Circuit"} (${newAlert.actualValue} A)!`,
    );
  }

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 4000);
  }

  // Filtered Alert List
  const filteredAlerts = useMemo(() => {
    const now = Date.now();
    return alerts
      .filter((alert) => {
        // 1. Date Filter
        if (dateFilter === "24h") {
          const age = now - new Date(alert.timestamp).getTime();
          if (age > 24 * 3_600_000) return false;
        } else if (dateFilter === "7d") {
          const age = now - new Date(alert.timestamp).getTime();
          if (age > 7 * 24 * 3_600_000) return false;
        }

        // 2. Group Filter
        if (groupFilter !== "all" && alert.groupId !== groupFilter) {
          return false;
        }

        // 3. Severity Filter
        if (severityFilter !== "all" && alert.severity !== severityFilter) {
          return false;
        }

        // 4. Status Filter
        if (statusFilter === "unresolved" && alert.isResolved) {
          return false;
        }
        if (statusFilter === "resolved" && !alert.isResolved) {
          return false;
        }

        return true;
      })
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [alerts, dateFilter, groupFilter, severityFilter, statusFilter]);

  const unresolvedCount = alerts.filter((a) => !a.isResolved).length;

  if (!ready) {
    return (
      <AppShell>
        <p className="py-24 text-center font-mono text-xs text-[var(--text-muted)]">
          Loading anomaly telemetry…
        </p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <p className="eyebrow">Reinforcement Learning · Auto-ARIMA</p>
              {unresolvedCount > 0 && (
                <span className="inline-flex items-center rounded-full bg-red-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-red-500 ring-1 ring-inset ring-red-500/20">
                  {unresolvedCount} Unresolved
                </span>
              )}
            </div>
            <h1 className="text-xl font-semibold tracking-[-0.045em] text-[var(--text-primary)] sm:text-2xl">
              Equipment Anomaly Feed
            </h1>
            <p className="mt-1 text-xs text-[var(--text-secondary)] sm:text-sm">
              Global chronological feed for human-in-the-loop validation, model retuning, and rapid field maintenance.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              id="simulate-anomaly-btn"
              onClick={triggerSimulateAnomaly}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-3.5 py-2 text-xs font-semibold text-[#20170a] shadow-sm shadow-amber-500/20 transition hover:bg-amber-400"
            >
              <span className="flex h-2 w-2 rounded-full bg-red-600 animate-pulse" />
              ⚡ Simulate New Anomaly
            </button>
          </div>
        </div>

        {/* Transient Notification Toast */}
        {toastMessage && (
          <div className="flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 font-mono text-xs text-amber-500 shadow-lg animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <span>🔔</span>
              <span>{toastMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="text-amber-500/70 hover:text-amber-500 text-sm font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* 4 Top-bar Filter Controls */}
        <div className="surface-card rounded-2xl border border-[var(--border)] p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Filter 1: Date */}
            <div>
              <label
                htmlFor="filter-date"
                className="mb-1 block font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]"
              >
                Time Range
              </label>
              <select
                id="filter-date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--canvas)] px-3 py-2 text-xs text-[var(--text-primary)] focus:border-amber-500 focus:outline-none"
              >
                <option value="all">All Dates</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
              </select>
            </div>

            {/* Filter 2: Group */}
            <div>
              <label
                htmlFor="filter-group"
                className="mb-1 block font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]"
              >
                Facility Group
              </label>
              <select
                id="filter-group"
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--canvas)] px-3 py-2 text-xs text-[var(--text-primary)] focus:border-amber-500 focus:outline-none"
              >
                <option value="all">All Groups ({groups.length})</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter 3: Severity */}
            <div>
              <label
                htmlFor="filter-severity"
                className="mb-1 block font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]"
              >
                Severity Level
              </label>
              <select
                id="filter-severity"
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value as SeverityFilter)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--canvas)] px-3 py-2 text-xs text-[var(--text-primary)] focus:border-amber-500 focus:outline-none"
              >
                <option value="all">All Severities</option>
                <option value="WARNING">WARNING Only</option>
                <option value="CRITICAL">CRITICAL Only</option>
              </select>
            </div>

            {/* Filter 4: Status */}
            <div>
              <label
                htmlFor="filter-status"
                className="mb-1 block font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]"
              >
                Resolution Status
              </label>
              <select
                id="filter-status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--canvas)] px-3 py-2 text-xs text-[var(--text-primary)] focus:border-amber-500 focus:outline-none"
              >
                <option value="unresolved">Unresolved Active Alerts</option>
                <option value="resolved">Resolved History</option>
                <option value="all">All Statuses</option>
              </select>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-[var(--border)] pt-3 text-[11px] text-[var(--text-muted)] font-mono">
            <span>
              Showing {filteredAlerts.length} of {alerts.length} total alerts
            </span>
            {(dateFilter !== "all" ||
              groupFilter !== "all" ||
              severityFilter !== "all" ||
              statusFilter !== "unresolved") && (
              <button
                type="button"
                onClick={() => {
                  setDateFilter("all");
                  setGroupFilter("all");
                  setSeverityFilter("all");
                  setStatusFilter("all");
                }}
                className="text-amber-500 hover:underline"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Chronological Alert Feed */}
        {filteredAlerts.length === 0 ? (
          <div className="surface-card rounded-2xl border border-[var(--border)] py-16 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 text-xl font-bold">
              ✓
            </div>
            <h3 className="mt-3 text-sm font-semibold text-[var(--text-primary)]">
              No matching alerts found
            </h3>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              All monitored AC MCB circuits match the current filter parameters.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAlerts.map((alert) => {
              const device = devices.find((d) => d.id === alert.deviceId);
              const group = groups.find((g) => g.id === alert.groupId);

              // Calculate deviation dynamically
              const isOverMax = alert.actualValue > alert.expectedMax;
              const deviationAmps = isOverMax
                ? (alert.actualValue - alert.expectedMax).toFixed(1)
                : (alert.expectedMin - alert.actualValue).toFixed(1);
              const deviationText = isOverMax
                ? `Spiked +${deviationAmps}A above expected bounds (${alert.actualValue}A vs max ${alert.expectedMax}A)`
                : `Dropped -${deviationAmps}A below expected bounds (${alert.actualValue}A vs min ${alert.expectedMin}A)`;

              return (
                <div
                  key={alert.id}
                  className={`surface-card rounded-2xl border transition shadow-sm ${
                    alert.isResolved
                      ? "border-[var(--border)] opacity-85"
                      : alert.severity === "CRITICAL"
                        ? "border-red-500/30 hover:border-red-500/50"
                        : "border-amber-500/30 hover:border-amber-500/50"
                  }`}
                >
                  <div className="p-5 sm:p-6">
                    {/* Card Top Row: Badges and Timestamps */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
                      <div className="flex items-center gap-2">
                        {/* Severity Badge */}
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-mono text-[10px] font-bold tracking-wider uppercase ${
                            alert.severity === "CRITICAL"
                              ? "bg-red-500/15 text-red-500 border border-red-500/30"
                              : "bg-amber-500/15 text-amber-500 border border-amber-500/30"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              alert.severity === "CRITICAL"
                                ? "bg-red-500 animate-pulse"
                                : "bg-amber-500"
                            }`}
                          />
                          {alert.severity}
                        </span>

                        {/* Status Badge */}
                        <span
                          className={`rounded-md px-2 py-0.5 font-mono text-[10px] font-semibold ${
                            alert.isResolved
                              ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                              : "bg-[var(--surface-hover)] text-[var(--text-muted)] border border-[var(--border)]"
                          }`}
                        >
                          {alert.isResolved ? "✓ Resolved" : "Active"}
                        </span>
                      </div>

                      {/* Timestamp */}
                      <div className="flex items-center gap-2 font-mono text-xs text-[var(--text-muted)]">
                        <span className="text-[var(--text-primary)] font-medium">
                          {formatRelativeTime(alert.timestamp)}
                        </span>
                        <span>·</span>
                        <span>{formatExactDate(alert.timestamp)}</span>
                      </div>
                    </div>

                    {/* Card Middle: Location & Deviation Details */}
                    <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-center">
                      <div className="lg:col-span-7 space-y-1.5">
                        {/* Links to Group and Device */}
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          {group ? (
                            <Link
                              href={`/dashboard/${group.slug}`}
                              className="font-medium text-[var(--text-secondary)] hover:text-amber-500 transition"
                            >
                              📍 {group.name}
                            </Link>
                          ) : (
                            <span className="text-[var(--text-muted)]">Facility Group</span>
                          )}
                          <span className="text-[var(--text-muted)]">/</span>
                          {device && group ? (
                            <Link
                              href={`/dashboard/${group.slug}/${device.id}`}
                              className="font-semibold text-[var(--text-primary)] hover:text-amber-500 transition"
                            >
                              ⚡ {device.name}
                            </Link>
                          ) : (
                            <span className="font-semibold text-[var(--text-primary)]">
                              {device?.name ?? "AC Circuit"}
                            </span>
                          )}
                          {device && (
                            <span className="rounded bg-[var(--surface-hover)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-muted)]">
                              {device.macAddress}
                            </span>
                          )}
                        </div>

                        {/* Deviation Description */}
                        <p className="font-mono text-sm font-medium text-[var(--text-primary)]">
                          {deviationText}
                        </p>

                        <p className="text-xs text-[var(--text-secondary)]">
                          Auto-ARIMA 95% Confidence Interval bounds breached during real-time RMS monitoring cycle.
                        </p>
                      </div>

                      {/* Current vs Bounds Metric Box */}
                      <div className="lg:col-span-5 flex items-center justify-start lg:justify-end gap-3 rounded-xl border border-[var(--border)] bg-[var(--canvas)] p-3">
                        <div className="text-left">
                          <p className="font-mono text-[9px] uppercase tracking-wider text-[var(--text-muted)]">
                            Measured Current
                          </p>
                          <p
                            className={`font-mono text-lg font-bold ${
                              alert.severity === "CRITICAL" ? "text-red-500" : "text-amber-500"
                            }`}
                          >
                            {alert.actualValue.toFixed(2)} A
                          </p>
                        </div>
                        <div className="h-8 w-px bg-[var(--border)]" />
                        <div className="text-left">
                          <p className="font-mono text-[9px] uppercase tracking-wider text-[var(--text-muted)]">
                            Expected Safe Range
                          </p>
                          <p className="font-mono text-xs font-semibold text-[var(--text-secondary)]">
                            {alert.expectedMin.toFixed(1)} A – {alert.expectedMax.toFixed(1)} A
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Card Bottom: Human-in-the-Loop Reinforcement Learning & Actions */}
                    <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--border)] pt-4">
                      {/* Reinforcement Learning UI */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                          Operator Validation:
                        </span>

                        {alert.userFeedback === null ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => submitAlertFeedback(alert.id, true)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 font-mono text-xs font-semibold text-emerald-500 hover:bg-emerald-500/20 transition"
                            >
                              <span>👍</span>
                              <span>True Anomaly (Check)</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => submitAlertFeedback(alert.id, false)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--canvas)] px-3 py-1.5 font-mono text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-red-400 transition"
                            >
                              <span>👎</span>
                              <span>False Alarm (X)</span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-mono text-xs font-semibold ${
                                alert.userFeedback === true
                                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                  : "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                              }`}
                            >
                              {alert.userFeedback === true ? "✓ Feedback recorded: True Positive" : "✗ Feedback recorded: False Positive"}
                            </span>
                            <button
                              type="button"
                              onClick={() => submitAlertFeedback(alert.id, !alert.userFeedback)}
                              className="font-mono text-[10px] text-[var(--text-muted)] hover:text-amber-500 underline"
                            >
                              Change
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Maintenance Dispatch Button */}
                        {alert.dispatchedAt ? (
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 font-mono text-xs text-amber-500">
                            <span>🛠️</span>
                            <span>Dispatched {formatRelativeTime(alert.dispatchedAt)}</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              dispatchMaintenance(alert.id);
                              showToast(`Maintenance dispatched for ${device?.name ?? "circuit"}!`);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:border-amber-500 hover:text-[var(--text-primary)] transition"
                          >
                            <span>🛠️</span>
                            <span>Dispatch Maintenance</span>
                          </button>
                        )}

                        {/* Mark as Resolved Button */}
                        {!alert.isResolved ? (
                          <button
                            type="button"
                            onClick={() => {
                              resolveAlert(alert.id);
                              showToast(`Alert #${alert.id.slice(-4)} marked as resolved.`);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--surface-hover)] border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] hover:border-emerald-500 hover:text-emerald-500 transition"
                          >
                            <span>✓</span>
                            <span>Mark as Resolved</span>
                          </button>
                        ) : (
                          <span className="font-mono text-xs text-emerald-500/80">
                            Resolved
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function AlertsPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <p className="py-24 text-center font-mono text-xs text-[var(--text-muted)]">
            Loading equipment anomalies…
          </p>
        </AppShell>
      }
    >
      <AlertsContent />
    </Suspense>
  );
}
