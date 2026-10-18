"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect, useState, type ReactNode } from "react";
import { Brand } from "./brand";
import { AccountSettingsModal } from "./account-settings-modal";
import { useSentrix } from "../lib/sentrix-store";
import { useTheme } from "../lib/theme-context";
import { ThemeToggle } from "./theme-toggle";
import { isSupabaseConfigured, supabase } from "../lib/supabase-browser";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/alerts", label: "Alerts" },
  { href: "/settings", label: "Settings" },
];

function NavLinks({ activeHref }: { activeHref?: string }) {
  return NAV_LINKS.map(({ href, label }) => (
    <Link
      key={href}
      href={href}
      aria-current={href === activeHref ? "page" : undefined}
      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
        href === activeHref
          ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
          : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
      }`}
    >
      {label}
    </Link>
  ));
}

/** Isolated so only this part suspends on routes with unknown dynamic params. */
function ActiveNavLinks() {
  const pathname = usePathname();
  const active = NAV_LINKS.find(({ href }) => pathname.startsWith(href));
  return <NavLinks activeHref={active?.href} />;
}

function NotificationsBell() {
  const { alerts, devices } = useSentrix();
  const [open, setOpen] = useState(false);
  const unresolved = alerts
    .filter((alert) => !alert.isResolved)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-secondary)] transition hover:bg-[var(--surface-hover)]"
        aria-label={`Notifications (${unresolved.length} unresolved)`}
        aria-expanded={open}
      >
        <svg viewBox="0 0 24 24" className="h-[17px] w-[17px]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
          <path d="M10 21h4" />
        </svg>
        {unresolved.length > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 font-mono text-[9px] font-semibold text-white ring-2 ring-[var(--canvas)]">
            {unresolved.length}
          </span>
        )}
      </button>
      {open && (
        <div className="surface-card absolute right-0 top-11 z-30 w-80 rounded-xl border border-[var(--border)] p-4 shadow-xl">
          <p className="text-sm font-semibold">Notifications</p>
          {unresolved.length === 0 ? (
            <p className="mt-2 text-xs text-[var(--text-secondary)]">
              No unresolved anomalies. All circuits are within bounds.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {unresolved.slice(0, 3).map((alert) => (
                <li key={alert.id} className="rounded-lg border border-[var(--border)] px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-medium">
                      {devices.find((d) => d.id === alert.deviceId)?.name ?? "Unknown device"}
                    </span>
                    <span
                      className={`font-mono text-[8px] font-semibold tracking-widest ${
                        alert.severity === "CRITICAL" ? "text-red-500" : "text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {alert.severity}
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-[10px] text-[var(--text-muted)]">
                    {alert.actualValue} A vs {alert.expectedMin}–{alert.expectedMax} A expected
                  </p>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/alerts"
            onClick={() => setOpen(false)}
            className="mt-3 inline-block text-xs font-medium text-amber-600 hover:text-amber-500 dark:text-amber-400"
          >
            View all alerts →
          </Link>
        </div>
      )}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();
  const [showAccountModal, setShowAccountModal] = useState(false);
  const { userProfile } = useSentrix();

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace("/login");
    });
  }, [router]);

  function getInitials(fullName: string) {
    const parts = fullName.trim().split(/\s+/);
    if (!parts[0]) return "U";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  return (
    <div
      className={`dashboard-shell min-h-screen bg-[var(--canvas)] text-[var(--text-primary)] ${
        isDark ? "dark" : "light"
      }`}
      data-theme={isDark ? "dark" : "light"}
    >
      <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--header)] backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6 lg:px-8">
          <Brand href="/dashboard" />
          <nav
            aria-label="Main navigation"
            className="order-last flex w-full gap-1 md:order-none md:w-auto"
          >
            <Suspense fallback={<NavLinks />}>
              <ActiveNavLinks />
            </Suspense>
          </nav>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <NotificationsBell />
            <div className="hidden h-8 w-px bg-[var(--border)] sm:block" />

            {/* Interactive User Account Trigger (Profile Picture & Name) */}
            <button
              type="button"
              id="account-profile-trigger"
              onClick={() => setShowAccountModal(true)}
              className="group flex items-center gap-2.5 rounded-lg p-1 transition hover:bg-[var(--surface-hover)] focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              title={`${userProfile.name} · Click for Account Settings`}
              aria-label="Open Account Settings"
            >
              {userProfile.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={userProfile.avatarUrl}
                  alt={userProfile.name}
                  className="h-8 w-8 rounded-full object-cover border border-amber-500/40 group-hover:border-amber-500 transition"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 to-orange-500 text-[10px] font-bold text-[#382315] group-hover:ring-2 group-hover:ring-amber-500/40 transition">
                  {getInitials(userProfile.name)}
                </div>
              )}
              <div className="hidden flex-col items-start text-left lg:flex">
                <span className="text-xs font-medium text-[var(--text-primary)] group-hover:text-amber-500 transition">
                  {userProfile.name}
                </span>
                <span className="font-mono text-[9px] text-[var(--text-muted)]">
                  Account Settings ⚙
                </span>
              </div>
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1600px] px-4 pb-16 pt-6 sm:px-6 sm:pt-8 lg:px-8">
        {children}
      </main>

      {/* Account Settings Modal with CRUD */}
      <AccountSettingsModal
        isOpen={showAccountModal}
        onClose={() => setShowAccountModal(false)}
      />
    </div>
  );
}
