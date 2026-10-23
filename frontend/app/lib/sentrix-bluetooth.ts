export const SENTRIX_BLE_SERVICE_UUID = "12345678-1234-5678-1234-56789abcdef0";
const IDENTITY_UUID = "12345678-1234-5678-1234-56789abcdef1";
const CONFIG_UUID = "12345678-1234-5678-1234-56789abcdef2";
const STATUS_UUID = "12345678-1234-5678-1234-56789abcdef3";
const SESSION_UUID = "12345678-1234-5678-1234-56789abcdef4";
const NETWORKS_UUID = "12345678-1234-5678-1234-56789abcdef5";
const sessions = new WeakMap<BluetoothDevice, { key: CryptoKey; challenge: Uint8Array<ArrayBuffer>; pin: string }>();
const encode = (text: string) => new TextEncoder().encode(text);
const hex = (bytes: ArrayBuffer) => Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, "0")).join("");
const errors: Record<string, string> = {
  invalid_pin: "The hardware PIN is incorrect.",
  pin_locked: "Too many incorrect PINs. Wait 60 seconds and retry.",
  auth_required: "Authenticate the hardware PIN again.",
  crypto_failed: "The ESP32 could not create an encrypted session. Restart it and retry.",
  invalid_config: "The ESP32 rejected the Wi-Fi configuration.",
  wifi_failed: "The ESP32 could not join Wi-Fi. Check the password and 2.4 GHz network.",
  storage_failed: "The ESP32 could not save credentials. The previous configuration was preserved.",
  busy: "The ESP32 is already provisioning. Wait and try again.",
  wifi_scan_failed: "The ESP32 Wi-Fi radio could not complete the scan. Upload the scan-reconnect fix, restart the board, and retry. Manual SSID entry is still available.",
};

async function sendFrame(service: BluetoothRemoteGATTService, frame: object) {
  const config = await service.getCharacteristic(CONFIG_UUID);
  const status = await service.getCharacteristic(STATUS_UUID);
  const payload = encode(JSON.stringify(frame) + "\n");
  if (payload.length > 1024) throw new Error("Configuration is too large.");
  await config.writeValueWithResponse(new Uint8Array([1]));
  if (new TextDecoder().decode(await status.readValue()) !== "receiving") {
    throw new Error("The ESP32 is busy. Wait and retry.");
  }
  for (let offset = 0; offset < payload.length; offset += 20) {
    await config.writeValueWithResponse(payload.slice(offset, offset + 20));
  }
  return status;
}

export async function authenticateSentrixHardware(hardware: SentrixHardware, pin: string): Promise<void> {
  if (!/^\d{6}$/.test(pin)) throw new Error("Enter the six-digit hardware PIN.");
  const device = hardware.device;
  const gatt = device.gatt;
  if (!gatt) throw new Error("Bluetooth disconnected. Rescan the hardware.");
  if (gatt.connected && sessions.get(device)?.pin === pin) return;
  const replacingSession = sessions.has(device);
  sessions.delete(device);
  try {
    // Only changing an already verified PIN requires a fresh device handshake.
    if (gatt.connected && replacingSession) gatt.disconnect();
    const server = gatt.connected ? gatt : await gatt.connect();
    const service = await server.getPrimaryService(SENTRIX_BLE_SERVICE_UUID);
    let session: BluetoothRemoteGATTCharacteristic;
    try { session = await service.getCharacteristic(SESSION_UUID); }
    catch { throw new Error("Upload the new Sentrix 2.3.0 firmware first, then rescan the node."); }
    const view = await session.readValue();
    const hello = new Uint8Array(view.buffer, view.byteOffset, view.byteLength).slice();
    if (hello.length !== 81) throw new Error("Invalid device handshake. Restart the ESP32 and rescan.");
    const challenge = hello.slice(65);
    const peer = await crypto.subtle.importKey("raw", hello.slice(0, 65), { name: "ECDH", namedCurve: "P-256" }, false, []);
    const pair = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, false, ["deriveBits"]);
    const shared = await crypto.subtle.deriveBits({ name: "ECDH", public: peer }, pair.privateKey, 256);
    const material = new Uint8Array(54);
    material.set(new Uint8Array(shared)); material.set(challenge, 32); material.set(encode(pin), 48);
    const keyBytes = await crypto.subtle.digest("SHA-256", material);
    material.fill(0);
    // shortcut: six-digit PIN proofs are not PAKE; use audited PAKE for hostile deployments.
    const proofKey = await crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
    const proof = await crypto.subtle.sign("HMAC", proofKey, encode("sentrix-client-v1"));
    const status = await sendFrame(service, { op: "auth", public: hex(await crypto.subtle.exportKey("raw", pair.publicKey)), proof: hex(proof) });
    const state = new TextDecoder().decode(await status.readValue());
    if (state !== "authenticated") throw new Error(errors[state] || "Hardware authentication failed.");
    const response = await session.readValue();
    const signature = new Uint8Array(response.buffer, response.byteOffset, response.byteLength).slice();
    if (!await crypto.subtle.verify("HMAC", proofKey, signature, encode("sentrix-device-v1"))) {
      throw new Error("Device authentication failed. No Wi-Fi credentials were sent.");
    }
    const key = await crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, ["encrypt"]);
    new Uint8Array(keyBytes).fill(0);
    sessions.set(device, { key, challenge, pin });
    device.addEventListener("gattserverdisconnected", () => sessions.delete(device), { once: true });
  } catch (error) {
    gatt.disconnect();
    throw error;
  }
}

export type SentrixHardware = {
  macAddress: string;
  name: string;
  device: BluetoothDevice;
};
export type ScanResult = SentrixHardware | string;

// Call directly from a click handler to retain the browser user activation.
export async function scanSentrixHardware(): Promise<ScanResult> {
  if (!globalThis.isSecureContext) {
    return "Web Bluetooth requires HTTPS or localhost. Open this website over a secure connection and try again.";
  }
  if (typeof navigator === "undefined" || !navigator.bluetooth) {
    return "Web Bluetooth is unavailable in this browser. Use a supported Chrome or Edge browser with Bluetooth enabled.";
  }
  let device: BluetoothDevice | undefined;
  try {
    device = await navigator.bluetooth.requestDevice({
      filters: [{ services: [SENTRIX_BLE_SERVICE_UUID] }],
    });
    if (!device.gatt) throw new Error("This device has no GATT server.");
    const server = await device.gatt.connect();
    const service = await server.getPrimaryService(SENTRIX_BLE_SERVICE_UUID);
    const identity = await service.getCharacteristic(IDENTITY_UUID);
    const macAddress = new TextDecoder().decode(await identity.readValue()).trim().toUpperCase();
    if (!/^(?:[0-9A-F]{2}:){5}[0-9A-F]{2}$/.test(macAddress) || macAddress === "00:00:00:00:00:00") {
      throw new Error("The device returned an invalid hardware MAC address.");
    }
    return { device, macAddress, name: device.name || "Sentrix hardware" };
  } catch (error) {
    device?.gatt?.disconnect();
    if (error instanceof Error && error.name === "NotFoundError") {
      return "No compatible device selected or required service missing. Upload the Sentrix BLE firmware and try again.";
    }
    return `Bluetooth: ${error instanceof Error ? error.message : String(error)}`;
  }
}

export async function scanSentrixWifi(hardware: SentrixHardware, pin: string): Promise<string[]> {
  await authenticateSentrixHardware(hardware, pin);
  const service = await hardware.device.gatt!.getPrimaryService(SENTRIX_BLE_SERVICE_UUID);
  let networks: BluetoothRemoteGATTCharacteristic;
  try { networks = await service.getCharacteristic(NETWORKS_UUID); }
  catch { throw new Error("Upload the latest ESP32 firmware to scan Wi-Fi. You can still enter the SSID manually."); }
  const status = await sendFrame(service, { op: "scan_wifi" });
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    const state = new TextDecoder().decode(await status.readValue());
    if (state === "wifi_scan_done") {
      const result: unknown = JSON.parse(new TextDecoder().decode(await networks.readValue()));
      if (!Array.isArray(result) || result.length > 8 || result.some(ssid =>
        typeof ssid !== "string" || !ssid.length || encode(ssid).length > 32 || ssid.includes("\0"))) {
        throw new Error("The ESP32 returned invalid Wi-Fi names.");
      }
      return [...new Set(result as string[])];
    }
    if (state !== "scanning_wifi" && state !== "receiving") {
      throw new Error(errors[state] || `Unexpected ESP32 Wi-Fi scan status: ${state.slice(0, 64)}. Restart the board and retry.`);
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error("Wi-Fi scan timed out. Wait a moment and retry, or enter the SSID manually.");
}

export async function provisionSentrixHardware(
  hardware: SentrixHardware,
  credentials: { ssid: string; password: string; pin: string; group_id: string },
): Promise<void> {
  const encoder = new TextEncoder();
  const ssidLength = encoder.encode(credentials.ssid).length;
  const passwordLength = encoder.encode(credentials.password).length;
  if (!ssidLength || ssidLength > 32 || passwordLength > 63 ||
      (passwordLength > 0 && passwordLength < 8) ||
      !/^\d{6}$/.test(credentials.pin) ||
      !credentials.group_id || encoder.encode(credentials.group_id).length > 64 ||
      Object.values(credentials).some((value) => value.includes("\0"))) {
    throw new Error("Check the SSID (1–32 bytes), password (8–63 bytes or empty for open Wi-Fi), and six-digit hardware PIN.");
  }
  const { ssid, password, group_id } = credentials;
  const payload = encoder.encode(JSON.stringify({ ssid, password, group_id }));
  if (payload.length > 384) throw new Error("Wi-Fi configuration is too large.");
  const gatt = hardware.device.gatt;
  if (!gatt) throw new Error("Bluetooth disconnected. Rescan the hardware.");
  let stage = "connect";
  try {
    await authenticateSentrixHardware(hardware, credentials.pin);
    const server = gatt.connected ? gatt : await gatt.connect();
    stage = "services";
    const service = await server.getPrimaryService(SENTRIX_BLE_SERVICE_UUID);
    const session = sessions.get(hardware.device);
    if (!session) throw new Error("Bluetooth session expired. Authenticate the PIN again.");
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: session.challenge }, session.key, payload);
    sessions.delete(hardware.device);
    stage = "write";
    const status = await sendFrame(service, { op: "config", iv: hex(iv.buffer), data: hex(encrypted) });
    stage = "wait";
    const deadline = Date.now() + 35000;
    while (Date.now() < deadline) {
      const state = new TextDecoder().decode(await status.readValue());
      if (state === "connected") return;
      if (errors[state]) throw new Error(errors[state]);
      if (state !== "connecting" && state !== "receiving") {
        throw new Error("Unexpected provisioning status. Rescan the hardware and try again.");
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    throw new Error("Timed out waiting for the ESP32 Wi-Fi result. Keep the node powered and nearby, then retry.");
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    if (stage === "connect") {
      throw new Error("Bluetooth authentication failed before Wi-Fi settings were sent. " + detail);
    }
    if (stage === "services") {
      throw new Error("Could not open the ESP32 provisioning service. Restart the node and rescan. " + detail);
    }
    if (error instanceof Error && ["NetworkError", "SecurityError", "NotSupportedError"].includes(error.name)) {
      throw new Error(stage === "write"
        ? "Bluetooth credential transfer failed. Upload the latest firmware, restart the node and rescan. " + detail
        : "Bluetooth disconnected while waiting for the Wi-Fi result. The ESP32 may still finish setup; reconnect before retrying. " + detail);
    }
    throw error;
  } finally {
    gatt.disconnect();
  }
}
