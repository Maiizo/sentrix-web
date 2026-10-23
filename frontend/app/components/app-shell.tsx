"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect, useState, type ReactNode } from "react";
import { Brand } from "./brand";
import { AccountSettingsModal } from "./account-settings-modal";
import { useSentrix } from "../lib/sentrix-store";
import { useTheme } from "../lib/theme-context";
import { ThemeToggle } from "./theme-toggle";
import { SentrixContextMenu } from "./context-menu";
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

function MobileNavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = NAV_LINKS.find(({ href }) => pathname.startsWith(href));
  return (
    <nav className="flex flex-col space-y-1">
      {NAV_LINKS.map(({ href, label }) => {
        const isActive = active?.href === href;
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
            className={`flex items-center justify-between rounded-lg px-3.5 py-2.5 text-sm font-medium transition ${
              isActive
                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold"
                : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
            }`}
          >
            <span>{label}</span>
            {isActive && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
          </Link>
        );
      })}
    </nav>
  );
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { userProfile } = useSentrix();

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace("/login");
    });
  }, [router]);

  async function handleLogout() {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    try {
      localStorage.removeItem("sentrix-demo-session");
      sessionStorage.removeItem("sentrix-demo-session");
    } catch {}
    router.replace("/login");
  }

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
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <Brand href="/dashboard" />
            <nav
              aria-label="Main navigation"
              className="hidden items-center gap-1 lg:flex"
            >
              <Suspense fallback={<NavLinks />}>
                <ActiveNavLinks />
              </Suspense>
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <NotificationsBell />
            <div className="hidden h-8 w-px bg-[var(--border)] lg:block" />

            {/* Interactive User Account Trigger (Profile Picture & Name) */}
            <button
              type="button"
              id="account-profile-trigger"
              onClick={() => setShowAccountModal(true)}
              className="hidden lg:flex group items-center gap-2.5 rounded-lg p-1 transition hover:bg-[var(--surface-hover)] focus:outline-none focus:ring-2 focus:ring-amber-500/30"
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
              <div className="hidden flex-col items-start text-left xl:flex">
                <span className="text-xs font-medium text-[var(--text-primary)] group-hover:text-amber-500 transition">
                  {userProfile.name}
                </span>
                <span className="font-mono text-[9px] text-[var(--text-muted)]">
                  Account Settings ⚙
                </span>
              </div>
            </button>

            {/* Header Logout Button */}
            <button
              type="button"
              id="header-logout-button"
              onClick={handleLogout}
              className="hidden lg:inline-flex h-8 items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 text-xs font-medium text-[var(--text-secondary)] transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-500"
              title="Log Out"
              aria-label="Log Out"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span className="hidden sm:inline">Logout</span>
            </button>

            {/* Mobile & Tablet Hamburger Navigation Button */}
            <button
              type="button"
              id="app-shell-mobile-nav-toggle"
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] transition hover:bg-[var(--surface-hover)] focus:outline-none focus:ring-2 focus:ring-amber-500/40 lg:hidden"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="4" y1="6" x2="20" y2="6" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="18" x2="20" y2="18" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile & Tablet Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-[var(--border)] bg-[var(--surface)] px-4 py-4 shadow-2xl backdrop-blur-xl lg:hidden animate-in slide-in-from-top-2 duration-200">
            <Suspense fallback={<NavLinks />}>
              <MobileNavLinks onNavigate={() => setMobileMenuOpen(false)} />
            </Suspense>

            <div className="my-3 border-t border-[var(--border)] pt-3">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowAccountModal(true);
                }}
                className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-[var(--surface-hover)] transition"
              >
                {userProfile.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={userProfile.avatarUrl}
                    alt={userProfile.name}
                    className="h-9 w-9 rounded-full object-cover border border-amber-500/40"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 to-orange-500 text-xs font-bold text-[#382315]">
                    {getInitials(userProfile.name)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                    {userProfile.name}
                  </p>
                  <p className="font-mono text-[10px] text-amber-600 dark:text-amber-400">
                    Account Settings ⚙
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="mt-2 flex w-full items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs font-medium text-red-500 hover:bg-red-500/20 transition"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </header>
      <main className="mx-auto w-full max-w-[1600px] px-4 pb-16 pt-6 sm:px-6 sm:pt-8 lg:px-8">
        {children}
      </main>

      {/* Account Settings Modal with CRUD */}
      <AccountSettingsModal
        isOpen={showAccountModal}
        onClose={() => setShowAccountModal(false)}
        onLogout={handleLogout}
      />

      {/* Context-aware Right-Click Menu */}
      <SentrixContextMenu isDark={isDark} onToggleTheme={toggleTheme} />
    </div>
  );
}
