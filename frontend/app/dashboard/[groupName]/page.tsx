"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import { useSentrix, type Device } from "../../lib/sentrix-store";
import { BleOnboardingModal } from "./ble-onboarding-modal";

function getCalibrationDay(startedAt: string): number {
  const diffMs = Math.max(0, Date.now() - new Date(startedAt).getTime());
  const day = Math.floor(diffMs / (24 * 60 * 60 * 1000)) + 1;
  return Math.max(1, Math.min(7, day));
}

function StatusBadge({ device }: { device: Device }) {
  if (device.status === "ACTIVE") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold tracking-wider text-emerald-600 dark:text-emerald-400">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
        Online
      </span>
    );
  }

  if (device.status === "CALIBRATING") {
    const day = getCalibrationDay(device.calibrationStartedAt);
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold tracking-wider text-amber-600 dark:text-amber-400">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
        Calibrating (Day {day}/7)
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-hover)] px-2.5 py-0.5 font-mono text-[10px] font-semibold tracking-wider text-[var(--text-muted)]">
      <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" />
      Offline
    </span>
  );
}

function LocationDetailContent() {
  const router = useRouter();
  const params = useParams();
  const groupSlug = typeof params?.groupName === "string" ? params.groupName : "";
  const { ready, groups, devices, deleteGroup, deleteDevice } = useSentrix();
  const [showBleModal, setShowBleModal] = useState(false);

  if (!ready) {
    return (
      <p className="py-24 text-center font-mono text-xs text-[var(--text-muted)]">
        Loading location mesh…
      </p>
    );
  }

  const group = groups.find((g) => g.slug === groupSlug);

  if (!group) {
    return (
      <div className="py-24 text-center">
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">Location Not Found</h1>
        <p className="mb-4 mt-1 text-xs text-[var(--text-muted)]">
          No location group found matching “{groupSlug}”.
        </p>
        <Link
          href="/dashboard"
          className="text-xs text-amber-600 hover:text-amber-500 dark:text-amber-400"
        >
          ← Return to Global Overview
        </Link>
      </div>
    );
  }

  const groupDevices = devices.filter((d) => d.groupId === group.id);
  const activeCount = groupDevices.filter((d) => d.status === "ACTIVE").length;
  const isMeshHealthy = groupDevices.length > 0 && activeCount > 0;

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
        <Link href="/dashboard" className="transition hover:text-[var(--text-primary)]">
          Dashboard
        </Link>
        <span>/</span>
        <span className="font-medium text-[var(--text-primary)]">{group.name}</span>
      </nav>

      {/* Header Section */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border)] pb-6">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
              {group.name}
            </h1>
            <span className="rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 font-mono text-[10px] tracking-wider text-[var(--text-secondary)]">
              MESH {group.meshId}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-medium tracking-wide ${
                isMeshHealthy
                  ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isMeshHealthy ? "bg-emerald-500 shadow-[0_0_6px_#10b981]" : "bg-amber-500"
                }`}
              />
              {isMeshHealthy ? "Mesh Healthy · Root Online" : "Mesh Initializing · Root Awaiting Devices"}
            </span>
          </div>
          {group.description && (
            <p className="mt-2 text-xs text-[var(--text-muted)] sm:text-sm max-w-2xl leading-relaxed">
              {group.description}
            </p>
          )}
        </div>

        {/* Primary CTAs */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            id="delete-group-button"
            onClick={() => {
              if (confirm(`Are you sure you want to delete the group "${group.name}" and all ${groupDevices.length} connected device(s)?`)) {
                deleteGroup(group.id);
                router.push("/dashboard");
              }
            }}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 text-xs font-medium text-red-500 transition hover:bg-red-500/20"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
            Delete Group
          </button>
          <button
            type="button"
            id="add-device-to-group-button"
            onClick={() => setShowBleModal(true)}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-amber-500 px-4 text-xs font-semibold text-[#20170a] shadow-sm shadow-amber-500/20 transition hover:bg-amber-400"
          >
            <span aria-hidden="true" className="text-base font-bold leading-none">+</span>
            Add Device
          </button>
        </div>
      </div>

      {/* Device Inventory Table Section */}
      <section aria-label="Device Inventory" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h2 className="eyebrow">Device Inventory</h2>
            <span className="rounded-md border border-[var(--border)] px-1.5 py-0.5 font-mono text-[9px] text-[var(--text-muted)]">
              {groupDevices.length.toString().padStart(2, "0")} SENSORS
            </span>
          </div>
          <span className="font-mono text-[10px] text-[var(--text-muted)]">
            ESP-Mesh Local Subnet
          </span>
        </div>

        {groupDevices.length === 0 ? (
          <div className="surface-card rounded-xl border border-[var(--border)] p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface-hover)] text-[var(--text-muted)]">
              ⚡
            </div>
            <h3 className="mt-4 text-sm font-semibold text-[var(--text-primary)]">
              No Sensors Connected
            </h3>
            <p className="mt-1 text-xs text-[var(--text-muted)] max-w-sm mx-auto">
              This group has no provisioned circuit sensors. Click below to add a device.
            </p>
            <button
              type="button"
              onClick={() => setShowBleModal(true)}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-amber-500 px-3.5 py-2 text-xs font-semibold text-[#20170a] hover:bg-amber-400"
            >
              + Add First Device
            </button>
          </div>
        ) : (
          <div className="surface-card overflow-hidden rounded-xl border border-[var(--border)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[var(--border)] bg-[var(--surface-hover)] text-[9px] uppercase tracking-wider text-[var(--text-muted)] font-mono">
                  <tr>
                    <th scope="col" className="px-5 py-3 font-medium">Sensor Name</th>
                    <th scope="col" className="px-5 py-3 font-medium">MAC Address</th>
                    <th scope="col" className="px-5 py-3 font-medium">Current Status</th>
                    <th scope="col" className="px-5 py-3 font-medium text-right">Live RMS Current</th>
                    <th scope="col" className="px-5 py-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] font-normal text-[var(--text-secondary)]">
                  {groupDevices.map((device) => (
                    <tr key={device.id} className="transition hover:bg-[var(--surface-hover)]">
                      {/* 1. Sensor Name */}
                      <td className="px-5 py-4">
                        <p className="font-semibold text-[var(--text-primary)]">{device.name}</p>
                        <p className="font-mono text-[10px] text-[var(--text-muted)]">
                          Target AC Temp: <span className="text-amber-600 dark:text-amber-400">{device.targetTempC}°C</span>
                        </p>
                      </td>

                      {/* 2. MAC Address */}
                      <td className="px-5 py-4 font-mono text-[11px] text-[var(--text-muted)]">
                        {device.macAddress}
                      </td>

                      {/* 3. Current Status */}
                      <td className="px-5 py-4">
                        <StatusBadge device={device} />
                      </td>

                      {/* 4. Live RMS Current (Amps) */}
                      <td className="px-5 py-4 text-right font-mono text-sm font-semibold text-[var(--text-primary)]">
                        {device.liveRmsAmps > 0 ? (
                          <>
                            {device.liveRmsAmps.toFixed(2)}
                            <span className="ml-1 text-xs text-[var(--text-muted)] font-normal">A</span>
                          </>
                        ) : (
                          <span className="text-[var(--text-muted)] font-normal">0.00 A</span>
                        )}
                      </td>

                      {/* 5. View Analytics & Delete Action */}
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-3">
                          <Link
                            id={`view-analytics-${device.id}`}
                            href={`/dashboard/${group.slug}/${device.id}`}
                            className="inline-flex items-center gap-1.5 font-medium text-amber-600 dark:text-amber-400 hover:text-amber-500 transition text-xs"
                          >
                            View Analytics
                            <span aria-hidden="true">→</span>
                          </Link>
                          <button
                            type="button"
                            title={`Delete ${device.name}`}
                            aria-label={`Delete ${device.name}`}
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete the device "${device.name}"?`)) {
                                deleteDevice(device.id);
                              }
                            }}
                            className="rounded p-1 text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-500 transition"
                          >
                            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* 5-Step BLE Onboarding Modal */}
      {showBleModal && (
        <BleOnboardingModal group={group} onClose={() => setShowBleModal(false)} />
      )}
    </div>
  );
}

export default function GroupLocationPage() {
  return (
    <Suspense
      fallback={
        <p className="py-24 text-center font-mono text-xs text-[var(--text-muted)]">
          Loading location…
        </p>
      }
    >
      <LocationDetailContent />
    </Suspense>
  );
}
