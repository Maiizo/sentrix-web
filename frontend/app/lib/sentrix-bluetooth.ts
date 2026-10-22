export const SENTRIX_BLE_SERVICE_UUID = "12345678-1234-5678-1234-56789abcdef0";
const IDENTITY_UUID = "12345678-1234-5678-1234-56789abcdef1";
const CONFIG_UUID = "12345678-1234-5678-1234-56789abcdef2";
const STATUS_UUID = "12345678-1234-5678-1234-56789abcdef3";

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
    if (error instanceof Error && error.name === "NotFoundError") {
      return "No compatible device selected or required service missing. Upload the Sentrix BLE firmware and try again.";
    }
    return `Bluetooth: ${error instanceof Error ? error.message : String(error)}`;
  } finally {
    device?.gatt?.disconnect();
  }
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
  const payload = encoder.encode(JSON.stringify(credentials) + "\n");
  if (payload.length > 384) throw new Error("Wi-Fi configuration is too large.");
  const gatt = hardware.device.gatt;
  if (!gatt) throw new Error("Bluetooth disconnected. Rescan the hardware.");
  try {
    const server = await gatt.connect();
    const service = await server.getPrimaryService(SENTRIX_BLE_SERVICE_UUID);
    const config = await service.getCharacteristic(CONFIG_UUID);
    const status = await service.getCharacteristic(STATUS_UUID);
    // Reset framing, then use 20-byte writes to work with the minimum BLE MTU.
    await config.writeValueWithResponse(new Uint8Array([1]));
    if (new TextDecoder().decode(await status.readValue()) !== "receiving") {
      throw new Error("The ESP32 is busy. Wait for the current setup to finish and retry.");
    }
    for (let offset = 0; offset < payload.length; offset += 20) {
      await config.writeValueWithResponse(payload.slice(offset, offset + 20));
    }
    const deadline = Date.now() + 35000;
    while (Date.now() < deadline) {
      const state = new TextDecoder().decode(await status.readValue());
      if (state === "connected") return;
      const errors: Record<string, string> = {
        invalid_pin: "The hardware PIN is incorrect.",
        invalid_config: "The ESP32 rejected the Wi-Fi configuration.",
        wifi_failed: "The ESP32 could not join Wi-Fi. Check the password and 2.4 GHz network.",
        storage_failed: "The ESP32 could not save credentials. The previous configuration was preserved.",
        busy: "The ESP32 is already provisioning. Wait and try again.",
      };
      if (errors[state]) throw new Error(errors[state]);
      if (state !== "connecting" && state !== "receiving") {
        throw new Error("Unexpected provisioning status. Rescan the hardware and try again.");
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    throw new Error("Timed out waiting for the ESP32. Check Serial Monitor before retrying.");
  } finally {
    gatt.disconnect();
  }
}
