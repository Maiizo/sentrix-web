"use client";

import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

// ---- Schema-aligned types (Prisma: Group, Device, Alert) ----

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
  name: "Alex Valdez",
  email: "a.valdez@sentrix-facilities.com",
  role: "System Administrator",
  department: "Facility Operations & HVAC",
  phone: "+1 (555) 234-8901",
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

const STORAGE_KEY = "sentrix-store-v1";
const HOUR = 3_600_000;
const DAY = 24 * HOUR;

let state: StoreState | null = null;
const listeners = new Set<() => void>();

function createSeed(): StoreState {
  const now = Date.now();
  const iso = (offsetMs: number) => new Date(now + offsetMs).toISOString();

  return {
    groups: [
      {
        id: "grp-main-server-room",
        name: "Main Server Room",
        slug: "main-server-room",
        meshId: "A1B2C3D4E5F6",
        description: "Precision AC circuits cooling the core server racks.",
      },
      {
        id: "grp-east-wing-ac-panel",
        name: "East Wing AC Panel",
        slug: "east-wing-ac-panel",
        meshId: "F6E5D4C3B2A1",
        description: "Split-system AC MCBs serving east wing offices.",
      },
    ],
    devices: [
      {
        id: "dev-crac-01",
        groupId: "grp-main-server-room",
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
        // Day 2 of 7 in its calibration window.
        id: "dev-crac-02",
        groupId: "grp-main-server-room",
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
        id: "dev-split-3f",
        groupId: "grp-east-wing-ac-panel",
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
        id: "dev-split-4f",
        groupId: "grp-east-wing-ac-panel",
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
        deviceId: "dev-crac-01",
        groupId: "grp-main-server-room",
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
        deviceId: "dev-split-3f",
        groupId: "grp-east-wing-ac-panel",
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
        deviceId: "dev-split-3f",
        groupId: "grp-east-wing-ac-panel",
        timestamp: iso(-3 * DAY),
        actualValue: 5.9,
        expectedMax: 11,
        expectedMin: 7.5,
        severity: "WARNING",
        isResolved: true,
        userFeedback: true,
      },
      {
        id: "alt-004",
        deviceId: "dev-crac-01",
        groupId: "grp-main-server-room",
        timestamp: iso(-10 * DAY),
        actualValue: 18.3,
        expectedMax: 16.5,
        expectedMin: 11.8,
        severity: "WARNING",
        isResolved: true,
        userFeedback: false,
      },
    ],
    teamMembers: [
      {
        id: "usr-01",
        name: "Alex Valdez",
        email: "a.valdez@sentrix-facilities.com",
        role: "ADMIN",
        status: "ACTIVE",
        invitedAt: iso(-60 * DAY),
      },
      {
        id: "usr-02",
        name: "Marcus Vance",
        email: "m.vance@sentrix-facilities.com",
        role: "USER",
        status: "ACTIVE",
        invitedAt: iso(-14 * DAY),
      },
      {
        id: "usr-03",
        name: "Elena Rostova",
        email: "e.rostova@cooling-contractors.com",
        role: "USER",
        status: "PENDING",
        invitedAt: iso(-2 * DAY),
      },
    ],
    userProfile: {
      name: "Alex Valdez",
      email: "a.valdez@sentrix-facilities.com",
      role: "System Administrator",
      department: "Facility Operations & HVAC",
      phone: "+1 (555) 234-8901",
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
      const seed = createSeed();
      return {
        ...saved,
        teamMembers: Array.isArray(saved.teamMembers)
          ? saved.teamMembers
          : seed.teamMembers,
        userProfile: saved.userProfile && typeof saved.userProfile === "object"
          ? { ...seed.userProfile, ...saved.userProfile }
          : seed.userProfile,
      } as StoreState;
    }
  } catch {
    // Corrupt storage: fall through to a fresh seed.
  }
  const seed = createSeed();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
  return seed;
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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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

function createGroup(name: string, description = ""): Group {
  const { groups } = getSnapshot();

  const base = slugify(name);
  let slug = base;
  for (let n = 2; groups.some((g) => g.slug === slug); n++) slug = `${base}-${n}`;

  const id = crypto.randomUUID();
  const group: Group = {
    id,
    name: name.trim(),
    slug,
    meshId: id,
    description: description.trim(),
  };
  update((s) => ({ ...s, groups: [...s.groups, group] }));
  return group;
}

function addDeviceToGroup(
  groupId: string,
  payload: { name: string; macAddress: string; pinCode: string; targetTempC: number },
): Device {
  const now = Date.now();
  const device: Device = {
    id: crypto.randomUUID(),
    groupId,
    ...payload,
    status: "CALIBRATING",
    calibrationStartedAt: new Date(now).toISOString(),
    calibrationEndsAt: new Date(now + 7 * DAY).toISOString(),
    liveRmsAmps: 0,
  };
  update((s) => ({ ...s, devices: [...s.devices, device] }));
  return device;
}

function deleteGroup(groupId: string) {
  update((s) => {
    // Find all devices in this group to also cascade delete alerts associated with them
    const groupDeviceIds = new Set(s.devices.filter((d) => d.groupId === groupId).map((d) => d.id));
    return {
      ...s,
      groups: s.groups.filter((g) => g.id !== groupId),
      devices: s.devices.filter((d) => d.groupId !== groupId),
      alerts: s.alerts.filter((a) => a.groupId !== groupId && !groupDeviceIds.has(a.deviceId)),
    };
  });
}

function deleteDevice(deviceId: string) {
  update((s) => ({
    ...s,
    devices: s.devices.filter((d) => d.id !== deviceId),
    alerts: s.alerts.filter((a) => a.deviceId !== deviceId),
  }));
}

function patchAlert(alertId: string, patch: Partial<Alert>) {
  update((s) => ({
    ...s,
    alerts: s.alerts.map((a) => (a.id === alertId ? { ...a, ...patch } : a)),
  }));
}

function submitAlertFeedback(alertId: string, feedback: boolean) {
  patchAlert(alertId, { userFeedback: feedback });
}

function resolveAlert(alertId: string) {
  patchAlert(alertId, { isResolved: true });
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

  if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
    try {
      new Notification("Sentrix Alert: Critical AC MCB Anomaly", {
        body: `${targetDevice?.name ?? "AC Circuit"} spiked to 24.8A (exceeded 16.5A bound).`,
      });
    } catch {
      // Browser notification failed or blocked
    }
  }

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
  const seed = createSeed();
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
    // AC load peaks mid-afternoon and dips before dawn.
    const predicted = nominalAmps * (0.85 + 0.2 * Math.sin(((hour - 9) / 24) * 2 * Math.PI));
    let upperBound = predicted * 1.12;
    let lowerBound = predicted * 0.88;
    let rmsCurrent = predicted * (1 + (random() - 0.5) * 0.12);

    // Pin recorded alerts onto the nearest sample so the chart matches the Alert table.
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
  /** False during server prerender and hydration; true once localStorage is loaded. */
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
