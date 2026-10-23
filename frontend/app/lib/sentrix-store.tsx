"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { isSupabaseConfigured, supabase } from "./supabase-browser";

// ---- Schema-aligned types (Prisma/Supabase: Group, Device, Alert) ----

export type Group = {
  id: string;
  name: string;
  slug: string;
  meshId: string;
  description: string;
};

export type DeviceStatus = "CALIBRATING" | "ACTIVE" | "OFFLINE";

export type Device = {
  id: string;
  groupId: string;
  name: string;
  macAddress: string;
  pinCode: string;
  status: DeviceStatus;
  targetTempC: number;
  calibrationStartedAt: string;
  calibrationEndsAt: string;
  liveRmsAmps: number;
};

export type AlertSeverity = "WARNING" | "CRITICAL";

export type Alert = {
  id: string;
  deviceId: string;
  groupId: string;
  timestamp: string;
  actualValue: number;
  expectedMax: number;
  expectedMin: number;
  severity: AlertSeverity;
  isResolved: boolean;
  userFeedback: boolean | null;
  dispatchedAt?: string | null;
};

export type TeamRole = "ADMIN" | "USER";

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  status: "ACTIVE" | "PENDING";
  invitedAt: string;
};

export type TelemetryRange = "1h" | "24h" | "7d";

/** Telemetry reading joined with its PredictionBound for charting. */
export type TelemetryPoint = {
  timestamp: string;
  timeLabel: string;
  rmsCurrent: number;
  upperBound: number;
  lowerBound: number;
  isAnomaly: boolean;
};

export type UserProfile = {
  name: string;
  email: string;
  avatarUrl?: string;
  role: string;
  phone?: string;
  department?: string;
};

export const DEFAULT_USER_PROFILE: UserProfile = {
  name: "User",
  email: "",
  role: "Operator",
  department: "",
  phone: "",
  avatarUrl: "",
};

type StoreState = {
  groups: Group[];
  devices: Device[];
  alerts: Alert[];
  teamMembers: TeamMember[];
  userProfile: UserProfile;
};

// ---- External store (client-only; server snapshot is null) ----

const STORAGE_KEY = "sentrix-store-v2";
const HOUR = 3_600_000;
const DAY = 24 * HOUR;

let state: StoreState | null = null;
const listeners = new Set<() => void>();

function isDemoSession(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const demo =
      localStorage.getItem("sentrix-demo-session") ||
      sessionStorage.getItem("sentrix-demo-session");
    if (demo === "active") return true;

    // Check supabase auth token in localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("sb-") && key.endsWith("-auth-token")) {
        const raw = localStorage.getItem(key);
        if (raw && raw.toLowerCase().includes("demo")) return true;
      }
    }
  } catch {
    // Ignore storage errors
  }
  return false;
}

function createEmptyState(): StoreState {
  return {
    groups: [],
    devices: [],
    alerts: [],
    teamMembers: [],
    userProfile: DEFAULT_USER_PROFILE,
  };
}

/** Demo Seed used ONLY when logging in with a DEMO account */
function createDemoSeed(): StoreState {
  const now = Date.now();
  const iso = (offsetMs: number) => new Date(now + offsetMs).toISOString();

  return {
    groups: [
      {
        id: "11111111-1111-1111-1111-111111111111",
        name: "Main Server Room",
        slug: "main-server-room",
        meshId: "A1B2C3D4E5F6",
        description: "",
      },
      {
        id: "22222222-2222-2222-2222-222222222222",
        name: "East Wing AC Panel",
        slug: "east-wing-ac-panel",
        meshId: "F6E5D4C3B2A1",
        description: "",
      },
    ],
    devices: [
      {
        id: "aaaaaaaa-1111-1111-1111-111111111111",
        groupId: "11111111-1111-1111-1111-111111111111",
        name: "CRAC Unit 01 · MCB",
        macAddress: "24:6F:28:A1:3C:01",
        pinCode: "482913",
        status: "ACTIVE",
        targetTempC: 18,
        calibrationStartedAt: iso(-30 * DAY),
        calibrationEndsAt: iso(-23 * DAY),
        liveRmsAmps: 14.2,
      },
      {
        id: "aaaaaaaa-2222-2222-2222-222222222222",
        groupId: "11111111-1111-1111-1111-111111111111",
        name: "CRAC Unit 02 · MCB",
        macAddress: "24:6F:28:A1:3C:02",
        pinCode: "715204",
        status: "CALIBRATING",
        targetTempC: 18,
        calibrationStartedAt: iso(-1.5 * DAY),
        calibrationEndsAt: iso(5.5 * DAY),
        liveRmsAmps: 12.8,
      },
      {
        id: "bbbbbbbb-1111-1111-1111-111111111111",
        groupId: "22222222-2222-2222-2222-222222222222",
        name: "Split AC 3F-East · MCB",
        macAddress: "24:6F:28:B7:91:0A",
        pinCode: "390671",
        status: "ACTIVE",
        targetTempC: 23,
        calibrationStartedAt: iso(-21 * DAY),
        calibrationEndsAt: iso(-14 * DAY),
        liveRmsAmps: 9.6,
      },
      {
        id: "bbbbbbbb-2222-2222-2222-222222222222",
        groupId: "22222222-2222-2222-2222-222222222222",
        name: "Split AC 4F-East · MCB",
        macAddress: "24:6F:28:B7:91:0B",
        pinCode: "604158",
        status: "OFFLINE",
        targetTempC: 24,
        calibrationStartedAt: iso(-21 * DAY),
        calibrationEndsAt: iso(-14 * DAY),
        liveRmsAmps: 0,
      },
    ],
    alerts: [
      {
        id: "alt-001",
        deviceId: "aaaaaaaa-1111-1111-1111-111111111111",
        groupId: "11111111-1111-1111-1111-111111111111",
        timestamp: iso(-2 * HOUR),
        actualValue: 21.4,
        expectedMax: 16.5,
        expectedMin: 11.8,
        severity: "CRITICAL",
        isResolved: false,
        userFeedback: null,
      },
      {
        id: "alt-002",
        deviceId: "bbbbbbbb-1111-1111-1111-111111111111",
        groupId: "22222222-2222-2222-2222-222222222222",
        timestamp: iso(-9 * HOUR),
        actualValue: 12.1,
        expectedMax: 11,
        expectedMin: 7.5,
        severity: "WARNING",
        isResolved: false,
        userFeedback: null,
      },
      {
        id: "alt-003",
        deviceId: "bbbbbbbb-1111-1111-1111-111111111111",
        groupId: "22222222-2222-2222-2222-222222222222",
        timestamp: iso(-3 * DAY),
        actualValue: 5.9,
        expectedMax: 11,
        expectedMin: 7.5,
        severity: "WARNING",
        isResolved: true,
        userFeedback: true,
      },
    ],
    teamMembers: [],
    userProfile: {
      name: "Demo Administrator",
      email: "demo@sentrix.my.id",
      role: "System Administrator",
      department: "Facility Operations",
      phone: "",
      avatarUrl: "",
    },
  };
}

function load(): StoreState {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    if (
      Array.isArray(saved?.groups) &&
      Array.isArray(saved?.devices) &&
      Array.isArray(saved?.alerts)
    ) {
      return saved as StoreState;
    }
  } catch {
    // Fall through to default
  }

  // If demo account session, load demo seed; otherwise load empty database state!
  const initial = isDemoSession() ? createDemoSeed() : createEmptyState();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  } catch {}
  return initial;
}

function getSnapshot(): StoreState {
  if (!state) state = load();
  return state;
}

function getServerSnapshot(): StoreState | null {
  return null;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function update(updater: (current: StoreState) => StoreState) {
  state = updater(getSnapshot());
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
  listeners.forEach((listener) => listener());
}

// ---- Helpers ----

function slugify(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "group"
  );
}

function generateMeshId(): string {
  return Array.from({ length: 12 }, () =>
    Math.floor(Math.random() * 16).toString(16).toUpperCase(),
  ).join("");
}

export async function syncFromSupabase() {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) return;

    const email = session.user.email?.toLowerCase() || "";
    const isDemo = email.includes("demo");

    // Fetch database tables
    const [groupsRes, devicesRes, alertsRes, userRes] = await Promise.all([
      supabase.from("groups").select("*"),
      supabase.from("devices").select("*"),
      supabase.from("alerts").select("*"),
      supabase.from("users").select("*").eq("id", session.user.id).maybeSingle(),
    ]);

    const groupsData = groupsRes.data ?? [];
    const devicesData = devicesRes.data ?? [];
    const alertsData = alertsRes.data ?? [];
    const userData = userRes.data;

    // If demo account and database has no rows yet, provide demo seed for demo account
    if (isDemo && groupsData.length === 0) {
      const demoSeed = createDemoSeed();
      update(() => demoSeed);
      return;
    }

    // Map from real database tables
    const mappedGroups: Group[] = groupsData.map((g: { id: string; name: string; mesh_id?: string; description?: string }) => ({
      id: g.id,
      name: g.name,
      slug: slugify(g.name),
      meshId: g.mesh_id || "",
      description: g.description || "",
    }));

    const mappedDevices: Device[] = devicesData.map((d: { id: string; group_id: string; name?: string; mac_address: string; pin_code: string; status?: string; calibration_started_at?: string; calibration_ends_at?: string }) => ({
      id: d.id,
      groupId: d.group_id,
      name: d.name || `Sensor ${d.mac_address}`,
      macAddress: d.mac_address,
      pinCode: d.pin_code,
      status: (d.status || "ACTIVE") as DeviceStatus,
      targetTempC: 22,
      calibrationStartedAt: d.calibration_started_at || new Date().toISOString(),
      calibrationEndsAt: d.calibration_ends_at || new Date().toISOString(),
      liveRmsAmps: 0,
    }));

    const mappedAlerts: Alert[] = alertsData.map((a: { id: string; device_id: string; timestamp: string; actual_value: number; expected_max: number; expected_min: number; severity: string; is_resolved: boolean; user_feedback: boolean | null }) => ({
      id: a.id,
      deviceId: a.device_id,
      groupId: mappedDevices.find((d) => d.id === a.device_id)?.groupId || "",
      timestamp: a.timestamp,
      actualValue: a.actual_value,
      expectedMax: a.expected_max,
      expectedMin: a.expected_min,
      severity: (a.severity || "WARNING") as AlertSeverity,
      isResolved: a.is_resolved,
      userFeedback: a.user_feedback,
      dispatchedAt: null,
    }));

    const profile: UserProfile = {
      name:
        userData?.name ||
        session.user.user_metadata?.full_name ||
        session.user.email?.split("@")[0] ||
        "User",
      email: session.user.email || "",
      role: userData?.role === "ADMIN" ? "System Administrator" : "Operator",
      department: "",
      phone: "",
      avatarUrl: "",
    };

    update(() => ({
      groups: mappedGroups,
      devices: mappedDevices,
      alerts: mappedAlerts,
      teamMembers: [],
      userProfile: profile,
    }));
  } catch (err) {
    console.error("Failed to sync from database:", err);
  }
}

function createGroup(name: string, description = ""): Group {
  const { groups } = getSnapshot();

  const base = slugify(name);
  let slug = base;
  for (let n = 2; groups.some((g) => g.slug === slug); n++) slug = `${base}-${n}`;

  const id = crypto.randomUUID();
  const meshId = generateMeshId();
  const group: Group = {
    id,
    name: name.trim(),
    slug,
    meshId,
    description: description.trim(),
  };
  update((s) => ({ ...s, groups: [...s.groups, group] }));

  const client = supabase;
  if (isSupabaseConfigured && client) {
    client.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        client
          .from("groups")
          .insert({
            id: group.id,
            user_id: session.user.id,
            name: group.name,
            mesh_id: meshId,
            description: group.description,
          })
          .then(() => {});
      }
    });
  }

  return group;
}

export function assertDeviceNotRegistered(macAddress: string) {
  const mac = macAddress.trim().toUpperCase();
  if (!/^(?:[0-9A-F]{2}:){5}[0-9A-F]{2}$/.test(mac)) {
    throw new Error("Invalid hardware MAC address. Rescan the device.");
  }
  // Read persisted data so another tab's completed registration is also detected.
  const current = load();
  const existing = current.devices.find(d => d.macAddress.trim().toUpperCase() === mac);
  if (existing) {
    const group = current.groups.find(g => g.id === existing.groupId);
    throw new Error(`This device is already registered as "${existing.name}" in "${group?.name ?? "another group"}". Remove its existing registration before adding it again.`);
  }
}

function addDeviceToGroup(
  groupId: string,
  payload: { name: string; macAddress: string; pinCode: string; targetTempC: number },
): Device {
  assertDeviceNotRegistered(payload.macAddress);
  state = load();
  const now = Date.now();
  const device: Device = {
    id: crypto.randomUUID(),
    groupId,
    ...payload,
    macAddress: payload.macAddress.trim().toUpperCase(),
    status: "CALIBRATING",
    calibrationStartedAt: new Date(now).toISOString(),
    calibrationEndsAt: new Date(now + 7 * DAY).toISOString(),
    liveRmsAmps: 0,
  };
  update((s) => ({ ...s, devices: [...s.devices, device] }));

  if (isSupabaseConfigured && supabase) {
    const cleanMac = payload.macAddress.replace(/[^0-9A-Fa-f]/g, "").toUpperCase();
    const cleanPin = payload.pinCode.replace(/[^0-9]/g, "");
    if (cleanMac.length === 12 && cleanPin.length === 6) {
      supabase
        .from("devices")
        .insert({
          id: device.id,
          group_id: groupId,
          name: payload.name,
          mac_address: cleanMac,
          pin_code: cleanPin,
          status: "CALIBRATING",
          calibration_started_at: device.calibrationStartedAt,
          calibration_ends_at: device.calibrationEndsAt,
        })
        .then(() => {});
    }
  }

  return device;
}

function deleteGroup(groupId: string) {
  update((s) => {
    const groupDeviceIds = new Set(s.devices.filter((d) => d.groupId === groupId).map((d) => d.id));
    return {
      ...s,
      groups: s.groups.filter((g) => g.id !== groupId),
      devices: s.devices.filter((d) => d.groupId !== groupId),
      alerts: s.alerts.filter((a) => a.groupId !== groupId && !groupDeviceIds.has(a.deviceId)),
    };
  });

  if (isSupabaseConfigured && supabase) {
    supabase.from("groups").delete().eq("id", groupId).then(() => {});
  }
}

function deleteDevice(deviceId: string) {
  update((s) => ({
    ...s,
    devices: s.devices.filter((d) => d.id !== deviceId),
    alerts: s.alerts.filter((a) => a.deviceId !== deviceId),
  }));

  if (isSupabaseConfigured && supabase) {
    supabase.from("devices").delete().eq("id", deviceId).then(() => {});
  }
}

function patchAlert(alertId: string, patch: Partial<Alert>) {
  update((s) => ({
    ...s,
    alerts: s.alerts.map((a) => (a.id === alertId ? { ...a, ...patch } : a)),
  }));
}

function submitAlertFeedback(alertId: string, feedback: boolean) {
  patchAlert(alertId, { userFeedback: feedback });
  if (isSupabaseConfigured && supabase) {
    supabase.from("alerts").update({ user_feedback: feedback }).eq("id", alertId).then(() => {});
  }
}

function resolveAlert(alertId: string) {
  patchAlert(alertId, { isResolved: true });
  if (isSupabaseConfigured && supabase) {
    supabase.from("alerts").update({ is_resolved: true }).eq("id", alertId).then(() => {});
  }
}

function dispatchMaintenance(alertId: string) {
  patchAlert(alertId, { dispatchedAt: new Date().toISOString() });
}

function simulateNewAnomaly(): Alert {
  const { devices, groups } = getSnapshot();
  const targetDevice = devices.find((d) => d.status === "ACTIVE") ?? devices[0];
  const targetGroup = groups.find((g) => g.id === targetDevice?.groupId) ?? groups[0];

  const now = Date.now();
  const alert: Alert = {
    id: `alt-${now.toString().slice(-5)}`,
    deviceId: targetDevice?.id ?? "dev-crac-01",
    groupId: targetGroup?.id ?? "grp-main-server-room",
    timestamp: new Date(now).toISOString(),
    actualValue: 24.8,
    expectedMax: 16.5,
    expectedMin: 11.2,
    severity: "CRITICAL",
    isResolved: false,
    userFeedback: null,
    dispatchedAt: null,
  };

  update((s) => ({ ...s, alerts: [alert, ...s.alerts] }));
  return alert;
}

function inviteTeamMember(name: string, email: string, role: TeamRole = "USER"): TeamMember {
  const member: TeamMember = {
    id: `usr-${Date.now().toString().slice(-5)}`,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    role,
    status: "PENDING",
    invitedAt: new Date().toISOString(),
  };
  update((s) => ({ ...s, teamMembers: [...(s.teamMembers ?? []), member] }));
  return member;
}

function updateUserProfile(updates: Partial<UserProfile>): UserProfile {
  let updatedProfile: UserProfile = DEFAULT_USER_PROFILE;
  update((s) => {
    updatedProfile = {
      ...(s.userProfile ?? DEFAULT_USER_PROFILE),
      ...updates,
    };
    return { ...s, userProfile: updatedProfile };
  });

  const client = supabase;
  if (isSupabaseConfigured && client && updates.name) {
    client.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        client.from("users").update({ name: updates.name }).eq("id", session.user.id).then(() => {});
      }
    });
  }

  return updatedProfile;
}

function resetUserProfile(): UserProfile {
  const defaultProfile = DEFAULT_USER_PROFILE;
  update((s) => ({ ...s, userProfile: defaultProfile }));
  return defaultProfile;
}

function clearUserAvatar(): UserProfile {
  return updateUserProfile({ avatarUrl: "" });
}

function resetDemoData() {
  const seed = createDemoSeed();
  state = seed;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
  } catch {}
  listeners.forEach((listener) => listener());
}

/** Deterministic PRNG so a device's chart is stable across renders. */
function seededRandom(seed: string) {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

const RANGE_CONFIG: Record<TelemetryRange, { points: number; stepMs: number }> = {
  "1h": { points: 60, stepMs: 60_000 },
  "24h": { points: 96, stepMs: 15 * 60_000 },
  "7d": { points: 168, stepMs: HOUR },
};

function getTelemetryWithBounds(deviceId: string, range: TelemetryRange): TelemetryPoint[] {
  const snapshot = state;
  const device = snapshot?.devices.find((d) => d.id === deviceId);
  if (!snapshot || !device) return [];

  const { points, stepMs } = RANGE_CONFIG[range];
  const end = Math.floor(Date.now() / stepMs) * stepMs;
  const start = end - (points - 1) * stepMs;
  const nominalAmps = device.liveRmsAmps || 10;
  const random = seededRandom(`${deviceId}:${range}`);
  const deviceAlerts = snapshot.alerts.filter((a) => a.deviceId === deviceId);

  return Array.from({ length: points }, (_, i) => {
    const time = new Date(start + i * stepMs);
    const hour = time.getHours() + time.getMinutes() / 60;
    const predicted = nominalAmps * (0.85 + 0.2 * Math.sin(((hour - 9) / 24) * 2 * Math.PI));
    let upperBound = predicted * 1.12;
    let lowerBound = predicted * 0.88;
    let rmsCurrent = predicted * (1 + (random() - 0.5) * 0.12);

    const alert = deviceAlerts.find(
      (a) => Math.abs(new Date(a.timestamp).getTime() - time.getTime()) < stepMs / 2,
    );
    if (alert) {
      rmsCurrent = alert.actualValue;
      upperBound = alert.expectedMax;
      lowerBound = alert.expectedMin;
    }

    return {
      timestamp: time.toISOString(),
      timeLabel: time.toLocaleString(
        "en-GB",
        range === "7d"
          ? { weekday: "short", hour: "2-digit", minute: "2-digit" }
          : { hour: "2-digit", minute: "2-digit" },
      ),
      rmsCurrent: Number(rmsCurrent.toFixed(2)),
      upperBound: Number(upperBound.toFixed(2)),
      lowerBound: Number(lowerBound.toFixed(2)),
      isAnomaly: rmsCurrent > upperBound || rmsCurrent < lowerBound,
    };
  });
}

// ---- Context ----

type SentrixContextValue = StoreState & {
  ready: boolean;
  createGroup: typeof createGroup;
  deleteGroup: typeof deleteGroup;
  addDeviceToGroup: typeof addDeviceToGroup;
  deleteDevice: typeof deleteDevice;
  submitAlertFeedback: typeof submitAlertFeedback;
  resolveAlert: typeof resolveAlert;
  dispatchMaintenance: typeof dispatchMaintenance;
  simulateNewAnomaly: typeof simulateNewAnomaly;
  inviteTeamMember: typeof inviteTeamMember;
  resetDemoData: typeof resetDemoData;
  getTelemetryWithBounds: typeof getTelemetryWithBounds;
  updateUserProfile: typeof updateUserProfile;
  resetUserProfile: typeof resetUserProfile;
  clearUserAvatar: typeof clearUserAvatar;
};

const SentrixContext = createContext<SentrixContextValue | null>(null);

export function SentrixProvider({ children }: { children: ReactNode }) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    syncFromSupabase();
    if (isSupabaseConfigured && supabase) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(() => {
        syncFromSupabase();
      });
      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const value = useMemo<SentrixContextValue>(
    () => ({
      groups: snapshot?.groups ?? [],
      devices: snapshot?.devices ?? [],
      alerts: snapshot?.alerts ?? [],
      teamMembers: snapshot?.teamMembers ?? [],
      userProfile: snapshot?.userProfile ?? DEFAULT_USER_PROFILE,
      ready: snapshot !== null,
      createGroup,
      deleteGroup,
      addDeviceToGroup,
      deleteDevice,
      submitAlertFeedback,
      resolveAlert,
      dispatchMaintenance,
      simulateNewAnomaly,
      inviteTeamMember,
      resetDemoData,
      getTelemetryWithBounds,
      updateUserProfile,
      resetUserProfile,
      clearUserAvatar,
    }),
    [snapshot],
  );

  return <SentrixContext.Provider value={value}>{children}</SentrixContext.Provider>;
}

export function useSentrix() {
  const context = useContext(SentrixContext);
  if (!context) throw new Error("useSentrix must be used inside <SentrixProvider>");
  return context;
}
