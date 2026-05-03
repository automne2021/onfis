import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import {
  deletePosition,
  unassignUserFromPosition,
  updatePosition,
} from "../services/positionApi";

// ── Helpers ───────────────────────────────────────────────────────────────────

function levelToNum(level: string | null | undefined): number {
  if (!level) return 0;
  const match = level.match(/^L(\d+)$/i);
  return match ? parseInt(match[1], 10) : 0;
}

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({
  name,
  avatar,
  isVacant,
}: {
  name: string;
  avatar?: string;
  isVacant?: boolean;
}) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const colors = [
    "bg-blue-500",
    "bg-emerald-500",
    "bg-amber-500",
    "bg-purple-500",
    "bg-rose-500",
    "bg-cyan-500",
    "bg-indigo-500",
    "bg-teal-500",
  ];
  const colorIndex =
    name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length;

  if (isVacant) {
    return (
      <div className="w-20 h-20 rounded-full bg-neutral-100 border-2 border-dashed border-neutral-300 flex items-center justify-center">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="12" cy="8" r="4" stroke="#90A1B9" strokeWidth="2" />
          <path
            d="M4 20C4 16.6863 7.13401 14 11 14H13C16.866 14 20 16.6863 20 20"
            stroke="#90A1B9"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
  }

  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        className="w-20 h-20 rounded-full object-cover border-2 border-white shadow-md"
      />
    );
  }

  return (
    <div
      className={`${colors[colorIndex]} w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl border-2 border-white shadow-md`}
    >
      {initials}
    </div>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PositionDetailData {
  /** positionId (position row id in the DB) */
  positionId: string;
  /** userId of the person occupying this position (null if vacant) */
  userId?: string;
  name: string;
  title: string;
  avatar?: string;
  isVacant: boolean;
  level?: string;
  role?: string;
  email?: string;
  departmentName?: string;
}

interface PositionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void | Promise<void>;
  data: PositionDetailData | null;
  /** Level of the currently logged-in user */
  currentUserLevel: string | null;
  isManager: boolean;
  /** Admin/SuperAdmin bypasses level-based permission checks */
  isAdmin?: boolean;
}

// ── Modal ─────────────────────────────────────────────────────────────────────

export default function PositionDetailModal({
  isOpen,
  onClose,
  onRefresh,
  data,
  currentUserLevel,
  isManager,
  isAdmin = false,
}: PositionDetailModalProps) {
  const navigate = useNavigate();
  const { tenant } = useParams<{ tenant: string }>();
  const [editingTitle, setEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [localTitle, setLocalTitle] = useState(data?.title ?? "");
  const [savingTitle, setSavingTitle] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"remove" | "deletePosition" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const canManage =
    isAdmin ||
    (isManager &&
      (data?.isVacant || levelToNum(currentUserLevel) >= levelToNum(data?.level)));

  const handleViewProfile = () => {
    if (data?.userId && tenant) {
      navigate(`/${tenant}/profile/${data.userId}`);
      onClose();
    }
  };

  // Focus title input when entering edit
  useEffect(() => {
    if (editingTitle) {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    }
  }, [editingTitle]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen && data) {
      setLocalTitle(data.title);
      setEditTitle(data.title);
      setEditingTitle(false);
      setError(null);
      setConfirmAction(null);
    }
  }, [isOpen, data?.positionId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTitleClick = () => {
    if (!canManage) return;
    setEditTitle(localTitle);
    setEditingTitle(true);
  };

  const handleTitleSave = async () => {
    if (!data || !editTitle.trim()) { setEditingTitle(false); return; }
    if (editTitle.trim() === localTitle) { setEditingTitle(false); return; }
    setSavingTitle(true);
    setError(null);
    try {
      await updatePosition(data.positionId, { title: editTitle.trim() });
      setLocalTitle(editTitle.trim()); // update displayed title immediately
      await onRefresh();
      setEditingTitle(false);
    } catch {
      setError("Failed to save title.");
    } finally {
      setSavingTitle(false);
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleTitleSave();
    if (e.key === "Escape") setEditingTitle(false);
  };

  const handleRemoveUser = async () => {
    if (!data?.userId || !data.positionId) return;
    setActionLoading(true);
    setError(null);
    try {
      await unassignUserFromPosition(data.positionId, data.userId);
      await onRefresh();
      onClose();
    } catch {
      setError("Failed to remove person from position.");
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  };

  const handleDeletePosition = async () => {
    if (!data?.positionId) return;
    setActionLoading(true);
    setError(null);
    try {
      await deletePosition(data.positionId);
      await onRefresh();
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? "Failed to delete position.");
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  };

  if (!isOpen || !data) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative z-10 bg-white w-full max-w-[460px] rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden animate-slideUp">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <h2 className="text-base font-semibold text-neutral-900">Position Details</h2>
          <button
            onClick={onClose}
            className="size-8 flex items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">

          {/* Person card */}
          <div className="flex flex-col items-center text-center gap-3">
            <Avatar name={data.name} avatar={data.avatar} isVacant={data.isVacant} />

            {data.isVacant ? (
              <div>
                <p className="font-semibold text-neutral-400">Vacant Position</p>
                {/* Click-to-edit title even for vacant */}
                {canManage ? (
                  <ClickToEditTitle
                    value={editingTitle ? editTitle : localTitle}
                    isEditing={editingTitle}
                    saving={savingTitle}
                    inputRef={titleInputRef}
                    onChange={setEditTitle}
                    onKeyDown={handleTitleKeyDown}
                    onBlur={handleTitleSave}
                    onClick={handleTitleClick}
                    className="text-sm text-neutral-400 mt-0.5"
                  />
                ) : (
                  <p className="text-sm text-neutral-400 mt-0.5">{localTitle}</p>
                )}
              </div>
            ) : (
              <div className="w-full">
                {/* Name (not editable — it's the user's name) */}
                <p className="font-semibold text-neutral-900 text-lg leading-tight">{data.name}</p>

                {/* Position title — click to edit */}
                {canManage ? (
                  <ClickToEditTitle
                    value={editingTitle ? editTitle : localTitle}
                    isEditing={editingTitle}
                    saving={savingTitle}
                    inputRef={titleInputRef}
                    onChange={setEditTitle}
                    onKeyDown={handleTitleKeyDown}
                    onBlur={handleTitleSave}
                    onClick={handleTitleClick}
                    className="text-sm text-primary font-medium mt-0.5"
                  />
                ) : (
                  <p className="text-sm text-primary font-medium mt-0.5">{localTitle}</p>
                )}

                {/* Badges — role + department */}
                <div className="flex items-center gap-2 flex-wrap justify-center mt-2">
                  {data.role && (
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-600 border border-neutral-200">
                      {data.role}
                    </span>
                  )}
                  {data.departmentName && (
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                      {data.departmentName}
                    </span>
                  )}
                </div>

                {data.email && (
                  <a href={`mailto:${data.email}`} className="block text-sm text-neutral-500 hover:text-primary transition-colors mt-1.5">
                    {data.email}
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Hint for editable fields */}
          {canManage && !editingTitle && (
            <p className="text-[11px] text-neutral-400 text-center -mt-2">
              Click the position title above to edit
            </p>
          )}

          {/* Error */}
          {error && (
            <div className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {/* Confirm overlay */}
          {confirmAction && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm font-medium text-amber-800 mb-3">
                {confirmAction === "remove"
                  ? `Remove ${data.name} from this position?`
                  : "Delete this position? Its subordinates will be re-parented."}
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setConfirmAction(null)}
                  className="text-sm px-3 py-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAction === "remove" ? handleRemoveUser : handleDeletePosition}
                  disabled={actionLoading}
                  className="text-sm px-3 py-1.5 rounded-lg bg-rose-500 text-white hover:bg-rose-600 disabled:opacity-50"
                >
                  {actionLoading ? "Processing..." : "Confirm"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex gap-2 justify-between">
          {canManage && !confirmAction && (
            <div className="flex gap-2">
              {!data.isVacant && data.userId && (
                <button
                  onClick={() => setConfirmAction("remove")}
                  className="text-sm px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-1"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M17 21V19a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 11l-4 4m0-4l4 4" />
                  </svg>
                  Remove
                </button>
              )}
              <button
                onClick={() => setConfirmAction("deletePosition")}
                className="text-sm px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-1"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6L18 20a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6M14 11v6" />
                </svg>
                Delete
              </button>
            </div>
          )}
          <div className="flex gap-2 ml-auto">
            {!data.isVacant && data.userId && (
              <button
                onClick={handleViewProfile}
                className="text-sm px-4 py-1.5 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors flex items-center gap-1.5"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                View Profile
              </button>
            )}
            <button
              onClick={onClose}
              className="text-sm px-4 py-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Click-to-edit title field ──────────────────────────────────────────────────

function ClickToEditTitle({
  value,
  isEditing,
  saving,
  inputRef,
  onChange,
  onKeyDown,
  onBlur,
  onClick,
  className,
}: {
  value: string;
  isEditing: boolean;
  saving: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onChange: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onBlur: () => void;
  onClick: () => void;
  className?: string;
}) {
  if (isEditing) {
    return (
      <div className="flex items-center gap-1 justify-center mt-0.5">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={onBlur}
          disabled={saving}
          className="text-sm border-b border-primary bg-transparent text-center text-neutral-900 focus:outline-none w-full max-w-[260px] py-0.5"
        />
        {saving && (
          <svg className="animate-spin shrink-0" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="8" />
          </svg>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`group relative inline-flex items-center gap-1 hover:text-primary/80 transition-colors cursor-text ${className ?? ""}`}
      title="Click to edit"
    >
      {value}
      <svg
        width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        className="opacity-0 group-hover:opacity-60 transition-opacity shrink-0"
      >
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 8.5-8.5Z" />
      </svg>
    </button>
  );
}
