import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Alerts | Sentrix",
  description: "Review Sentrix equipment anomalies and operator feedback.",
};

export default function AlertsPage() {
  return (
    <div className="py-8">
      <p className="eyebrow mb-2">Equipment Anomaly Log</p>
      <h1 className="text-xl font-semibold tracking-[-0.045em] sm:text-2xl">Alerts Feed</h1>
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        Chronological log of electrical anomalies and operator resolution history.
      </p>
    </div>
  );
}
