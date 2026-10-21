import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppShell } from "../components/app-shell";

export const metadata: Metadata = {
  title: "Dashboard | Sentrix",
  description: "Sentrix Dashboard",
};

export default function DashboardLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return <AppShell>{children}</AppShell>;
}
