import type { Metadata } from "next";
import Dashboard from "../dashboard/page";

export const metadata: Metadata = {
  title: "Alerts | Sentrix",
  description: "Review Sentrix equipment anomalies and operator feedback.",
};

export default function AlertsPage() {
  return <Dashboard initialNav="Alerts" />;
}
