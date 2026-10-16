import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Settings | Sentrix",
  description: "Manage Sentrix workspace preferences and notifications.",
};

export default function SettingsPage() {
  return (
    <div className="py-8">
      <p className="eyebrow mb-2">System Preferences</p>
      <h1 className="text-xl font-semibold tracking-[-0.045em] sm:text-2xl">Workspace Settings</h1>
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        Manage alerting thresholds, Wi-Fi defaults, and mesh network parameters.
      </p>
    </div>
  );
}
