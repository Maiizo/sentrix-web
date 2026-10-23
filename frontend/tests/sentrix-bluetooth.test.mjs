import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import { webcrypto, createECDH, randomBytes, createHash, createHmac, createDecipheriv } from "node:crypto";
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
    crypto: webcrypto, exports, isSecureContext: secure, navigator: { bluetooth }, Error,
    TextEncoder, TextDecoder, Uint8Array, setTimeout: (fn) => fn(), Date,
  });
  return exports;
}
function peripheral({ mac = "24:6F:28:C2:5E:19", states = ["connecting", "connected"], resetState = "receiving", badProof = false, tamper = false } = {}) {
  const writes = [];
  let disconnects = 0;
  const value = (text) => new DataView(new TextEncoder().encode(text).buffer);
  let ecdh, challenge, hello, key, state, frame = "", decoded;
  const listeners = [];
  const device = { name: "Sentrix-5E19", addEventListener: (_, fn) => listeners.push(fn), gatt: {
    connected: false,
    async connect() {
      this.connected = true;
      ecdh = createECDH("prime256v1");
      challenge = randomBytes(16);
      hello = Buffer.concat([ecdh.generateKeys(), challenge]);
      key = undefined;
      state = "ready";
      return this;
    },
    async getPrimaryService(uuid) {
      assert.equal(uuid, SERVICE);
      return { async getCharacteristic(uuid) {
        if (uuid.endsWith("f1")) return { async readValue() { return value(mac); } };
        if (uuid.endsWith("f2")) return { async writeValueWithResponse(chunk) {
          writes.push([...chunk]);
          if (chunk.length === 1 && chunk[0] === 1) { frame = ""; state = resetState; return; }
          frame += new TextDecoder().decode(chunk);
          if (!frame.endsWith("\n")) return;
          const request = JSON.parse(frame);
          if (request.op === "auth") {
            key = createHash("sha256").update(Buffer.concat([ecdh.computeSecret(Buffer.from(request.public, "hex")), challenge, Buffer.from("715204")])).digest();
            const proof = createHmac("sha256", key).update("sentrix-client-v1").digest("hex");
            state = proof === request.proof ? "authenticated" : "invalid_pin";
            hello = createHmac("sha256", key).update("sentrix-device-v1").digest();
            if (badProof) hello[0] ^= 1;
          } else {
            assert.ok(key);
            const data = Buffer.from(request.data, "hex");
            if (tamper) data[0] ^= 1;
            const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(request.iv, "hex"));
            decipher.setAAD(challenge); decipher.setAuthTag(data.subarray(-16));
            try {
              decoded = JSON.parse(Buffer.concat([decipher.update(data.subarray(0, -16)), decipher.final()]).toString());
              state = "connecting";
            } catch { state = "invalid_config"; }
            key = undefined;
          }
        } };
        if (uuid.endsWith("f3")) return { async readValue() {
          if (state === "connecting") return value(states.shift() || "connected");
          return value(state);
        } };
        if (uuid.endsWith("f4")) return { async readValue() { return new DataView(Uint8Array.from(hello).buffer); } };
        assert.fail("Unknown characteristic");
      } };
    },
    disconnect() { if (!this.connected) return; disconnects++; this.connected = false; listeners.splice(0).forEach(fn => fn()); },
  } };
  return { device, writes, decoded: () => decoded, disconnects: () => disconnects };
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
  assert.equal(node.disconnects(), 0);
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
  assert.deepEqual(node.decoded(), { ssid: credentials.ssid, password: credentials.password, group_id: credentials.group_id });
  const wire = new TextDecoder().decode(new Uint8Array(node.writes.flat()));
  assert.ok(!wire.includes(credentials.password));
  assert.ok(!wire.includes(credentials.ssid));
  assert.ok(!wire.includes(credentials.pin));
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
  for (const uuid of source.matchAll(/"(12345678-1234-5678-1234-56789abcdef[0-4])"/g)) {
    assert.ok(firmware.includes(`"${uuid[1]}"`), `Missing firmware UUID ${uuid[1]}`);
  }
});

test("provisioning reuses the authenticated connection", async () => {
  const node = peripheral();
  const api = load();
  await api.authenticateSentrixHardware({ device: node.device }, credentials.pin);
  node.device.gatt.connect = async () => assert.fail("must reuse the live connection");
  await api.provisionSentrixHardware({ device: node.device }, credentials);
  assert.ok(node.writes.length > 1);
  assert.equal(node.disconnects(), 1);
});

test("connection failure is distinguished from a Wi-Fi failure and sends no credentials", async () => {
  const node = peripheral();
  node.device.gatt.connect = async () => { throw new Error("Connection attempt failed."); };
  await assert.rejects(load().provisionSentrixHardware({ device: node.device }, credentials),
    /Bluetooth authentication failed before Wi-Fi settings were sent/);
  assert.equal(node.writes.length, 0);
  assert.equal(node.disconnects(), 0);
});

test("wrong PIN and forged device proof block Wi-Fi transfer", async () => {
  for (const options of [{ pin: "000000" }, { badProof: true }]) {
    const node = peripheral(options);
    await assert.rejects(load().provisionSentrixHardware({ device: node.device }, { ...credentials, pin: options.pin || credentials.pin }), /incorrect|Device authentication failed/);
    assert.equal(node.decoded(), undefined);
  }
});

test("modified ciphertext is rejected", async () => {
  const node = peripheral({ tamper: true });
  await assert.rejects(load().provisionSentrixHardware({ device: node.device }, credentials), /rejected/);
  assert.equal(node.decoded(), undefined);
});

test("disconnect invalidates authentication and creates a fresh session", async () => {
  const node = peripheral();
  const api = load();
  await api.authenticateSentrixHardware({ device: node.device }, credentials.pin);
  node.device.gatt.disconnect();
  await api.provisionSentrixHardware({ device: node.device }, credentials);
  assert.equal(node.decoded().ssid, credentials.ssid);
  assert.equal(node.disconnects(), 2);
});

test("device Wi-Fi failure remains a Wi-Fi error", async () => {
  const node = peripheral({ states: ["wifi_failed"] });
  await assert.rejects(load().provisionSentrixHardware({ device: node.device }, credentials),
    /ESP32 could not join Wi-Fi/);
});
