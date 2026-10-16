"use client";

import { useState } from "react";
import { useSentrix, type Group } from "../../lib/sentrix-store";

const SENTRIX_BLE_SERVICE_UUID = "12345678-1234-5678-1234-56789abcdef0";

type BleDiscoveredDevice = {
  macAddress: string;
  name: string;
  rssi: number;
};

const SIMULATED_DEVICES: BleDiscoveredDevice[] = [
  { macAddress: "24:6F:28:C2:5E:19", name: "Sentrix-AC-Node-19", rssi: -58 },
  { macAddress: "24:6F:28:D4:11:80", name: "Sentrix-AC-Node-80", rssi: -64 },
  { macAddress: "24:6F:28:A9:44:03", name: "Sentrix-AC-Node-03", rssi: -72 },
];

export function BleOnboardingModal({
  group,
  onClose,
}: {
  group: Group;
  onClose: () => void;
}) {
  const { addDeviceToGroup } = useSentrix();

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [discoveredDevices, setDiscoveredDevices] = useState<BleDiscoveredDevice[]>([]);

  // Step 2 Form
  const [selectedMac, setSelectedMac] = useState("");
  const [sensorName, setSensorName] = useState("");
  const [targetTempC, setTargetTempC] = useState<number>(22);

  // Step 3 Form (6-digit PIN)
  const [pinCode, setPinCode] = useState("715204");
  const [pinError, setPinError] = useState("");

  // Step 4 Form (Wi-Fi + Mesh)
  const [wifiSsid, setWifiSsid] = useState(() => {
    if (typeof window === "undefined") return "Sentrix-Facilities-IoT";
    try {
      return localStorage.getItem("sentrix-wifi-ssid") || "Sentrix-Facilities-IoT";
    } catch {
      return "Sentrix-Facilities-IoT";
    }
  });
  const [wifiPassword, setWifiPassword] = useState("");
  const [isProvisioning, setIsProvisioning] = useState(false);

  // Web Bluetooth Scan Handler
  async function handleWebBluetoothScan(mode: "sentrix" | "all" = "sentrix") {
    setIsScanning(true);
    setScanMessage(
      mode === "all"
        ? "Opening Bluetooth chooser for all nearby BLE devices…"
        : "Scanning for Sentrix hardware (UUID 12345678… / Sentrix-* / ESP-*)…",
    );

    if (typeof navigator === "undefined" || !("bluetooth" in navigator)) {
      setScanMessage(
        "Web Bluetooth API is not supported in this browser. Please use Google Chrome or Microsoft Edge, or click 'Simulate Discovered Sentrix Nodes' below.",
      );
      setIsScanning(false);
      return;
    }

    try {
      const navBluetooth = (navigator as unknown as {
        bluetooth: {
          requestDevice: (opts: unknown) => Promise<{ id: string; name?: string }>;
        };
      }).bluetooth;

      const options =
        mode === "all"
          ? {
              acceptAllDevices: true,
              optionalServices: [SENTRIX_BLE_SERVICE_UUID, "generic_access"],
            }
          : {
              filters: [
                { services: [SENTRIX_BLE_SERVICE_UUID] },
                { namePrefix: "Sentrix" },
                { namePrefix: "sentrix" },
                { namePrefix: "ESP" },
              ],
              optionalServices: [SENTRIX_BLE_SERVICE_UUID, "generic_access"],
            };

      const device = await navBluetooth.requestDevice(options);

      if (device) {
        const syntheticMac = `24:6F:28:${device.id.slice(0, 2).toUpperCase()}:${device.id.slice(2, 4).toUpperCase()}:${device.id.slice(4, 6).toUpperCase()}`;
        const found: BleDiscoveredDevice = {
          macAddress: syntheticMac,
          name: device.name || "Sentrix-AC-Hardware",
          rssi: -52,
        };
        setDiscoveredDevices([found, ...SIMULATED_DEVICES]);
        setSelectedMac(found.macAddress);
        setSensorName(found.name || "MCB Panel AC-04");
        setScanMessage(null);
        setStep(2);
      }
    } catch (err: unknown) {
      const errorStr = String(err);
      if (errorStr.includes("User cancelled") || errorStr.includes("cancelled")) {
        setScanMessage(
          "Bluetooth pairing dismissed. If you don't have a physical Sentrix ESP32 powered on nearby, click 'Simulate Discovered Sentrix Nodes' to continue.",
        );
      } else {
        setScanMessage(
          `Bluetooth: ${errorStr.replace(/^NotFoundError:\s*/i, "")}. Click 'Simulate Discovered Sentrix Nodes' to test onboarding without physical hardware.`,
        );
      }
    } finally {
      setIsScanning(false);
    }
  }

  // Simulation handler
  function handleSimulateDiscovery() {
    setDiscoveredDevices(SIMULATED_DEVICES);
    setSelectedMac(SIMULATED_DEVICES[0].macAddress);
    setSensorName(SIMULATED_DEVICES[0].name.replace("Sentrix-AC-Node", "MCB Panel AC"));
    setStep(2);
  }

  // Step 2 Submission
  function handleSelectHardware(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMac) return;
    if (!sensorName.trim()) setSensorName("MCB Panel AC-04");
    setStep(3);
  }

  // Step 3 Submission
  function handlePinSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{6}$/.test(pinCode)) {
      setPinError("Please enter a valid 6-digit numeric PIN.");
      return;
    }
    setPinError("");
    setStep(4);
  }

  // Step 4 Submission (Provisioning)
  function handleProvisionSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!wifiSsid.trim()) return;

    try {
      localStorage.setItem("sentrix-wifi-ssid", wifiSsid);
    } catch {
      // Storage unavailable
    }

    setIsProvisioning(true);

    // Simulate write to NVS Flash and ESP-Mesh initialization
    setTimeout(() => {
      // Persist to Sentrix store
      addDeviceToGroup(group.id, {
        name: sensorName.trim() || "MCB Panel AC-04",
        macAddress: selectedMac,
        pinCode,
        targetTempC: Number(targetTempC) || 22,
      });

      setIsProvisioning(false);
      setStep(5);
    }, 1200);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-[3px]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !isProvisioning) onClose();
      }}
    >
      <div className="surface-card w-full max-w-xl overflow-hidden rounded-2xl border border-[var(--border)] shadow-2xl">
        {/* Modal Top Header */}
        <div className="border-b border-[var(--border)] bg-[var(--surface-hover)] px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-500/15 text-amber-500 text-xs font-bold font-mono">
                BLE
              </span>
              <div>
                <h2 className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">
                  Add AC Circuit Sensor to {group.name}
                </h2>
                <p className="font-mono text-[10px] text-[var(--text-muted)]">
                  Mesh Provisioning · UUID {SENTRIX_BLE_SERVICE_UUID.slice(0, 18)}…
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isProvisioning}
              className="rounded-lg p-1 text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--text-primary)] transition disabled:opacity-50"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>

          {/* Stepper Progress Bar */}
          <div className="mt-4 flex items-center gap-1.5" aria-label="5-Step Provisioning Progress">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  s < step
                    ? "bg-emerald-500"
                    : s === step
                      ? "bg-amber-500 shadow-[0_0_8px_#f59e0b88]"
                      : "bg-[var(--border)]"
                }`}
              />
            ))}
          </div>
          <div className="mt-1.5 flex justify-between font-mono text-[9px] uppercase tracking-wider text-[var(--text-muted)]">
            <span className={step === 1 ? "text-amber-500 font-semibold" : ""}>1. Scan</span>
            <span className={step === 2 ? "text-amber-500 font-semibold" : ""}>2. Hardware</span>
            <span className={step === 3 ? "text-amber-500 font-semibold" : ""}>3. PIN</span>
            <span className={step === 4 ? "text-amber-500 font-semibold" : ""}>4. Wi-Fi & Mesh</span>
            <span className={step === 5 ? "text-emerald-500 font-semibold" : ""}>5. Active</span>
          </div>
        </div>

        {/* Modal Body Content by Step */}
        <div className="p-6">
          {/* STEP 1: SCANNING */}
          {step === 1 && (
            <div className="space-y-6 text-center py-2">
              <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
                <div className="absolute inset-0 animate-ping rounded-full bg-amber-500/10" />
                <div className="absolute inset-2 animate-pulse rounded-full border border-amber-500/30" />
                <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/15 text-amber-500">
                  <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" />
                    <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5" />
                    <circle cx="12" cy="12" r="2" />
                    <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5" />
                    <path d="M19.1 4.9C23 8.8 23 15.2 19.1 19.1" />
                  </svg>
                </div>
              </div>

              <div>
                <h3 className="text-base font-semibold text-[var(--text-primary)]">
                  Scanning for Nearby Sentrix AC MCB Nodes
                </h3>
                <p className="mx-auto mt-1.5 max-w-md text-xs leading-5 text-[var(--text-secondary)]">
                  Bring your device within Bluetooth LE range of the commercial AC electrical panel.
                  Broadcasting GATT Service <code className="rounded bg-[var(--surface-hover)] px-1 py-0.5 font-mono text-[10px] text-amber-500">{SENTRIX_BLE_SERVICE_UUID.slice(0, 18)}…</code>
                </p>
              </div>

              {scanMessage && (
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.08] p-3 text-left font-mono text-xs text-amber-400">
                  {scanMessage}
                </div>
              )}

              <div className="flex flex-col gap-2.5 sm:flex-row sm:justify-center pt-2">
                <button
                  type="button"
                  id="ble-scan-simulate-button"
                  onClick={handleSimulateDiscovery}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 text-xs font-semibold text-[#20170a] shadow-sm shadow-amber-500/20 transition hover:bg-amber-400"
                >
                  ⚡ Simulate Discovered Sentrix Nodes →
                </button>
                <button
                  type="button"
                  id="ble-scan-real-button"
                  onClick={() => handleWebBluetoothScan("sentrix")}
                  disabled={isScanning}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-amber-500/40 bg-[var(--surface-hover)] px-4 text-xs font-semibold text-[var(--text-primary)] transition hover:border-amber-500 disabled:opacity-50"
                >
                  <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                  {isScanning ? "Scanning Web Bluetooth…" : "Scan Sentrix Hardware"}
                </button>
                <button
                  type="button"
                  id="ble-scan-all-button"
                  onClick={() => handleWebBluetoothScan("all")}
                  disabled={isScanning}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--canvas)] px-3 text-xs font-medium text-[var(--text-secondary)] transition hover:border-[var(--border-hover)] disabled:opacity-50"
                  title="Scan for any nearby Bluetooth LE peripheral without UUID filter"
                >
                  Scan Any BLE Device
                </button>
              </div>

              {/* Troubleshooting Note */}
              <div className="rounded-xl border border-[var(--border)] bg-[var(--canvas)] p-3 text-left">
                <div className="flex items-center gap-2 font-mono text-[11px] font-semibold text-[var(--text-secondary)]">
                  <span>ℹ️</span>
                  <span>Why does Chrome say &ldquo;No compatible devices found&rdquo;?</span>
                </div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-[var(--text-muted)]">
                  Web Bluetooth scans the room for physical microcontrollers (ESP32) actively broadcasting GATT Service UUID <code className="font-mono text-amber-500">{SENTRIX_BLE_SERVICE_UUID.slice(0, 13)}…</code> or advertising as <code className="font-mono text-amber-500">Sentrix-*</code>. If you are developing locally without a physical ESP32 powered on right next to your computer, click <strong className="text-amber-500">&ldquo;Simulate Discovered Sentrix Nodes&rdquo;</strong> to test the full 5-step onboarding flow.
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: HARDWARE SELECTION */}
          {step === 2 && (
            <form onSubmit={handleSelectHardware} className="space-y-5">
              <div>
                <p className="eyebrow mb-1">Step 2 of 5</p>
                <h3 className="text-base font-semibold text-[var(--text-primary)]">
                  Select Discovered Hardware & Assign Circuit
                </h3>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Select the discovered BLE MAC address and specify the circuit installation details.
                </p>
              </div>

              <div className="space-y-2">
                <label className="eyebrow block">Discovered Sentrix Nodes</label>
                <div className="grid gap-2">
                  {discoveredDevices.map((dev) => (
                    <label
                      key={dev.macAddress}
                      className={`flex cursor-pointer items-center justify-between rounded-xl border p-3.5 transition ${
                        selectedMac === dev.macAddress
                          ? "border-amber-500 bg-amber-500/[0.08] text-[var(--text-primary)] shadow-sm"
                          : "border-[var(--border)] bg-[var(--canvas)] text-[var(--text-secondary)] hover:border-[var(--border-hover)]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="selectedMac"
                          checked={selectedMac === dev.macAddress}
                          onChange={() => {
                            setSelectedMac(dev.macAddress);
                            setSensorName(dev.name.replace("Sentrix-AC-Node", "MCB Panel AC"));
                          }}
                          className="h-4 w-4 accent-amber-500"
                        />
                        <div>
                          <p className="font-mono text-xs font-semibold">{dev.macAddress}</p>
                          <p className="text-[11px] text-[var(--text-muted)]">{dev.name}</p>
                        </div>
                      </div>
                      <span className="rounded bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] text-emerald-500">
                        RSSI {dev.rssi} dBm · BLE Ready
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                    Sensor / Circuit Name
                  </span>
                  <input
                    id="sensor-name-input"
                    required
                    value={sensorName}
                    onChange={(e) => setSensorName(e.target.value)}
                    placeholder="e.g. MCB Panel AC-04"
                    className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--canvas)] px-3 text-sm text-[var(--text-primary)] outline-none focus:border-amber-500"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                    Target AC Setpoint (°C)
                  </span>
                  <input
                    id="target-temp-input"
                    required
                    type="number"
                    min={12}
                    max={30}
                    value={targetTempC}
                    onChange={(e) => setTargetTempC(Number(e.target.value))}
                    className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--canvas)] px-3 font-mono text-sm text-[var(--text-primary)] outline-none focus:border-amber-500"
                  />
                </label>
              </div>

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="rounded-lg border border-[var(--border)] px-4 py-2 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
                >
                  ← Rescan
                </button>
                <button
                  type="submit"
                  id="select-hardware-submit"
                  disabled={!selectedMac}
                  className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-[#20170a] hover:bg-amber-400 disabled:opacity-50"
                >
                  Next: Enter Hardware PIN →
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: PIN ENTRY */}
          {step === 3 && (
            <form onSubmit={handlePinSubmit} className="space-y-5">
              <div>
                <p className="eyebrow mb-1">Step 3 of 5</p>
                <h3 className="text-base font-semibold text-[var(--text-primary)]">
                  Hardware Authentication PIN
                </h3>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Enter the 6-digit cryptographic PIN laser-etched on the Sentrix MCB hardware label.
                </p>
              </div>

              <div className="rounded-xl border border-[var(--border)] bg-[var(--canvas)] p-5 text-center">
                <label htmlFor="hardware-pin-input" className="eyebrow mb-2 block">
                  6-Digit Hardware Security PIN
                </label>
                <input
                  id="hardware-pin-input"
                  required
                  autoFocus
                  type="password"
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="••••••"
                  className="mx-auto h-12 w-48 text-center font-mono text-2xl tracking-[0.35em] text-[var(--text-primary)] rounded-lg border border-[var(--border)] bg-[var(--surface)] outline-none focus:border-amber-500"
                />
                <p className="mt-3 font-mono text-[10px] text-[var(--text-muted)]">
                  Factory default test PIN: <span className="text-amber-500 font-semibold">715204</span>
                </p>
                {pinError && (
                  <p className="mt-2 text-xs text-red-500 font-mono">{pinError}</p>
                )}
              </div>

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="rounded-lg border border-[var(--border)] px-4 py-2 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  id="pin-submit-button"
                  disabled={pinCode.length !== 6}
                  className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-[#20170a] hover:bg-amber-400 disabled:opacity-50"
                >
                  Next: Configure Wi-Fi & Mesh →
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: WI-FI & MESH CONFIRMATION */}
          {step === 4 && (
            <form onSubmit={handleProvisionSubmit} className="space-y-5">
              <div>
                <p className="eyebrow mb-1">Step 4 of 5</p>
                <h3 className="text-base font-semibold text-[var(--text-primary)]">
                  Wi-Fi Gateway & Mesh Credentials
                </h3>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Provide local Wi-Fi credentials to bridge telemetry from the ESP-Mesh root gateway.
                </p>
              </div>

              <div className="space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                    Local Wi-Fi SSID (2.4 GHz)
                  </span>
                  <input
                    id="wifi-ssid-input"
                    required
                    value={wifiSsid}
                    onChange={(e) => setWifiSsid(e.target.value)}
                    placeholder="e.g. Sentrix-Facilities-IoT"
                    className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--canvas)] px-3 text-sm text-[var(--text-primary)] outline-none focus:border-amber-500"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                    Wi-Fi WPA2 Password
                  </span>
                  <input
                    id="wifi-password-input"
                    type="password"
                    value={wifiPassword}
                    onChange={(e) => setWifiPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--canvas)] px-3 text-sm text-[var(--text-primary)] outline-none focus:border-amber-500"
                  />
                </label>

                {/* Mesh Info & GATT JSON Payload Preview */}
                <div className="rounded-xl border border-[var(--border)] bg-[var(--canvas)] p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="eyebrow text-[9px]">Target Group Mesh ID</span>
                    <span className="rounded bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-amber-500">
                      MESH {group.meshId}
                    </span>
                  </div>
                  <div>
                    <span className="eyebrow text-[8px] text-[var(--text-muted)]">
                      GATT JSON Payload Packet (to be written to NVS)
                    </span>
                    <pre className="mt-1 rounded border border-[var(--border)] bg-[var(--surface)] p-2.5 font-mono text-[10px] text-[var(--text-secondary)] overflow-x-auto">
{JSON.stringify(
  {
    ssid: wifiSsid || "...",
    password: wifiPassword ? "••••••••" : "...",
    pin: pinCode,
    mesh_id: group.meshId,
  },
  null,
  2,
)}
                    </pre>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  disabled={isProvisioning}
                  onClick={() => setStep(3)}
                  className="rounded-lg border border-[var(--border)] px-4 py-2 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] disabled:opacity-50"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  id="provision-submit-button"
                  disabled={isProvisioning || !wifiSsid}
                  className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-[#20170a] hover:bg-amber-400 disabled:opacity-50"
                >
                  {isProvisioning ? (
                    <>
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#20170a] border-t-transparent" />
                      Writing NVS Flash…
                    </>
                  ) : (
                    "Write to NVS Flash & Connect →"
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 5: SUCCESS / ACTIVE STATE */}
          {step === 5 && (
            <div className="space-y-6 text-center py-2">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500">
                <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </div>

              <div>
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-500">
                  Provisioning Succeeded
                </span>
                <h3 className="mt-2 text-lg font-semibold text-[var(--text-primary)]">
                  Sensor Connected & Baseline Calibration Started
                </h3>
                <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-[var(--text-muted)]">
                  GATT JSON credentials were successfully committed to non-volatile flash. Node joined mesh{" "}
                  <code className="text-amber-500 font-mono">MESH {group.meshId}</code>.
                </p>
              </div>

              <div className="surface-card rounded-xl border border-[var(--border)] p-4 text-left divide-y divide-[var(--border)] text-xs">
                <div className="flex justify-between pb-2.5">
                  <span className="text-[var(--text-muted)]">Sensor Name</span>
                  <span className="font-semibold text-[var(--text-primary)]">{sensorName}</span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-[var(--text-muted)]">Hardware MAC</span>
                  <span className="font-mono text-[var(--text-primary)]">{selectedMac}</span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-[var(--text-muted)]">Target AC Setpoint</span>
                  <span className="font-mono text-amber-500">{targetTempC}°C</span>
                </div>
                <div className="flex justify-between pt-2.5">
                  <span className="text-[var(--text-muted)]">Initial Status</span>
                  <span className="rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-amber-500">
                    Calibrating (Day 1/7)
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  id="onboarding-done-button"
                  onClick={onClose}
                  className="w-full rounded-lg bg-amber-500 py-2.5 text-xs font-semibold text-[#20170a] hover:bg-amber-400 transition shadow-sm shadow-amber-500/20"
                >
                  Done · View in Device Inventory →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
