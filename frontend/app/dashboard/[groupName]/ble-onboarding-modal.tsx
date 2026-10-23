"use client";

import { useEffect, useRef, useState } from "react";
import { assertDeviceNotRegistered, useSentrix, type Group } from "../../lib/sentrix-store";

import { scanSentrixWifi, authenticateSentrixHardware, scanSentrixHardware, provisionSentrixHardware, type ScanResult, type SentrixHardware } from "../../lib/sentrix-bluetooth";

type BleDiscoveredDevice = {
  macAddress: string;
  name: string;
  rssi: number | null;
};

const SIMULATED_DEVICES: BleDiscoveredDevice[] = [
  { macAddress: "24:6F:28:C2:5E:19", name: "Sentrix-AC-Node-19", rssi: -58 },
  { macAddress: "24:6F:28:D4:11:80", name: "Sentrix-AC-Node-80", rssi: -64 },
  { macAddress: "24:6F:28:A9:44:03", name: "Sentrix-AC-Node-03", rssi: -72 },
];

export function BleOnboardingModal({
  group,
  onClose,
  initialScan,
}: {
  group: Group;
  onClose: () => void;
  initialScan?: Promise<ScanResult>;
}) {
  const { addDeviceToGroup } = useSentrix();

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [isScanning, setIsScanning] = useState(Boolean(initialScan));
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [discoveredDevices, setDiscoveredDevices] = useState<BleDiscoveredDevice[]>([]);

  // Step 2 Form
  const [selectedMac, setSelectedMac] = useState("");
  const [sensorName, setSensorName] = useState("");

  // Step 3 Form (6-digit PIN)
  const [pinCode, setPinCode] = useState("715204");
  const [pinError, setPinError] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Step 4 Form (Wi-Fi + Mesh)
  const [wifiSsid, setWifiSsid] = useState(() => {
    if (typeof window === "undefined") return "Sentrix-Facilities-IoT";
    try {
      return localStorage.getItem("sentrix-wifi-ssid") || "Sentrix-Facilities-IoT";
    } catch {
      return "Sentrix-Facilities-IoT";
    }
  });
  const [wifiNetworks, setWifiNetworks] = useState<string[]>([]);
  const [isScanningWifi, setIsScanningWifi] = useState(false);
  const [wifiScanMessage, setWifiScanMessage] = useState("");
  const [wifiPassword, setWifiPassword] = useState("");
  const [hardware, setHardware] = useState<SentrixHardware | null>(null);
  const [provisionError, setProvisionError] = useState("");
  const [isProvisioning, setIsProvisioning] = useState(false);

  const hardwareRef = useRef<SentrixHardware | null>(null);
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      hardwareRef.current?.device.gatt?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!initialScan) return;
    let cancelled = false;
    initialScan.then((result) => {
      if (cancelled) {
        if (!mounted.current && typeof result !== "string") result.device.gatt?.disconnect();
        return;
      }
      if (typeof result === "string") setScanMessage(result);
      else {
        hardwareRef.current = result;
        setHardware(result);
        setDiscoveredDevices([{ ...result, rssi: null }]);
        setSelectedMac(result.macAddress);
        setSensorName(result.name);
        setStep(2);
      }
      setIsScanning(false);
    });
    return () => { cancelled = true; };
  }, [initialScan]);

  async function handleWebBluetoothScan() {
    hardwareRef.current?.device.gatt?.disconnect();
    hardwareRef.current = null;
    setIsScanning(true);
    setScanMessage("Scanning for the Sentrix BLE service...");
    const result = await scanSentrixHardware();
    if (!mounted.current) {
      if (typeof result !== "string") result.device.gatt?.disconnect();
      return;
    }
    if (typeof result === "string") setScanMessage(result);
    else {
      hardwareRef.current = result;
      setHardware(result);
      setDiscoveredDevices([{ ...result, rssi: null }]);
      setSelectedMac(result.macAddress);
      setSensorName(result.name);
      setScanMessage(null);
      setStep(2);
    }
    setIsScanning(false);
  }

  // Simulation handler
  function handleSimulateDiscovery() {
    hardwareRef.current?.device.gatt?.disconnect();
    hardwareRef.current = null;
    setHardware(null);
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
  async function handlePinSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isAuthenticating) return;
    if (!/^\d{6}$/.test(pinCode)) {
      setPinError("Please enter a valid 6-digit numeric PIN.");
      return;
    }
    setPinError("");
    setIsAuthenticating(true);
    try {
      assertDeviceNotRegistered(selectedMac);
      if (hardware) await authenticateSentrixHardware(hardware, pinCode);
      if (mounted.current) {
        setWifiNetworks([]);
        setWifiScanMessage("");
        setStep(4);
        void handleWifiScan();
      }
    } catch (error) {
      setPinError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsAuthenticating(false);
    }
  }

  async function handleWifiScan() {
    if (!hardware || isScanningWifi || isProvisioning) return;
    setIsScanningWifi(true);
    setWifiNetworks([]);
    setWifiScanMessage("");
    try {
      const networks = await scanSentrixWifi(hardware, pinCode);
      if (!mounted.current) return;
      setWifiNetworks(networks);
      setWifiScanMessage(networks.length ? "Select a network below. Showing up to 8 networks." : "No visible networks found. Retry or enter the SSID manually.");
    } catch (error) {
      setWifiScanMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsScanningWifi(false);
    }
  }

  // Step 4 Submission (Provisioning)
  async function handleProvisionSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!wifiSsid.trim() || isProvisioning || isScanningWifi) return;
    setProvisionError("");
    setIsProvisioning(true);
    try {
      assertDeviceNotRegistered(selectedMac);
      if (hardware) {
        await provisionSentrixHardware(hardware, {
          ssid: wifiSsid, password: wifiPassword, pin: pinCode, group_id: group.id,
        });
      }
      try { localStorage.setItem("sentrix-wifi-ssid", wifiSsid); } catch { /* Storage unavailable */ }
      addDeviceToGroup(group.id, {
        name: sensorName.trim() || "MCB Panel AC-04",
        macAddress: selectedMac,
        pinCode: hardware ? "" : pinCode,
        targetTempC: 22,
      });
      setWifiPassword("");
      setStep(5);
    } catch (error) {
      setProvisionError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsProvisioning(false);
    }
  }

  const loading = isScanning || isAuthenticating || isProvisioning;
  const loadingTitle = isAuthenticating ? "Checking your PIN…"
    : isProvisioning ? `Connecting to ${wifiSsid}…`
    : "Finding your sensor…";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-[3px]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
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
                  Add sensor to {group.name}
                </h2>
                <p className="font-mono text-[10px] text-[var(--text-muted)]">
                  Bluetooth Setup
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
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
                      ? "bg-amber-500"
                      : "bg-[var(--border)]"
                }`}
              />
            ))}
          </div>
          <div className="mt-1.5 flex justify-between font-mono text-[9px] uppercase tracking-wider text-[var(--text-muted)]">
            <span className={step === 1 ? "text-amber-500 font-semibold" : ""}>1. Scan</span>
            <span className={step === 2 ? "text-amber-500 font-semibold" : ""}>2. Hardware</span>
            <span className={step === 3 ? "text-amber-500 font-semibold" : ""}>3. PIN</span>
            <span className={step === 4 ? "text-amber-500 font-semibold" : ""}>4. Wi-Fi</span>
            <span className={step === 5 ? "text-emerald-500 font-semibold" : ""}>5. Active</span>
          </div>
        </div>

        {/* Modal Body Content by Step */}
        <div className="p-6">
          {loading && (
            <div role="status" aria-live="polite" className="mb-5 flex items-center gap-3 rounded-lg bg-[var(--canvas)] px-4 py-3">
              <span aria-hidden="true" className="flex shrink-0 gap-1">
                {[0, 150, 300].map(delay => (
                  <span key={delay} style={{ animationDelay: `${delay}ms` }} className="h-1.5 w-1.5 rounded-full bg-amber-500 motion-safe:animate-bounce" />
                ))}
              </span>
              <div className="min-w-0">
                <p className="break-words text-sm font-medium text-[var(--text-primary)]">{loadingTitle}</p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  {isProvisioning ? "Keep your sensor powered on. This can take up to 35 seconds."
                    : isScanning ? "Choose your Sentrix sensor in the Bluetooth window."
                    : "Keep your sensor nearby. This should only take a moment."}
                </p>
              </div>
            </div>
          )}
          <fieldset disabled={loading} className="m-0 min-w-0 border-0 p-0">
          {/* STEP 1: SCANNING */}
          {step === 1 && (
            <div className="space-y-6 text-center py-2">
              <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
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
                  Find your sensor
                </h3>
                <p className="mx-auto mt-1.5 max-w-md text-xs leading-5 text-[var(--text-secondary)]">
                  Keep your sensor powered on and near your computer.
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
                  disabled={isScanning}
                  onClick={handleSimulateDiscovery}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 text-xs font-semibold text-[#20170a] shadow-sm shadow-amber-500/20 transition hover:bg-amber-400"
                >
                  Try demo
                </button>
                <button
                  type="button"
                  id="ble-scan-real-button"
                  onClick={() => handleWebBluetoothScan()}
                  disabled={isScanning}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-amber-500/40 bg-[var(--surface-hover)] px-4 text-xs font-semibold text-[var(--text-primary)] transition hover:border-amber-500 disabled:opacity-50"
                >
                  <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                  {isScanning ? "Scanning Web Bluetooth…" : "Find sensor"}
                </button>
                <button
                  type="button"
                  id="ble-scan-all-button"
                  onClick={() => handleWebBluetoothScan()}
                  disabled={isScanning}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--canvas)] px-3 text-xs font-medium text-[var(--text-secondary)] transition hover:border-[var(--border-hover)] disabled:opacity-50"
                  title="Only devices advertising the Sentrix service are allowed"
                >
                  Scan again
                </button>
              </div>

              {/* Troubleshooting Note */}
              <div className="rounded-xl border border-[var(--border)] bg-[var(--canvas)] p-3 text-left">
                <div className="flex items-center gap-2 font-mono text-[11px] font-semibold text-[var(--text-secondary)]">
                  <span>ℹ️</span>
                  <span>Why does Chrome say &ldquo;No compatible devices found&rdquo;?</span>
                </div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-[var(--text-muted)]">
                  Check that your sensor is powered on and has the latest Sentrix firmware, then scan again. You can also use the demo to explore setup without hardware.
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: HARDWARE SELECTION */}
          {step === 2 && (
            <form onSubmit={handleSelectHardware} className="space-y-5">
              <div>
                <h3 className="text-base font-semibold text-[var(--text-primary)]">
                  Name your sensor
                </h3>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Choose your sensor and give it a name you will recognize.
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
                        {dev.rssi === null ? "BLE Ready" : `RSSI ${dev.rssi} dBm · BLE Ready`}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
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
                  Continue →
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: PIN ENTRY */}
          {step === 3 && (
            <form onSubmit={handlePinSubmit} className="space-y-5">
              <div>
                <h3 className="text-base font-semibold text-[var(--text-primary)]">
                  Enter your sensor PIN
                </h3>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Use the six-digit PIN supplied with your sensor.
                </p>
              </div>

              <div className="rounded-xl border border-[var(--border)] bg-[var(--canvas)] p-5 text-center">
                <label htmlFor="hardware-pin-input" className="eyebrow mb-2 block">
                  Sensor PIN
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
                  disabled={isAuthenticating}
                  className="rounded-lg border border-[var(--border)] px-4 py-2 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  id="pin-submit-button"
                  disabled={isAuthenticating || pinCode.length !== 6}
                  className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-[#20170a] hover:bg-amber-400 disabled:opacity-50"
                >
                  Continue →
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: WI-FI & MESH CONFIRMATION */}
          {step === 4 && (
            <form onSubmit={handleProvisionSubmit} className="space-y-5">
              <div>
                <h3 className="text-base font-semibold text-[var(--text-primary)]">
                  Connect to Wi-Fi
                </h3>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Choose a nearby network or enter its name below.
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

                {hardware && (
                  <div className="space-y-2">
                    <button type="button" onClick={handleWifiScan}
                      disabled={isScanningWifi || isProvisioning}
                      className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs text-amber-500 disabled:opacity-50">
                      {isScanningWifi ? "Refreshing…" : "Refresh"}
                    </button>
                    {isScanningWifi && (
                      <div role="status" className="space-y-2 py-2 text-xs text-[var(--text-muted)]">
                        <p>Finding networks… You can fill in the details while you wait.</p>
                        <div aria-hidden="true" className="space-y-2 motion-safe:animate-pulse">
                          {["w-2/5", "w-3/5", "w-1/3"].map(width => (
                            <div key={width} className="flex h-8 items-center gap-3 rounded-lg bg-[var(--canvas)] px-3">
                              <span className="h-2 w-2 rounded-full bg-[var(--border)]" />
                              <span className={`h-1.5 rounded-full bg-[var(--border)] ${width}`} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {wifiScanMessage && <p role="status" className="text-xs text-[var(--text-muted)]">{wifiScanMessage}</p>}
                    <div className="flex max-h-28 flex-wrap gap-2 overflow-y-auto">
                      {wifiNetworks.map(ssid => (
                        <button key={ssid} type="button" disabled={isProvisioning || isScanningWifi}
                          onClick={() => setWifiSsid(ssid)}
                          aria-pressed={wifiSsid === ssid}
                          className="max-w-full break-all rounded-lg border border-[var(--border)] px-3 py-2 text-xs text-[var(--text-primary)] hover:border-amber-500 aria-pressed:border-amber-500 disabled:opacity-50">
                          {ssid}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

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

              </div>

              {provisionError && <p role="alert" className="text-xs text-red-500 font-mono">{provisionError}</p>}
              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  disabled={isProvisioning || isScanningWifi}
                  onClick={() => setStep(3)}
                  className="rounded-lg border border-[var(--border)] px-4 py-2 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] disabled:opacity-50"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  id="provision-submit-button"
                  disabled={isProvisioning || isScanningWifi || !wifiSsid}
                  className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-[#20170a] hover:bg-amber-400 disabled:opacity-50"
                >
                  {isProvisioning ? (
                    <>
                      Connecting…
                    </>
                  ) : (
                    "Connect sensor →"
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
                  Connected
                </span>
                <h3 className="mt-2 text-lg font-semibold text-[var(--text-primary)]">
                  Your sensor is ready
                </h3>
                <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-[var(--text-muted)]">
                  {hardware ? "Your sensor is connected to Wi-Fi and added to this group." : "Simulated node added to this location group."}
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
                  Done →
                </button>
              </div>
            </div>
          )}
          </fieldset>
        </div>
      </div>
    </div>
  );
}
