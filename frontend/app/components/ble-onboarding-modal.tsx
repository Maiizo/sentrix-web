"use client";

import { useRef, useState, type FormEvent, type ReactNode } from "react";

const SENTRIX_SERVICE_UUID = "12345678-1234-5678-1234-56789abcdef0";
const PROVISION_CHARACTERISTIC_UUID = "87654321-4321-8765-4321-0fedcba98765";
const WIFI_SSID_STORAGE_KEY = "sentrix-wifi-ssid";
const NEW_GROUP = "__new__";

const STEPS = ["Scan", "Hardware", "PIN", "Wi-Fi", "Provision"] as const;

type Step = 1 | 2 | 3 | 4 | 5;
type TransmitPhase = "sending" | "success" | "error";

export type AcGroup = { name: string; meshId?: string };

export type OnboardedAc = {
  name: string;
  group: string;
  macAddress: string;
  meshId: string;
  targetTemp: number;
  transport: "ble" | "simulated";
};

function randomHex(bytes: number) {
  return Array.from(crypto.getRandomValues(new Uint8Array(bytes)), (byte) =>
    byte.toString(16).padStart(2, "0"),
  )
    .join("")
    .toUpperCase();
}

/** Pull a 12-hex MAC out of a BLE advertised name (e.g. "SENTRIX-AA:BB:CC:DD:EE:FF"). */
function macFromBleDevice(device: BluetoothDevice) {
  const match = device.name?.match(/([0-9A-F]{2}[:-]?){5}[0-9A-F]{2}/i);
  if (match) return match[0].replace(/[:-]/g, "").toUpperCase();
  return (device.name || device.id).toUpperCase();
}

function describeBleError(error: unknown) {
  if (error instanceof DOMException) {
    switch (error.name) {
      case "NotFoundError":
        return "No device selected. Make sure the AC node is powered and in pairing mode, then scan again.";
      case "SecurityError":
        return "Bluetooth access was blocked. Web Bluetooth requires HTTPS (or localhost) and a user click.";
      case "NotAllowedError":
        return "Bluetooth permission was denied by the browser or OS.";
      case "NetworkError":
        return "Lost connection to the device. Move closer to the AC node and retry.";
      case "NotSupportedError":
        return "The device does not expose the Sentrix provisioning service.";
    }
  }
  return error instanceof Error ? error.message : "Unexpected Bluetooth error.";
}

const inputClass =
  "w-full rounded-lg border border-[var(--border)] bg-[var(--canvas)] px-3 py-2.5 text-sm outline-none placeholder:text-[var(--text-muted)] focus:border-amber-500 disabled:opacity-60";
const labelClass = "mb-1.5 block text-xs font-medium text-[var(--text-secondary)]";
const primaryButton =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-3.5 py-2 text-xs font-semibold text-[#20170a] transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50";
const secondaryButton =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--border)] px-3.5 py-2 text-xs font-medium text-[var(--text-secondary)] transition hover:bg-[var(--surface-hover)] disabled:cursor-not-allowed disabled:opacity-50";

export function BleOnboardingModal({
  groups,
  onClose,
  onComplete,
}: {
  groups: AcGroup[];
  onClose: () => void;
  onComplete: (ac: OnboardedAc) => void;
}) {
  const step1Form = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState<Step>(1);
  const [error, setError] = useState("");

  // Step 1 — group & mesh
  const [groupChoice, setGroupChoice] = useState(groups[0]?.name ?? NEW_GROUP);
  const [newGroupName, setNewGroupName] = useState("");
  const [generatedMeshId, setGeneratedMeshId] = useState(() => randomHex(6));
  const [scanning, setScanning] = useState(false);

  // Step 2 — hardware
  const [bleDevice, setBleDevice] = useState<BluetoothDevice | null>(null);
  const [macAddress, setMacAddress] = useState("");
  const [acName, setAcName] = useState("");
  const [targetTemp, setTargetTemp] = useState("22");

  // Step 3 / 4 — credentials
  const [pin, setPin] = useState("");
  const [ssid, setSsid] = useState(() => {
    try {
      return localStorage.getItem(WIFI_SSID_STORAGE_KEY) ?? "";
    } catch {
      return "";
    }
  });
  const [password, setPassword] = useState("");

  // Step 5 — transmission
  const [phase, setPhase] = useState<TransmitPhase>("sending");

  const groupName = groupChoice === NEW_GROUP ? newGroupName.trim() : groupChoice;
  const sharedMeshId = groups.find((group) => group.name === groupName)?.meshId;
  const meshId = sharedMeshId ?? generatedMeshId;
  const busy = scanning || (step === 5 && phase === "sending");

  function goTo(next: Step) {
    setError("");
    setStep(next);
  }

  async function scanBle() {
    if (!step1Form.current?.reportValidity()) return;
    setError("");
    if (typeof navigator === "undefined" || !("bluetooth" in navigator)) {
      setError(
        "Web Bluetooth isn't available in this browser. Use Chrome or Edge on desktop/Android, or try Simulate Scan.",
      );
      return;
    }
    setScanning(true);
    try {
      // Must run directly inside the click handler (user-gesture requirement).
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [SENTRIX_SERVICE_UUID] }],
      });
      setBleDevice(device);
      setMacAddress(macFromBleDevice(device));
      goTo(2);
    } catch (scanError) {
      setError(describeBleError(scanError));
    } finally {
      setScanning(false);
    }
  }

  async function simulateScan() {
    if (!step1Form.current?.reportValidity()) return;
    setError("");
    setScanning(true);
    await new Promise((resolve) => window.setTimeout(resolve, 900));
    setBleDevice(null);
    setMacAddress(randomHex(6));
    setScanning(false);
    goTo(2);
  }

  async function transmit() {
    setPhase("sending");
    setError("");
    const payload = JSON.stringify({ ssid, password, pin, mesh_id: meshId });

    try {
      if (bleDevice) {
        if (!bleDevice.gatt) throw new Error("This device has no GATT server.");
        const server = await bleDevice.gatt.connect();
        try {
          const service = await server.getPrimaryService(SENTRIX_SERVICE_UUID);
          const characteristic = await service.getCharacteristic(
            PROVISION_CHARACTERISTIC_UUID,
          );
          await characteristic.writeValueWithResponse(new TextEncoder().encode(payload));
        } finally {
          server.disconnect();
        }
      } else {
        await new Promise((resolve) => window.setTimeout(resolve, 1400));
      }

      onComplete({
        name: acName.trim(),
        group: groupName,
        macAddress,
        meshId,
        targetTemp: Number(targetTemp),
        transport: bleDevice ? "ble" : "simulated",
      });
      setPhase("success");
    } catch (transmitError) {
      setError(describeBleError(transmitError));
      setPhase("error");
    }
  }

  function submitStep(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step === 2) goTo(3);
    else if (step === 3) goTo(4);
    else if (step === 4) {
      try {
        localStorage.setItem(WIFI_SSID_STORAGE_KEY, ssid.trim());
      } catch {
        // Storage may be disabled; SSID autofill is a convenience only.
      }
      goTo(5);
      void transmit();
    }
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ble-onboarding-title"
        className="surface-card w-full max-w-md rounded-2xl border border-[var(--border)] p-5 shadow-2xl sm:p-6"
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <p className="eyebrow">Bluetooth onboarding</p>
            <h2 id="ble-onboarding-title" className="mt-1 text-lg font-semibold tracking-tight">
              Add an AC unit
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-hover)] disabled:opacity-40"
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
              <path d="m18 6-12 12M6 6l12 12" />
            </svg>
          </button>
        </div>

        <ol className="mb-6 grid grid-cols-5 gap-1.5" aria-label="Onboarding progress">
          {STEPS.map((label, index) => {
            const number = index + 1;
            const state = number < step || (number === 5 && phase === "success" && step === 5)
              ? "done"
              : number === step
                ? "current"
                : "todo";
            return (
              <li key={label} aria-current={state === "current" ? "step" : undefined}>
                <span
                  className={`block h-1 rounded-full transition-colors duration-300 ${
                    state === "todo" ? "bg-[var(--border)]" : "bg-amber-500"
                  } ${state === "current" ? "animate-pulse" : ""}`}
                />
                <span
                  className={`mt-1.5 block font-mono text-[9px] tracking-wider ${
                    state === "todo" ? "text-[var(--text-muted)]" : "text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {number}. {label}
                </span>
              </li>
            );
          })}
        </ol>

        {step === 1 && (
          <form ref={step1Form} onSubmit={(event) => event.preventDefault()}>
            <label className="mb-4 block">
              <span className={labelClass}>AC group / location</span>
              <select
                id="ble-group-select"
                value={groupChoice}
                onChange={(event) => setGroupChoice(event.target.value)}
                disabled={scanning}
                className={inputClass}
              >
                {groups.map((group) => (
                  <option key={group.name} value={group.name}>
                    {group.name}
                  </option>
                ))}
                <option value={NEW_GROUP}>+ New group…</option>
              </select>
            </label>
            {groupChoice === NEW_GROUP && (
              <label className="mb-4 block">
                <span className={labelClass}>New group name</span>
                <input
                  id="ble-new-group"
                  autoFocus
                  required
                  value={newGroupName}
                  onChange={(event) => setNewGroupName(event.target.value)}
                  disabled={scanning}
                  placeholder="e.g. East wing · Server room"
                  className={inputClass}
                />
              </label>
            )}
            <div className="mb-5 flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--canvas)] px-3 py-2.5">
              <div className="min-w-0">
                <p className="eyebrow">Mesh ID</p>
                <p className="mt-1 font-mono text-sm tracking-wider">{meshId}</p>
                <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">
                  {sharedMeshId ? "Shared with existing units in this group" : "New mesh for this group"}
                </p>
              </div>
              {!sharedMeshId && (
                <button
                  type="button"
                  onClick={() => setGeneratedMeshId(randomHex(6))}
                  disabled={scanning}
                  className="shrink-0 font-mono text-[10px] uppercase tracking-wide text-[var(--text-muted)] underline underline-offset-4 hover:text-[var(--text-primary)]"
                >
                  Regenerate
                </button>
              )}
            </div>
            <ErrorText message={error} />
            <div className="grid gap-2">
              <button id="ble-scan-button" type="button" onClick={scanBle} disabled={scanning} className={primaryButton}>
                {scanning ? <Spinner /> : <BluetoothGlyph />}
                {scanning ? "Scanning…" : "Scan via Bluetooth (BLE)"}
              </button>
              <button id="ble-simulate-button" type="button" onClick={simulateScan} disabled={scanning} className={secondaryButton}>
                Simulate Scan (Demo Mode)
              </button>
            </div>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={submitStep}>
            <div className="mb-4 flex items-center justify-between rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] px-3 py-2.5">
              <div>
                <p className="eyebrow">Discovered hardware</p>
                <p className="mt-1 font-mono text-sm tracking-wider">{macAddress}</p>
              </div>
              <span className="rounded border border-[var(--border)] px-1.5 py-0.5 font-mono text-[9px] tracking-widest text-[var(--text-muted)]">
                {bleDevice ? "BLE" : "DEMO"}
              </span>
            </div>
            <label className="mb-4 block">
              <span className={labelClass}>AC unit name</span>
              <input
                id="ble-ac-name"
                autoFocus
                required
                value={acName}
                onChange={(event) => setAcName(event.target.value)}
                placeholder="e.g. Server Room Split AC 02"
                className={inputClass}
              />
            </label>
            <label className="mb-6 block">
              <span className={labelClass}>Target temperature setpoint</span>
              <div className="flex">
                <input
                  id="ble-target-temp"
                  required
                  type="number"
                  min={16}
                  max={30}
                  step={1}
                  value={targetTemp}
                  onChange={(event) => setTargetTemp(event.target.value)}
                  className={`${inputClass} rounded-r-none border-r-0 font-mono`}
                />
                <span className="flex items-center rounded-r-lg border border-[var(--border)] bg-[var(--surface-hover)] px-3 font-mono text-xs text-[var(--text-muted)]">
                  °C
                </span>
              </div>
            </label>
            <StepActions onBack={() => goTo(1)} submitLabel="Continue" />
          </form>
        )}

        {step === 3 && (
          <form onSubmit={submitStep}>
            <label className="mb-6 block">
              <span className={labelClass}>6-digit hardware PIN</span>
              <input
                id="ble-pin"
                autoFocus
                required
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="\d{6}"
                maxLength={6}
                title="Enter the 6-digit PIN printed on the device sticker"
                value={pin}
                onChange={(event) => setPin(event.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className={`${inputClass} text-center font-mono text-xl tracking-[0.5em]`}
              />
              <span className="mt-1.5 block text-[10px] text-[var(--text-muted)]">
                Printed on the sticker on the Sentrix sensor housing.
              </span>
            </label>
            <StepActions onBack={() => goTo(2)} submitLabel="Verify PIN" />
          </form>
        )}

        {step === 4 && (
          <form onSubmit={submitStep}>
            <label className="mb-4 block">
              <span className={labelClass}>Building Wi-Fi SSID</span>
              <input
                id="ble-wifi-ssid"
                autoFocus
                required
                value={ssid}
                onChange={(event) => setSsid(event.target.value)}
                placeholder="e.g. Facility-IoT"
                className={inputClass}
              />
            </label>
            <label className="mb-6 block">
              <span className={labelClass}>Wi-Fi password</span>
              <input
                id="ble-wifi-password"
                type="password"
                autoComplete="off"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Leave blank for open networks"
                className={inputClass}
              />
              <span className="mt-1.5 block text-[10px] text-[var(--text-muted)]">
                Sent directly to the device over Bluetooth. Only the SSID is remembered in this browser.
              </span>
            </label>
            <StepActions onBack={() => goTo(3)} submitLabel={bleDevice ? "Send to device" : "Send (demo)"} />
          </form>
        )}

        {step === 5 && (
          <div className="text-center">
            {phase === "sending" && (
              <StatusBlock
                icon={<Spinner className="h-6 w-6" />}
                tone="amber"
                title={bleDevice ? "Provisioning over Bluetooth…" : "Simulating provisioning…"}
                body="Writing Wi-Fi credentials, PIN and mesh ID to the AC node. Keep this window open."
              />
            )}
            {phase === "error" && (
              <>
                <StatusBlock icon="!" tone="red" title="Provisioning failed" body={error} />
                <div className="mt-6 flex justify-center gap-2">
                  <button type="button" onClick={() => goTo(4)} className={secondaryButton}>
                    Back
                  </button>
                  <button type="button" onClick={() => void transmit()} className={primaryButton}>
                    Retry
                  </button>
                </div>
              </>
            )}
            {phase === "success" && (
              <>
                <StatusBlock
                  icon="✓"
                  tone="emerald"
                  title={`${acName.trim()} is calibrating`}
                  body="The node is joining Wi-Fi and has started its baseline calibration (day 1). Anomaly alerts unlock once calibration completes."
                />
                <dl className="mt-5 space-y-2 rounded-lg border border-[var(--border)] bg-[var(--canvas)] p-3 text-left">
                  {[
                    ["Group", groupName],
                    ["MAC", macAddress],
                    ["Mesh ID", meshId],
                    ["Setpoint", `${targetTemp} °C`],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between gap-3">
                      <dt className="eyebrow text-[8px]">{label}</dt>
                      <dd className="truncate font-mono text-[10px] text-[var(--text-secondary)]">{value}</dd>
                    </div>
                  ))}
                </dl>
                <button id="ble-done-button" type="button" onClick={onClose} className={`${primaryButton} mt-6 w-full`}>
                  Done
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StepActions({ onBack, submitLabel }: { onBack: () => void; submitLabel: string }) {
  return (
    <div className="flex justify-between gap-2">
      <button type="button" onClick={onBack} className={secondaryButton}>
        Back
      </button>
      <button type="submit" className={primaryButton}>
        {submitLabel}
      </button>
    </div>
  );
}

function ErrorText({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="mb-4 rounded-lg border border-red-500/20 bg-red-500/[0.06] px-3 py-2 text-[11px] leading-5 text-red-500">
      {message}
    </p>
  );
}

function StatusBlock({
  icon,
  tone,
  title,
  body,
}: {
  icon: ReactNode;
  tone: "amber" | "red" | "emerald";
  title: string;
  body: string;
}) {
  const tones = {
    amber: "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    red: "border-red-500/20 bg-red-500/10 text-red-500",
    emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  };
  return (
    <div className="py-2" aria-live="polite">
      <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full border text-xl ${tones[tone]}`}>
        {icon}
      </div>
      <h3 className="mt-4 text-sm font-semibold">{title}</h3>
      <p className="mx-auto mt-1.5 max-w-xs text-[11px] leading-5 text-[var(--text-muted)]">{body}</p>
    </div>
  );
}

function Spinner({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={`${className} animate-spin`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function BluetoothGlyph() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m7 7 10 10-5 5V2l5 5L7 17" />
    </svg>
  );
}
