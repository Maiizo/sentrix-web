import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import { webcrypto } from "node:crypto";
import ts from "typescript";

const source = readFileSync(new URL("../app/lib/sentrix-store.tsx", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source + "\nexport { addDeviceToGroup, deleteDevice };", {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
});
function setup() {
  let saved = JSON.stringify({ groups: [{ id: "a", name: "East Wing" }, { id: "b", name: "West Wing" }], devices: [], alerts: [] });
  const exports = {};
  runInNewContext(outputText, {
    exports, crypto: webcrypto, Error,
    require: () => ({ createContext: () => ({}) }),
    localStorage: { getItem: () => saved, setItem: (_, value) => { saved = value; } },
  });
  return { api: exports, read: () => JSON.parse(saved), write: value => { saved = JSON.stringify(value); } };
}
const device = { name: "Sensor", macAddress: "24:6F:28:C2:5E:19", pinCode: "", targetTempC: 22 };

test("same hardware cannot be registered in either the same or a different group", () => {
  const { api, read } = setup();
  api.addDeviceToGroup("a", device);
  for (const group of ["a", "b"]) {
    assert.throws(() => api.addDeviceToGroup(group, { ...device, name: "Renamed", macAddress: " 24:6f:28:c2:5e:19 " }), /already registered.*East Wing/);
  }
  assert.equal(read().devices.length, 1);
  assert.equal(read().devices[0].groupId, "a");
});

test("preflight catches a completed registration from another tab", () => {
  const { api, read, write } = setup();
  api.assertDeviceNotRegistered(device.macAddress);
  write({ ...read(), devices: [{ ...device, groupId: "b" }] });
  assert.throws(() => api.assertDeviceNotRegistered(device.macAddress), /West Wing/);
});

test("explicit removal permits re-registration; new MACs remain independent", () => {
  const { api, read } = setup();
  const first = api.addDeviceToGroup("a", device);
  api.deleteDevice(first.id);
  api.addDeviceToGroup("b", { ...device, macAddress: device.macAddress.toLowerCase() });
  api.addDeviceToGroup("a", { ...device, macAddress: "24:6F:28:C2:5E:20" });
  assert.equal(read().devices.length, 2);
  assert.equal(read().devices[0].macAddress, device.macAddress);
});

test("invalid identities never enter the store", () => {
  const { api, read } = setup();
  assert.throws(() => api.addDeviceToGroup("a", { ...device, macAddress: "browser-id" }), /Invalid hardware/);
  assert.equal(read().devices.length, 0);
});
