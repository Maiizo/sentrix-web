import type { Metadata } from "next";
import Dashboard from "../dashboard/page";

export const metadata: Metadata = {
  title: "Settings | Sentrix",
  description: "Manage Sentrix workspace preferences and notifications.",
};

export default function SettingsPage() {
  return <Dashboard initialNav="Settings" />;
}
