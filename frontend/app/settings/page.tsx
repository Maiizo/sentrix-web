"use client";

import { Suspense, useState, type FormEvent } from "react";
import { AppShell } from "../components/app-shell";
import {
  useSentrix,
  type TeamRole,
} from "../lib/sentrix-store";

type NotificationPreferences = {
  emailAlerts: boolean;
  smsCritical: boolean;
  browserPush: boolean;
};

const DEFAULT_NOTIFICATIONS: NotificationPreferences = {
  emailAlerts: true,
  smsCritical: true,
  browserPush: false,
};

function UserInviteModal({
  onClose,
  onInvite,
}: {
  onClose: () => void;
  onInvite: (name: string, email: string, role: TeamRole) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamRole>("USER");
  const [error, setError] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter member name.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    onInvite(name, email, role);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-[3px]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="surface-card w-full max-w-md overflow-hidden rounded-2xl border border-[var(--border)] shadow-2xl animate-in fade-in zoom-in-95">
        <div className="border-b border-[var(--border)] bg-[var(--surface-hover)] px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              Invite Facility Supervisor
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
              aria-label="Close dialog"
            >
              ✕
            </button>
          </div>
          <p className="mt-1 font-mono text-[10px] text-[var(--text-muted)]">
            Grant workspace access to manage AC circuits and review model feedback.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <p className="rounded-lg border border-red-500/20 bg-red-500/10 p-2 font-mono text-xs text-red-500">
              {error}
            </p>
          )}

          <div>
            <label className="eyebrow mb-1 block">Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Maya Chen"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--canvas)] px-3 py-2 text-xs text-[var(--text-primary)] focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="eyebrow mb-1 block">Work Email</label>
            <input
              type="email"
              required
              placeholder="m.chen@sentrix-facilities.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--canvas)] px-3 py-2 text-xs text-[var(--text-primary)] focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="eyebrow mb-1 block">Access Role</label>
            <div className="grid grid-cols-2 gap-2">
              <label
                className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 text-xs transition ${
                  role === "USER"
                    ? "border-amber-500 bg-amber-500/10 text-amber-500 font-semibold"
                    : "border-[var(--border)] bg-[var(--canvas)] text-[var(--text-secondary)]"
                }`}
              >
                <div>
                  <p>USER (Operator)</p>
                  <p className="font-mono text-[9px] text-[var(--text-muted)]">Resolve alerts & calibrate</p>
                </div>
                <input
                  type="radio"
                  name="role"
                  value="USER"
                  checked={role === "USER"}
                  onChange={() => setRole("USER")}
                  className="sr-only"
                />
              </label>

              <label
                className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 text-xs transition ${
                  role === "ADMIN"
                    ? "border-amber-500 bg-amber-500/10 text-amber-500 font-semibold"
                    : "border-[var(--border)] bg-[var(--canvas)] text-[var(--text-secondary)]"
                }`}
              >
                <div>
                  <p>ADMIN (Manager)</p>
                  <p className="font-mono text-[9px] text-[var(--text-muted)]">Full mesh & user control</p>
                </div>
                <input
                  type="radio"
                  name="role"
                  value="ADMIN"
                  checked={role === "ADMIN"}
                  onChange={() => setRole("ADMIN")}
                  className="sr-only"
                />
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[var(--border)] px-3.5 py-2 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-[#20170a] shadow-sm shadow-amber-500/20 hover:bg-amber-400"
            >
              Send Invitation →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SettingsContent() {
  const { ready, teamMembers, inviteTeamMember, resetDemoData } = useSentrix();

  // Profile Form State with lazy localStorage initialization
  const [fullName, setFullName] = useState(() => {
    if (typeof window === "undefined") return "Alex Valdez";
    try {
      const saved = localStorage.getItem("sentrix-user-profile");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.name) return parsed.name;
      }
    } catch {}
    return "Alex Valdez";
  });

  const [workEmail, setWorkEmail] = useState(() => {
    if (typeof window === "undefined") return "a.valdez@sentrix-facilities.com";
    try {
      const saved = localStorage.getItem("sentrix-user-profile");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.email) return parsed.email;
      }
    } catch {}
    return "a.valdez@sentrix-facilities.com";
  });

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);

  // Invite Modal State
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Notifications State with lazy localStorage initialization
  const [notifications, setNotifications] = useState<NotificationPreferences>(() => {
    if (typeof window === "undefined") return DEFAULT_NOTIFICATIONS;
    try {
      const saved = localStorage.getItem("sentrix-notification-settings");
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_NOTIFICATIONS;
  });
  const [notificationsSaved, setNotificationsSaved] = useState(false);

  // Reset confirmation state
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetMessage, setResetMessage] = useState(false);

  function handleSaveProfile(e: FormEvent) {
    e.preventDefault();
    try {
      localStorage.setItem(
        "sentrix-user-profile",
        JSON.stringify({ name: fullName, email: workEmail }),
      );
    } catch {}
    setProfileSaved(true);
    setCurrentPassword("");
    setNewPassword("");
    setTimeout(() => setProfileSaved(false), 3000);
  }

  async function handleTogglePush(enable: boolean) {
    if (enable && typeof window !== "undefined" && "Notification" in window) {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setNotifications((prev) => ({ ...prev, browserPush: false }));
        return;
      }
    }
    const updated = { ...notifications, browserPush: enable };
    setNotifications(updated);
    try {
      localStorage.setItem("sentrix-notification-settings", JSON.stringify(updated));
    } catch {}
    setNotificationsSaved(true);
    setTimeout(() => setNotificationsSaved(false), 2500);
  }

  function handleToggleSetting(key: "emailAlerts" | "smsCritical") {
    const updated = { ...notifications, [key]: !notifications[key] };
    setNotifications(updated);
    try {
      localStorage.setItem("sentrix-notification-settings", JSON.stringify(updated));
    } catch {}
    setNotificationsSaved(true);
    setTimeout(() => setNotificationsSaved(false), 2500);
  }

  function handleResetSeed() {
    resetDemoData();
    setConfirmReset(false);
    setResetMessage(true);
    setTimeout(() => setResetMessage(false), 3500);
  }

  if (!ready) {
    return (
      <AppShell>
        <p className="py-24 text-center font-mono text-xs text-[var(--text-muted)]">
          Loading workspace preferences…
        </p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-4xl space-y-8">
        {/* Page Header */}
        <div>
          <p className="eyebrow mb-1">System Administration</p>
          <h1 className="text-xl font-semibold tracking-[-0.045em] text-[var(--text-primary)] sm:text-2xl">
            Workspace Settings
          </h1>
          <p className="mt-1 text-xs text-[var(--text-secondary)] sm:text-sm">
            Manage your supervisor credentials, organization team access, and anomaly notification channels.
          </p>
        </div>

        {/* Global Feedback Messages */}
        {resetMessage && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 font-mono text-xs text-emerald-400">
            <span>✓</span>
            <span>Demo data reset successfully! Default groups, AC devices, and alerts restored.</span>
          </div>
        )}

        {/* PANEL 1: PROFILE SETTINGS */}
        <section className="surface-card rounded-2xl border border-[var(--border)] p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                Profile Settings
              </h2>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                Personal credentials and display information for operator feedback attribution.
              </p>
            </div>
            {profileSaved && (
              <span className="font-mono text-xs text-emerald-500 font-semibold animate-in fade-in">
                ✓ Saved to local storage
              </span>
            )}
          </div>

          <form onSubmit={handleSaveProfile} className="mt-5 space-y-4 max-w-xl">
            <div>
              <label className="eyebrow mb-1.5 block">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--canvas)] px-3 py-2 text-xs text-[var(--text-primary)] focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="eyebrow mb-1.5 block">Work Email</label>
              <input
                type="email"
                required
                value={workEmail}
                onChange={(e) => setWorkEmail(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--canvas)] px-3 py-2 text-xs text-[var(--text-primary)] focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="eyebrow mb-1.5 block">Current Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--canvas)] px-3 py-2 text-xs text-[var(--text-primary)] focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="eyebrow mb-1.5 block">New Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--canvas)] px-3 py-2 text-xs text-[var(--text-primary)] focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                id="save-profile-btn"
                className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-[#20170a] shadow-sm shadow-amber-500/20 hover:bg-amber-400 transition"
              >
                Save Profile Changes
              </button>
            </div>
          </form>
        </section>

        {/* PANEL 2: ORGANIZATION SETTINGS */}
        <section className="surface-card rounded-2xl border border-[var(--border)] p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                Organization Team Access
              </h2>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                Facility team members and certified cooling supervisors authorized for this workspace.
              </p>
            </div>
            <button
              type="button"
              id="invite-member-btn"
              onClick={() => setShowInviteModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-[var(--surface-hover)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] hover:border-amber-500 transition"
            >
              <span>+</span>
              <span>Invite Team Member</span>
            </button>
          </div>

          <div className="mt-4 divide-y divide-[var(--border)]">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3.5"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface-hover)] border border-[var(--border)] font-mono text-xs font-bold text-amber-500">
                    {member.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-[var(--text-primary)]">
                        {member.name}
                      </p>
                      <span
                        className={`font-mono text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          member.role === "ADMIN"
                            ? "bg-amber-500/15 text-amber-500 border border-amber-500/30"
                            : "bg-[var(--surface-hover)] text-[var(--text-muted)] border border-[var(--border)]"
                        }`}
                      >
                        {member.role}
                      </span>
                    </div>
                    <p className="font-mono text-[11px] text-[var(--text-muted)]">
                      {member.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <span
                    className={`font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      member.status === "ACTIVE"
                        ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                    }`}
                  >
                    {member.status === "ACTIVE" ? "● Active" : "○ Invite Pending"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* PANEL 3: NOTIFICATION PREFERENCES */}
        <section className="surface-card rounded-2xl border border-[var(--border)] p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                Notification Channels & Thresholds
              </h2>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                Configure real-time dispatch alerts when AC circuit currents breach Auto-ARIMA safe bounds.
              </p>
            </div>
            {notificationsSaved && (
              <span className="font-mono text-xs text-emerald-500 font-semibold animate-in fade-in">
                ✓ Preferences updated
              </span>
            )}
          </div>

          <div className="mt-5 space-y-4 max-w-xl">
            {/* Email Alerts Toggle */}
            <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--canvas)] p-4">
              <div>
                <p className="text-xs font-semibold text-[var(--text-primary)]">
                  Email Alerts for AC Anomalies
                </p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Receive email digest with telemetry chart screenshots whenever a WARNING or CRITICAL anomaly triggers.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggleSetting("emailAlerts")}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  notifications.emailAlerts ? "bg-amber-500" : "bg-[var(--border)]"
                }`}
                role="switch"
                aria-checked={notifications.emailAlerts}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    notifications.emailAlerts ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* SMS Alerts Toggle */}
            <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--canvas)] p-4">
              <div>
                <p className="text-xs font-semibold text-[var(--text-primary)]">
                  SMS Alerts for Critical Breaches
                </p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Instant SMS dispatch to on-duty facilities managers for equipment overload (&gt;150% baseline).
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggleSetting("smsCritical")}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  notifications.smsCritical ? "bg-amber-500" : "bg-[var(--border)]"
                }`}
                role="switch"
                aria-checked={notifications.smsCritical}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    notifications.smsCritical ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Browser Push Notifications */}
            <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--canvas)] p-4">
              <div>
                <p className="text-xs font-semibold text-[var(--text-primary)]">
                  Browser Push Notifications
                </p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Displays native desktop notifications even when this browser tab is running in the background.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleTogglePush(!notifications.browserPush)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  notifications.browserPush ? "bg-amber-500" : "bg-[var(--border)]"
                }`}
                role="switch"
                aria-checked={notifications.browserPush}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    notifications.browserPush ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* DANGER ZONE: RESET DEMO DATA */}
          <div className="mt-8 border-t border-[var(--border)] pt-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="eyebrow text-red-500 mb-0.5">Demo & Maintenance Zone</p>
                <p className="text-xs font-semibold text-[var(--text-primary)]">
                  Reset Demo Telemetry & Node State
                </p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Restore original mock groups, commercial AC MCB units, and initial alert history.
                </p>
              </div>

              {!confirmReset ? (
                <button
                  type="button"
                  id="reset-demo-data-btn"
                  onClick={() => setConfirmReset(true)}
                  className="rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2 text-xs font-semibold text-red-500 hover:bg-red-500/20 transition"
                >
                  Reset Demo Data
                </button>
              ) : (
                <div className="flex items-center gap-2 animate-in fade-in">
                  <span className="font-mono text-xs text-red-500">Confirm reset?</span>
                  <button
                    type="button"
                    onClick={handleResetSeed}
                    className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-500 transition"
                  >
                    Yes, Reset
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* User Invite Modal */}
        {showInviteModal && (
          <UserInviteModal
            onClose={() => setShowInviteModal(false)}
            onInvite={(name, email, role) => {
              inviteTeamMember(name, email, role);
            }}
          />
        )}
      </div>
    </AppShell>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <p className="py-24 text-center font-mono text-xs text-[var(--text-muted)]">
            Loading workspace preferences…
          </p>
        </AppShell>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
