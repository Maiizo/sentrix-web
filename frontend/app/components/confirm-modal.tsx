"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type ConfirmOptions = {
  title: string;
  message: string | ReactNode;
  confirmText?: string;
  cancelText?: string | null;
  type?: "danger" | "warning" | "info";
};

type ConfirmContextType = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    options: ConfirmOptions;
    resolve: (value: boolean) => void;
  } | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        options,
        resolve,
      });
    });
  }, []);

  const handleClose = useCallback(
    (result: boolean) => {
      if (modalState) {
        modalState.resolve(result);
        setModalState(null);
      }
    },
    [modalState]
  );

  // Keyboard accessibility
  useEffect(() => {
    if (!modalState?.isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose(false);
      } else if (e.key === "Enter" && !e.shiftKey) {
        // Prevent accidental triggers if target is another input
        const target = e.target as HTMLElement;
        if (target.tagName !== "BUTTON" && target.tagName !== "INPUT") {
          e.preventDefault();
          handleClose(true);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modalState?.isOpen, handleClose]);

  const current = modalState?.options;
  const isDanger = current?.type === "danger" || !current?.type;
  const isWarning = current?.type === "warning";
  const hasCancel = current?.cancelText !== null;

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      {modalState?.isOpen && current && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-modal-title"
          aria-describedby="confirm-modal-description"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) handleClose(false);
          }}
        >
          <div
            className={`surface-card relative w-full max-w-md overflow-hidden rounded-2xl border p-6 shadow-xl transition-all duration-200 animate-in zoom-in-95 ${
              isDanger
                ? "border-red-500/30"
                : isWarning
                  ? "border-amber-500/30"
                  : "border-[var(--border)]"
            }`}
          >
            {/* Close X Button */}
            <button
              type="button"
              aria-label="Close dialog"
              onClick={() => handleClose(false)}
              className="absolute top-4 right-4 flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex items-start gap-4">
              {/* Icon Badge */}
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${
                  isDanger
                    ? "border-red-500/25 bg-red-500/10 text-red-500"
                    : isWarning
                      ? "border-amber-500/25 bg-amber-500/10 text-amber-500"
                      : "border-blue-500/25 bg-blue-500/10 text-blue-500"
                }`}
              >
                {isDanger ? (
                  <svg
                    viewBox="0 0 24 24"
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                ) : isWarning ? (
                  <svg
                    viewBox="0 0 24 24"
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                )}
              </div>

              {/* Text Information */}
              <div className="flex-1 pr-4 space-y-1.5">
                <h3
                  id="confirm-modal-title"
                  className="text-base font-semibold tracking-tight text-[var(--text-primary)]"
                >
                  {current.title}
                </h3>
                <div
                  id="confirm-modal-description"
                  className="text-xs leading-relaxed text-[var(--text-muted)]"
                >
                  {current.message}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex items-center justify-end gap-2.5 pt-2">
              {hasCancel && (
                <button
                  type="button"
                  onClick={() => handleClose(false)}
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition"
                >
                  {current.cancelText ?? "Cancel"}
                </button>
              )}
              <button
                type="button"
                autoFocus
                onClick={() => handleClose(true)}
                className={`rounded-lg px-4 py-2 text-xs font-semibold transition active:scale-95 ${
                  isDanger
                    ? "bg-red-600 text-white hover:bg-red-500"
                    : isWarning
                      ? "bg-amber-500 text-stone-950 hover:bg-amber-400"
                      : "bg-blue-600 text-white hover:bg-blue-500"
                }`}
              >
                {current.confirmText ?? (hasCancel ? "Confirm" : "OK")}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a <ConfirmProvider>");
  }
  return context;
}
