"use client";

import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSentrix, type Group } from "../lib/sentrix-store";
import { useConfirm } from "./confirm-modal";
import { BleOnboardingModal } from "../dashboard/[groupName]/ble-onboarding-modal";

interface SentrixContextMenuProps {
  isDark?: boolean;
  onToggleTheme?: () => void;
}

type ContextType = "group" | "device" | "alert" | "default";

interface MenuState {
  x: number;
  y: number;
  type: ContextType;
  id?: string;
  selectedText?: string;
  routePath?: string;
}

/** Quick lightweight modal to add a new location group from the context menu */
function QuickCreateGroupModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated?: (groupName: string) => void;
}) {
  const { createGroup } = useSentrix();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const newGroup = createGroup(name.trim(), description.trim());
    onCreated?.(newGroup.name);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="surface-card w-full max-w-sm rounded-2xl border border-[var(--border)] p-5 sm:p-6 shadow-2xl space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold tracking-tight text-[var(--text-primary)]">
            Create Location Group
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm p-1 rounded-md transition"
          >
            ✕
          </button>
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          Group your AC sensors by floor, server rack, or facility zone for synchronized telemetry.
        </p>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
            Group Name
          </span>
          <input
            autoFocus
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Server Room AC Mesh"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--canvas)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-amber-500 placeholder:text-[var(--text-muted)]"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
            Description (Optional)
          </span>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. 3-phase commercial cooling circuit"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--canvas)] px-3 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-amber-500 placeholder:text-[var(--text-muted)]"
          />
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[var(--border)] px-3.5 py-2 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-[#20170a] hover:bg-amber-400 transition"
          >
            Create Group
          </button>
        </div>
      </form>
    </div>
  );
}

/** Quick modal to pick a facility group when launching BLE onboarding from global space */
function GroupPickerModal({
  groups,
  onClose,
  onSelect,
}: {
  groups: Group[];
  onClose: () => void;
  onSelect: (group: Group) => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="surface-card w-full max-w-sm rounded-2xl border border-[var(--border)] p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold tracking-tight text-[var(--text-primary)]">
            Select Facility Group
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm p-1 rounded-md transition"
          >
            ✕
          </button>
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          Choose which facility group the new AC node should join:
        </p>
        <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
          {groups.map((group) => (
            <button
              key={group.id}
              type="button"
              onClick={() => onSelect(group)}
              className="w-full flex items-center justify-between text-left px-3.5 py-2.5 rounded-xl border border-[var(--border)] hover:border-amber-500/50 hover:bg-[var(--surface-hover)] transition group"
            >
              <div>
                <p className="text-xs font-semibold text-[var(--text-primary)] group-hover:text-amber-500">
                  📍 {group.name}
                </p>
                <p className="font-mono text-[10px] text-[var(--text-muted)]">
                  Mesh: {group.meshId.slice(0, 8)}…
                </p>
              </div>
              <span className="text-xs text-amber-500 font-semibold">Select →</span>
            </button>
          ))}
        </div>
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[var(--border)] px-3.5 py-2 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function SentrixContextMenuContent({ isDark, onToggleTheme }: SentrixContextMenuProps) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    groups,
    devices,
    alerts,
    deleteGroup,
    deleteDevice,
    submitAlertFeedback,
    resolveAlert,
    dispatchMaintenance,
    simulateNewAnomaly,
    resetDemoData,
  } = useSentrix();
  const confirm = useConfirm();

  const [menuState, setMenuState] = useState<MenuState | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeBleGroup, setActiveBleGroup] = useState<Group | null>(null);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showGroupPickerModal, setShowGroupPickerModal] = useState(false);

  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2500); // 2.5-second toast
  }, []);

  const closeMenu = useCallback(() => {
    setMenuState(null);
  }, []);

  const copyToClipboard = useCallback(
    async (text: string, label: string) => {
      try {
        if (navigator?.clipboard?.writeText) {
          await navigator.clipboard.writeText(text);
        } else {
          const textarea = document.createElement("textarea");
          textarea.value = text;
          textarea.style.position = "fixed";
          textarea.style.opacity = "0";
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand("copy");
          document.body.removeChild(textarea);
        }
        showToast(`${label} copied to clipboard`);
      } catch {
        showToast(`Failed to copy ${label}`);
      }
    },
    [showToast]
  );

  // Global contextmenu listener on window
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // 1. Only listen inside .dashboard-shell
      if (!target.closest?.(".dashboard-shell")) return;

      // 2. Allow native context menu if Shift is held (Inspect Element)
      if (e.shiftKey) return;

      // 3. Allow native context menu inside text inputs, textareas, selects, and contenteditable elements
      if (
        target.isContentEditable ||
        target.closest?.("input, textarea, select, [contenteditable='true'], [contenteditable=''], a[target='_blank']")
      ) {
        return;
      }

      e.preventDefault();

      // Check highlighted selected text
      const selectedText = window.getSelection?.()?.toString()?.trim() || undefined;

      // Detect entity context
      const contextEl = target.closest?.("[data-context-type]") as HTMLElement | null;
      const contextType = contextEl?.getAttribute("data-context-type");
      const contextId = contextEl?.getAttribute("data-context-id") || undefined;

      let type: ContextType = "default";
      if (contextType === "group" && contextId) type = "group";
      else if (contextType === "device" && contextId) type = "device";
      else if (contextType === "alert" && contextId) type = "alert";

      // Clamping logic: assume menu width ~256px and height ~280px
      const menuWidth = 256;
      const menuHeight = 280;
      const margin = 12;

      const clampedX = Math.max(margin, Math.min(e.clientX, window.innerWidth - menuWidth - margin));
      const clampedY = Math.max(margin, Math.min(e.clientY, window.innerHeight - menuHeight - margin));

      setMenuState({
        x: clampedX,
        y: clampedY,
        type,
        id: contextId,
        selectedText,
        routePath: window.location.pathname,
      });
    };

    window.addEventListener("contextmenu", handleContextMenu);
    return () => {
      window.removeEventListener("contextmenu", handleContextMenu);
    };
  }, []);

  // Listeners to close the context menu
  useEffect(() => {
    if (!menuState) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeMenu();
      }
    };

    const handleScroll = () => {
      closeMenu();
    };

    const handleResize = () => {
      closeMenu();
    };

    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScroll, { capture: true, passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScroll, { capture: true });
      window.removeEventListener("resize", handleResize);
    };
  }, [menuState, closeMenu]);

  // Adjust positioning after render if height overflows
  useEffect(() => {
    if (menuState && menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const margin = 12;
      let newY = menuState.y;
      let newX = menuState.x;

      if (rect.bottom > window.innerHeight - margin) {
        newY = Math.max(margin, window.innerHeight - rect.height - margin);
      }
      if (rect.right > window.innerWidth - margin) {
        newX = Math.max(margin, window.innerWidth - rect.width - margin);
      }

      if (newX !== menuState.x || newY !== menuState.y) {
        setMenuState((prev) => (prev ? { ...prev, x: newX, y: newY } : null));
      }
    }
  }, [menuState?.type, menuState?.id, menuState?.selectedText]);

  // Determine if the current route is inside a specific group dashboard
  const currentPath = pathname || menuState?.routePath || "";
  const pathParts = currentPath.split("/").filter(Boolean);
  const currentGroupSlug =
    pathParts[0] === "dashboard" && pathParts[1] && pathParts[1] !== "settings"
      ? pathParts[1]
      : null;
  const currentRouteGroup = currentGroupSlug
    ? groups.find((g) => g.slug === currentGroupSlug || g.id === currentGroupSlug)
    : null;

  // Render entity-specific context menus
  const renderMenuItems = () => {
    if (!menuState) return null;

    if (menuState.type === "group" && menuState.id) {
      const group = groups.find((g) => g.id === menuState.id);
      if (group) {
        return (
          <>
            <div className="px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border)] truncate">
              GROUP · {group.name}
            </div>
            <div className="py-1">
              <button
                type="button"
                onClick={() => {
                  closeMenu();
                  setActiveBleGroup(group);
                }}
                className="w-full flex items-center justify-between text-left px-3 py-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors cursor-pointer"
              >
                <span>+ Add AC Sensor to {group.name}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  closeMenu();
                  router.push(`/dashboard/${group.slug}`);
                }}
                className="w-full flex items-center justify-between text-left px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--surface-hover)] hover:text-amber-500 rounded-lg transition-colors cursor-pointer"
              >
                <span>Open Location Mesh →</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  closeMenu();
                  copyToClipboard(group.meshId, "Mesh ID");
                }}
                className="w-full flex items-center justify-between text-left px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--surface-hover)] hover:text-amber-500 rounded-lg transition-colors cursor-pointer"
              >
                <span className="truncate">
                  Copy Mesh ID ({group.meshId.slice(0, 8)}…)
                </span>
              </button>
              <div className="my-1 border-t border-[var(--border)]" />
              <button
                type="button"
                onClick={async () => {
                  closeMenu();
                  const ok = await confirm({
                    title: "Delete Location Group",
                    message: `Are you sure you want to delete "${group.name}" and all its devices? This action cannot be undone.`,
                    confirmText: "Delete Group",
                    cancelText: "Cancel",
                    type: "danger",
                  });
                  if (ok) {
                    deleteGroup(group.id);
                    showToast(`Group "${group.name}" deleted`);
                  }
                }}
                className="w-full flex items-center justify-between text-left px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
              >
                <span>Delete Group</span>
              </button>
            </div>
          </>
        );
      }
    }

    if (menuState.type === "device" && menuState.id) {
      const device = devices.find((d) => d.id === menuState.id);
      if (device) {
        const group = groups.find((g) => g.id === device.groupId);
        return (
          <>
            <div className="px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border)] truncate">
              AC NODE · {device.name}
            </div>
            <div className="py-1">
              <button
                type="button"
                onClick={() => {
                  closeMenu();
                  router.push(`/dashboard/${group?.slug ?? device.groupId}/${device.id}`);
                }}
                className="w-full flex items-center justify-between text-left px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--surface-hover)] hover:text-amber-500 rounded-lg transition-colors cursor-pointer"
              >
                <span>View Auto-ARIMA Analytics →</span>
              </button>
              {group && (
                <button
                  type="button"
                  onClick={() => {
                    closeMenu();
                    setActiveBleGroup(group);
                  }}
                  className="w-full flex items-center justify-between text-left px-3 py-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors cursor-pointer"
                >
                  <span>+ Add Another Device to {group.name}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  closeMenu();
                  copyToClipboard(device.macAddress, "MAC Address");
                }}
                className="w-full flex items-center justify-between text-left px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--surface-hover)] hover:text-amber-500 rounded-lg transition-colors cursor-pointer"
              >
                <span className="truncate">
                  Copy MAC Address ({device.macAddress})
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  closeMenu();
                  copyToClipboard(device.pinCode, "Hardware PIN");
                }}
                className="w-full flex items-center justify-between text-left px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--surface-hover)] hover:text-amber-500 rounded-lg transition-colors cursor-pointer"
              >
                <span>Copy Hardware PIN ({device.pinCode})</span>
              </button>
              <div className="my-1 border-t border-[var(--border)]" />
              <button
                type="button"
                onClick={async () => {
                  closeMenu();
                  const ok = await confirm({
                    title: "Delete Sensor",
                    message: `Are you sure you want to delete "${device.name}"? Telemetry recording will stop and all sensor historical logs will be removed.`,
                    confirmText: "Delete Sensor",
                    cancelText: "Cancel",
                    type: "danger",
                  });
                  if (ok) {
                    deleteDevice(device.id);
                    showToast(`Sensor "${device.name}" deleted`);
                  }
                }}
                className="w-full flex items-center justify-between text-left px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
              >
                <span>Delete Sensor</span>
              </button>
            </div>
          </>
        );
      }
    }

    if (menuState.type === "alert" && menuState.id) {
      const alert = alerts.find((a) => a.id === menuState.id);
      if (alert) {
        return (
          <>
            <div className="px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border)] truncate">
              ANOMALY · {alert.severity} ({alert.actualValue}A)
            </div>
            <div className="py-1">
              <button
                type="button"
                onClick={() => {
                  closeMenu();
                  submitAlertFeedback(alert.id, true);
                  showToast("Feedback: Valid Issue recorded");
                }}
                className="w-full flex items-center justify-between text-left px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--surface-hover)] hover:text-amber-500 rounded-lg transition-colors cursor-pointer"
              >
                <span>Feedback: Valid Issue (True Positive)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  closeMenu();
                  submitAlertFeedback(alert.id, false);
                  showToast("Feedback: False Alarm recorded");
                }}
                className="w-full flex items-center justify-between text-left px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--surface-hover)] hover:text-amber-500 rounded-lg transition-colors cursor-pointer"
              >
                <span>Feedback: False Alarm (False Positive)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  closeMenu();
                  dispatchMaintenance(alert.id);
                  showToast("Maintenance dispatched");
                }}
                className="w-full flex items-center justify-between text-left px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--surface-hover)] hover:text-amber-500 rounded-lg transition-colors cursor-pointer"
              >
                <span>Dispatch Maintenance</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  closeMenu();
                  if (!alert.isResolved) {
                    resolveAlert(alert.id);
                    showToast("Alert marked as resolved");
                  } else {
                    showToast("Alert is already resolved");
                  }
                }}
                className="w-full flex items-center justify-between text-left px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--surface-hover)] hover:text-amber-500 rounded-lg transition-colors cursor-pointer"
              >
                <span>{alert.isResolved ? "Already Resolved ✓" : "Mark as Resolved ✓"}</span>
              </button>
            </div>
          </>
        );
      }
    }

    // Default Workspace Menu (Empty space right-click)
    return (
      <>
        <div className="px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border)] truncate">
          SENTRIX QUICK SHORTCUTS
        </div>
        <div className="py-1">
          {/* Contextual BLE shortcut when on a group page */}
          {currentRouteGroup ? (
            <button
              type="button"
              onClick={() => {
                closeMenu();
                setActiveBleGroup(currentRouteGroup);
              }}
              className="w-full flex items-center justify-between text-left px-3 py-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors cursor-pointer"
            >
              <span>+ Add AC Sensor to this Group</span>
            </button>
          ) : groups.length > 0 ? (
            <button
              type="button"
              onClick={() => {
                closeMenu();
                setShowGroupPickerModal(true);
              }}
              className="w-full flex items-center justify-between text-left px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--surface-hover)] hover:text-amber-500 rounded-lg transition-colors cursor-pointer"
            >
              <span>+ Add AC Sensor…</span>
            </button>
          ) : null}

          {/* Quick Create Group Modal */}
          <button
            type="button"
            onClick={() => {
              closeMenu();
              setShowCreateGroupModal(true);
            }}
            className="w-full flex items-center justify-between text-left px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--surface-hover)] hover:text-amber-500 rounded-lg transition-colors cursor-pointer"
          >
            <span>+ Create New Location Group</span>
          </button>

          {/* Simulate AC Anomaly */}
          <button
            type="button"
            onClick={() => {
              closeMenu();
              simulateNewAnomaly();
              showToast("Anomaly simulated");
            }}
            className="w-full flex items-center justify-between text-left px-3 py-1.5 text-xs font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors cursor-pointer"
          >
            <span>⚡ Simulate AC Anomaly</span>
          </button>

          <div className="my-1 border-t border-[var(--border)]" />

          {/* Global Workspace Navigations */}
          <button
            type="button"
            onClick={() => {
              closeMenu();
              router.push("/dashboard");
            }}
            className="w-full flex items-center justify-between text-left px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--surface-hover)] hover:text-amber-500 rounded-lg transition-colors cursor-pointer"
          >
            <span>Global Overview</span>
          </button>
          <button
            type="button"
            onClick={() => {
              closeMenu();
              router.push("/alerts");
            }}
            className="w-full flex items-center justify-between text-left px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--surface-hover)] hover:text-amber-500 rounded-lg transition-colors cursor-pointer"
          >
            <span>Anomaly Feed</span>
          </button>
          <button
            type="button"
            onClick={() => {
              closeMenu();
              router.push("/settings");
            }}
            className="w-full flex items-center justify-between text-left px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--surface-hover)] hover:text-amber-500 rounded-lg transition-colors cursor-pointer"
          >
            <span>Workspace Settings</span>
          </button>

          <button
            type="button"
            onClick={() => {
              closeMenu();
              onToggleTheme?.();
              showToast(`Switched to ${isDark ? "Light" : "Dark"} Theme`);
            }}
            className="w-full flex items-center justify-between text-left px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--surface-hover)] hover:text-amber-500 rounded-lg transition-colors cursor-pointer"
          >
            <span>Switch to {isDark ? "Light" : "Dark"} Theme</span>
          </button>

          <div className="my-1 border-t border-[var(--border)]" />

          <button
            type="button"
            onClick={async () => {
              closeMenu();
              const ok = await confirm({
                title: "Reset Demo Data",
                message: "Are you sure you want to reset all telemetry and demo data back to default state?",
                confirmText: "Reset Demo Data",
                cancelText: "Cancel",
                type: "warning",
              });
              if (ok) {
                resetDemoData();
                showToast("Demo data reset to factory state");
              }
            }}
            className="w-full flex items-center justify-between text-left px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
          >
            <span>Reset Demo Data</span>
          </button>
        </div>
      </>
    );
  };

  return (
    <>
      {menuState && (
        <div
          ref={menuRef}
          style={{ top: menuState.y, left: menuState.x }}
          className="surface-card fixed z-50 w-64 select-none rounded-xl border border-[var(--border)] p-1 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-100"
          role="menu"
          aria-orientation="vertical"
        >
          {/* Highlighted text copy shortcut at top */}
          {menuState.selectedText && (
            <>
              <button
                type="button"
                onClick={() => {
                  const text = menuState.selectedText!;
                  closeMenu();
                  copyToClipboard(text, "Selected text");
                }}
                className="w-full flex items-center justify-between text-left px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--surface-hover)] hover:text-amber-500 rounded-lg transition-colors cursor-pointer group"
                role="menuitem"
              >
                <span className="truncate">Copy Selected Text</span>
                <span className="font-mono text-[10px] text-[var(--text-muted)] group-hover:text-amber-500">
                  Ctrl+C
                </span>
              </button>
              <div className="my-1 border-t border-[var(--border)]" />
            </>
          )}

          {renderMenuItems()}

          <div className="px-3 py-1 border-t border-[var(--border)] font-mono text-[9px] text-[var(--text-muted)] text-center select-none">
            Shift + Right-Click for browser menu
          </div>
        </div>
      )}

      {/* Built-in BLE Onboarding Modal */}
      {activeBleGroup && (
        <BleOnboardingModal
          group={activeBleGroup}
          onClose={() => setActiveBleGroup(null)}
        />
      )}

      {/* Built-in Quick Create Group Modal */}
      {showCreateGroupModal && (
        <QuickCreateGroupModal
          onClose={() => setShowCreateGroupModal(false)}
          onCreated={(groupName) => showToast(`Group "${groupName}" created`)}
        />
      )}

      {/* Built-in Group Picker for + Add AC Sensor */}
      {showGroupPickerModal && (
        <GroupPickerModal
          groups={groups}
          onClose={() => setShowGroupPickerModal(false)}
          onSelect={(group) => {
            setShowGroupPickerModal(false);
            setActiveBleGroup(group);
          }}
        />
      )}

      {/* 2.5s Floating Bottom-Right Toast */}
      {toastMessage && (
        <div
          role="status"
          className="surface-card fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl border border-amber-500/30 px-4 py-2.5 font-mono text-xs text-[var(--text-primary)] shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-150"
        >
          <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}
    </>
  );
}

export function SentrixContextMenu(props: SentrixContextMenuProps) {
  return (
    <Suspense fallback={null}>
      <SentrixContextMenuContent {...props} />
    </Suspense>
  );
}
