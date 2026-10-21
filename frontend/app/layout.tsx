import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SentrixProvider } from "./lib/sentrix-store";
import { ThemeProvider } from "./lib/theme-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { ConfirmProvider } from "./components/confirm-modal";

export const metadata: Metadata = {
  title: "Sentrix",
  description: "Sentrix",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--canvas)] text-[var(--text-primary)]">
        <ThemeProvider>
          <SentrixProvider>
            <ConfirmProvider>{children}</ConfirmProvider>
          </SentrixProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
