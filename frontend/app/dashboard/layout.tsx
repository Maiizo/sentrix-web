import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Global Overview | Sentrix",
  description: "AC energy use, unit health, and estimated climate impact.",
};

export default function DashboardLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return children;
}
