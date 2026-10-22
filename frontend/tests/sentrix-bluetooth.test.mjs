import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const source = readFileSync(new URL("../app/lib/sentrix-bluetooth.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
});
const SERVICE = "12345678-1234-5678-1234-56789abcdef0";
const credentials = { ssid: "Sentrix WiFi", password: "test-password", pin: "715204", group_id: "test-group" };
function load({ secure = true, bluetooth } = {}) {
  const exports = {};
  runInNewContext(outputText, {
    exports, isSecureContext: secure, navigator: { bluetooth }, Error,
    TextEncoder, TextDecoder, Uint8Array, setTimeout: (fn) => fn(), Date,
  });
  return exports;
}
function peripheral({ mac = "24:6F:28:C2:5E:19", states = ["connecting", "connected"], resetState = "receiving" } = {}) {
  const writes = [];
  let disconnects = 0;
  const value = (text) => new DataView(new TextEncoder().encode(text).buffer);
  const device = { name: "Sentrix-5E19", gatt: {
    async connect() { return { async getPrimaryService(uuid) {
      assert.equal(uuid, SERVICE);
      return { async getCharacteristic(uuid) {
        if (uuid.endsWith("f1")) return { async readValue() { return value(mac); } };
        if (uuid.endsWith("f2")) return { async writeValueWithResponse(chunk) { writes.push([...chunk]); } };
        if (uuid.endsWith("f3")) return { async readValue() { return value(writes.length === 1 ? resetState : states.shift() || "connected"); } };
        assert.fail("Unknown characteristic");
      } };
    } }; },
    disconnect() { disconnects++; },
  } };
  return { device, writes, disconnects: () => disconnects };
}
test("chooser is synchronous, service-only, and reads a real MAC", async () => {
  const node = peripheral();
  let requested = false;
  const api = load({ bluetooth: { requestDevice(options) {
    requested = true;
    assert.deepEqual(JSON.parse(JSON.stringify(options)), { filters: [{ services: [SERVICE] }] });
    return Promise.resolve(node.device);
  } } });
  const pending = api.scanSentrixHardware();
  assert.equal(requested, true);
  const result = await pending;
  assert.equal(result.macAddress, "24:6F:28:C2:5E:19");
  assert.equal(result.device, node.device);
  assert.equal(node.disconnects(), 1);
});
test("invalid hardware identities are rejected and disconnected", async () => {
  for (const mac of ["opaque-browser-id", "00:00:00:00:00:00"]) {
    const node = peripheral({ mac });
    const api = load({ bluetooth: { requestDevice: async () => node.device } });
    assert.match(await api.scanSentrixHardware(), /invalid hardware MAC/);
    assert.equal(node.disconnects(), 1);
  }
});
test("insecure origins never request Bluetooth access", async () => {
  const api = load({ secure: false, bluetooth: { requestDevice() { assert.fail("must not scan"); } } });
  assert.match(await api.scanSentrixHardware(), /HTTPS or localhost/);
});
test("unsupported browsers receive an actionable message", async () => {
  assert.match(await load().scanSentrixHardware(), /unavailable/);
});
test("chooser cancellation is handled without fabricating a device", async () => {
  const error = new Error("User cancelled");
  error.name = "NotFoundError";
  const api = load({ bluetooth: { requestDevice() { return Promise.reject(error); } } });
  assert.match(await api.scanSentrixHardware(), /No compatible device selected/);
});
test("provisioning sends bounded chunks and waits for firmware acknowledgement", async () => {
  const node = peripheral();
  await load().provisionSentrixHardware({ device: node.device }, credentials);
  assert.deepEqual(node.writes[0], [1]);
  assert.ok(node.writes.every((chunk) => chunk.length <= 20));
  const json = new TextDecoder().decode(new Uint8Array(node.writes.slice(1).flat()));
  assert.deepEqual(JSON.parse(json), credentials);
  assert.ok(json.endsWith("\n"));
  assert.equal(node.disconnects(), 1);
});
test("firmware failure statuses never report success", async () => {
  for (const state of ["invalid_pin", "invalid_config", "wifi_failed", "storage_failed", "busy", "ready"]) {
    const node = peripheral({ states: [state] });
    await assert.rejects(load().provisionSentrixHardware({ device: node.device }, credentials));
    assert.equal(node.disconnects(), 1);
  }
});
test("invalid credentials are rejected before opening GATT", async () => {
  for (const changes of [{ ssid: "" }, { ssid: "é".repeat(17) }, { password: "short" }, { pin: "abc123" }, { ssid: "bad\0ssid" }]) {
    const node = peripheral();
    await assert.rejects(load().provisionSentrixHardware({ device: node.device }, { ...credentials, ...changes }));
    assert.equal(node.writes.length, 0);
  }
});

test("a busy device or stale success cannot acknowledge a new configuration", async () => {
  for (const resetState of ["connecting", "connected"]) {
    const node = peripheral({ resetState });
    await assert.rejects(load().provisionSentrixHardware({ device: node.device }, credentials), /busy/);
    assert.equal(node.writes.length, 1);
  }
});

test("website UUIDs match the single-file firmware contract", () => {
  const firmware = readFileSync(new URL("../../../../SentrixArduino/SentrixESP32/SentrixESP32.ino", import.meta.url), "utf8");
  for (const uuid of source.matchAll(/"(12345678-1234-5678-1234-56789abcdef[0-3])"/g)) {
    assert.ok(firmware.includes(`"${uuid[1]}"`), `Missing firmware UUID ${uuid[1]}`);
  }
});
