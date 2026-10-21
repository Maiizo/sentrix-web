"use client";

import { useState, useRef, type ChangeEvent, type FormEvent } from "react";
import { useSentrix } from "../lib/sentrix-store";
import { useConfirm } from "./confirm-modal";

const AVATAR_PRESETS = [
  { label: "Warm Gold", color: "from-amber-400 to-orange-500", textColor: "text-[#382315]" },
  { label: "Cool Emerald", color: "from-emerald-400 to-teal-600", textColor: "text-[#063321]" },
  { label: "Tech Cyan", color: "from-cyan-400 to-blue-600", textColor: "text-[#082645]" },
  { label: "Deep Violet", color: "from-violet-400 to-purple-600", textColor: "text-[#280c44]" },
  { label: "Rose Amber", color: "from-rose-400 to-amber-500", textColor: "text-[#400e18]" },
];

export function AccountSettingsModal({
  isOpen,
  onClose,
  onLogout,
}: {
  isOpen: boolean;
  onClose: () => void;
  onLogout?: () => void;
}) {
  const { userProfile, updateUserProfile, clearUserAvatar } = useSentrix();
  const confirm = useConfirm();

  const [name, setName] = useState(userProfile.name);
  const [email, setEmail] = useState(userProfile.email);
  const [role, setRole] = useState(userProfile.role);
  const [department, setDepartment] = useState(userProfile.department ?? "");
  const [phone, setPhone] = useState(userProfile.phone ?? "");
  const [avatarUrl, setAvatarUrl] = useState(userProfile.avatarUrl ?? "");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  function getInitials(fullName: string) {
    const parts = fullName.trim().split(/\s+/);
    if (!parts[0]) return "U";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function handleImageUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      confirm({
        title: "File Too Large",
        message: "Image file size should be less than 2MB. Please select a smaller photo.",
        confirmText: "Understood",
        cancelText: null,
        type: "warning",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setAvatarUrl(result);
        updateUserProfile({ avatarUrl: result });
        notifySuccess("Profile photo updated!");
      }
    };
    reader.readAsDataURL(file);
  }

  function notifySuccess(msg: string) {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  }

  // UPDATE / SAVE
  function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    updateUserProfile({
      name: name.trim(),
      email: email.trim(),
      role: role.trim(),
      department: department.trim(),
      phone: phone.trim(),
      avatarUrl,
    });

    notifySuccess("Account profile updated successfully!");
  }


  // DELETE PHOTO
  function handleRemovePhoto() {
    clearUserAvatar();
    setAvatarUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    notifySuccess("Profile photo removed.");
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="account-modal-title"
    >
      <div className="surface-card relative w-full max-w-xl rounded-2xl border border-[var(--border)] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/15 text-amber-500 font-semibold">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div>
              <h2 id="account-modal-title" className="text-base font-semibold text-[var(--text-primary)]">
                Account Settings
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Manage your operator credentials, avatar, and contact information.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--text-primary)] transition"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1">
          {successMessage && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-500 font-medium flex items-center justify-between animate-in fade-in">
              <span>✓ {successMessage}</span>
            </div>
          )}

          {/* Profile Picture Section (READ / UPDATE / DELETE photo) */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <h3 className="eyebrow mb-3">Profile Picture & Avatar</h3>
            <div className="flex flex-col sm:flex-row items-center gap-5">
              <div className="relative group">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt={name}
                    className="h-20 w-20 rounded-full object-cover border-2 border-amber-500/50 shadow-md"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 to-orange-500 text-xl font-bold text-[#382315] shadow-md">
                    {getInitials(name)}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 text-[10px] text-white opacity-0 group-hover:opacity-100 transition duration-150"
                  aria-label="Change photo"
                >
                  Change
                </button>
              </div>

              <div className="space-y-2 text-center sm:text-left flex-1">
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="profile-avatar-upload"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-[#20170a] hover:bg-amber-400 transition"
                  >
                    Upload New Photo
                  </button>
                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={async () => {
                        const ok = await confirm({
                          title: "Remove Profile Photo",
                          message: "Are you sure you want to remove your profile photo and revert to your initials?",
                          confirmText: "Remove Photo",
                          cancelText: "Cancel",
                          type: "danger",
                        });
                        if (ok) {
                          handleRemovePhoto();
                        }
                      }}
                      className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-500/20 transition"
                    >
                      Remove Photo
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Supports JPG, PNG or WebP up to 2MB. Uploaded photo syncs across all pages.
                </p>
              </div>
            </div>
          </div>

          {/* Form (READ / UPDATE Profile fields) */}
          <form id="account-settings-form" onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="eyebrow mb-1.5 block">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--canvas)] px-3 py-2 text-xs text-[var(--text-primary)] focus:border-amber-500 focus:outline-none"
                  placeholder="e.g. Alex Valdez"
                />
              </div>

              <div>
                <label className="eyebrow mb-1.5 block">Email *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--canvas)] px-3 py-2 text-xs text-[var(--text-primary)] focus:border-amber-500 focus:outline-none"
                  placeholder="e.g. alex@company.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="eyebrow mb-1.5 block">Role / Title</label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--canvas)] px-3 py-2 text-xs text-[var(--text-primary)] focus:border-amber-500 focus:outline-none"
                  placeholder="e.g. System Administrator"
                />
              </div>

              <div>
                <label className="eyebrow mb-1.5 block">Department / Team</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--canvas)] px-3 py-2 text-xs text-[var(--text-primary)] focus:border-amber-500 focus:outline-none"
                  placeholder="e.g. Facility Operations & HVAC"
                />
              </div>
            </div>

            <div>
              <label className="eyebrow mb-1.5 block">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--canvas)] px-3 py-2 text-xs text-[var(--text-primary)] focus:border-amber-500 focus:outline-none"
                placeholder="e.g. +1 (555) 019-2834"
              />
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-[var(--border)] bg-[var(--surface)] px-6 py-3.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition"
            >
              Cancel
            </button>
            {onLogout && (
              <button
                type="button"
                id="modal-logout-button"
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className="rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2 text-xs font-medium text-red-500 hover:bg-red-500/20 transition"
              >
                Log Out
              </button>
            )}
          </div>
          <button
            type="submit"
            form="account-settings-form"
            className="rounded-lg bg-amber-500 px-5 py-2 text-xs font-semibold text-[#20170a] hover:bg-amber-400 transition shadow-sm shadow-amber-500/20"
          >
            Save Account Changes
          </button>
        </div>
      </div>
    </div>
  );
}
