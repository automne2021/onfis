import { useState, useEffect, useRef } from "react";
import DelegationForm from "../components/DelegationForm";
import DelegationList from "../components/DelegationList";
import { delegationService, type ExecutiveRequest, type CreateExecutiveRequest } from "../services/delegationService";
import Icon from "../../../components/common/Icon";
import { useLanguage } from "../../../contexts/LanguageContext";
import { Button } from "../../../components/common/Buttons/Button";
import Modal from "../../../components/common/Modal";
import { useToast } from "../../../contexts/useToast";

function DelegationSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6 animate-pulse w-full h-full">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-48 bg-neutral-200 rounded mb-2" />
          <div className="h-4 w-64 bg-neutral-100 rounded" />
        </div>
        <div className="h-10 w-32 bg-neutral-200 rounded-xl" />
      </div>
      <div className="h-12 w-full bg-neutral-100 rounded-xl mb-4" />
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-neutral-100 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function DelegationPage() {
  const { t } = useLanguage();
  const [requests, setRequests] = useState<ExecutiveRequest[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState<ExecutiveRequest | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setIsLoading(true);
    try {
      const data = await delegationService.list();
      setRequests(data);
    } catch (err) {
      console.error("Failed to load delegation requests:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (data: CreateExecutiveRequest) => {
    setIsSubmitting(true);
    try {
      const created = await delegationService.create(data);
      if (created) {
        setRequests((prev) => [created, ...prev]);
      }
      setShowForm(false);
    } catch (err) {
      console.error("Failed to create delegation:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, status: ExecutiveRequest["status"]) => {
    try {
      await delegationService.updateStatus(id, status);
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status, updatedAt: new Date().toISOString() } : r))
      );
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t("Are you sure you want to delete this delegation?"))) return;
    try {
      await delegationService.delete(id);
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error("Failed to delete delegation:", err);
    }
  };

  if (isLoading) {
    return <DelegationSkeleton />;
  }

  return (
    <div className="flex flex-col gap-6 p-6 animate-page-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{t("Delegation Hub")}</h1>
          <p className="text-sm text-neutral-500 mt-0.5">{t("Manage and track executive directives")}</p>
        </div>
        {!showForm && (
          <Button
            title={t("Create New")}
            iconLeft={<Icon name="add" size={20} color="currentColor" />}
            onClick={() => setShowForm(true)}
            style="primary"
            textStyle="body-4-medium"
          />
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="animate-slideUp">
          <DelegationForm
            onSubmit={handleCreate}
            isSubmitting={isSubmitting}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* List */}
      <DelegationList
        requests={requests}
        onStatusChange={handleStatusChange}
        onDelete={handleDelete}
        onViewDetail={setSelectedRequest}
        filter={filter}
        onFilterChange={setFilter}
      />

      {/* Delegation Detail Modal */}
      {selectedRequest && (
        <DelegationDetailModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
        />
      )}
    </div>
  );
}

// ─── Detail Modal ──────────────────────────────────────────────────────────────

function getInitials(firstName: string | null, lastName: string | null): string {
  const f = firstName?.charAt(0)?.toUpperCase() || "";
  const l = lastName?.charAt(0)?.toUpperCase() || "";
  return f + l || "?";
}

function getFullName(user: { firstName: string | null; lastName: string | null; email: string }): string {
  const parts = [user.lastName, user.firstName].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : user.email;
}

function DelegationDetailModal({
  request,
  onClose,
}: {
  request: ExecutiveRequest;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [comments, setComments] = useState(request.comments ?? []);
  const [noteText, setNoteText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    setIsSending(true);
    try {
      await delegationService.addNote(request.id, noteText.trim());
      setComments((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          authorId: "",
          authorName: t("You"),
          avatarUrl: null,
          content: noteText.trim(),
          createdAt: new Date().toISOString(),
          isInternal: true,
        },
      ]);
      setNoteText("");
      inputRef.current?.focus();
    } catch {
      showToast(t("Unable to add note."), "error");
    } finally {
      setIsSending(false);
    }
  };

  const statusConfig: Record<ExecutiveRequest["status"], { label: string; bg: string; text: string; dot: string }> = {
    PENDING:     { label: t("Pending"),     bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-400" },
    IN_PROGRESS: { label: t("In Progress"), bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-500" },
    COMPLETED:   { label: t("Completed"),   bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
    CANCELLED:   { label: t("Cancelled"),   bg: "bg-neutral-100", text: "text-neutral-500", dot: "bg-neutral-400" },
  };

  const priorityConfig: Record<ExecutiveRequest["priority"], { label: string; bg: string; text: string }> = {
    URGENT: { label: t("Urgent"), bg: "bg-red-50",     text: "text-red-600" },
    HIGH:   { label: t("High"),   bg: "bg-orange-50",  text: "text-orange-600" },
    MEDIUM: { label: t("Medium"), bg: "bg-blue-50",    text: "text-blue-600" },
    LOW:    { label: t("Low"),    bg: "bg-neutral-100", text: "text-neutral-600" },
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("vi-VN", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  const s = statusConfig[request.status];
  const p = priorityConfig[request.priority];

  return (
    <Modal isOpen onClose={onClose} title={t("Delegation Details")} maxWidth="md">
      <div className="flex flex-col gap-5 px-8 py-5 overflow-y-auto max-h-[70vh]">
        {/* Badges */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
            {s.label}
          </span>
          <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold ${p.bg} ${p.text}`}>
            {p.label}
          </span>
        </div>

        {/* Title & Description */}
        <div>
          <h3 className="text-base font-semibold text-neutral-900 mb-1">{request.title}</h3>
          {request.description && (
            <p className="text-sm text-neutral-600 leading-relaxed whitespace-pre-line">{request.description}</p>
          )}
        </div>

        {/* Meta info */}
        <div className="grid grid-cols-2 gap-3 text-sm bg-neutral-50 rounded-xl p-4 border border-neutral-100">
          <div>
            <p className="text-neutral-400 text-xs mb-0.5">{t("Created At")}</p>
            <p className="font-medium text-neutral-800">{formatDate(request.createdAt)}</p>
          </div>
          <div>
            <p className="text-neutral-400 text-xs mb-0.5">{t("Last Updated")}</p>
            <p className="font-medium text-neutral-800">{formatDate(request.updatedAt)}</p>
          </div>
        </div>

        {/* Assignees */}
        {request.assignees && request.assignees.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
              {t("Assigned to")} ({request.assignees.length})
            </p>
            <div className="flex flex-col gap-2">
              {request.assignees.map((user) => (
                <div key={user.id} className="flex items-center gap-3 bg-neutral-50 rounded-lg px-3 py-2 border border-neutral-100">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {getInitials(user.firstName, user.lastName)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 truncate">{getFullName(user)}</p>
                    <p className="text-xs text-neutral-400 truncate">{user.email}</p>
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400 flex-shrink-0">{user.role}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Internal Notes */}
        <div>
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
            {t("Internal Notes")} ({comments.length})
          </p>
          <div className="flex flex-col gap-2 mb-3">
            {comments.length === 0 && (
              <p className="text-sm text-neutral-400 italic">{t("No notes yet.")}</p>
            )}
            {comments.map((c) => (
              <div key={c.id} className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-blue-700">{c.authorName}</span>
                  <span className="text-[10px] text-neutral-400">{formatDate(c.createdAt)}</span>
                </div>
                <p className="text-sm text-neutral-700">{c.content}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              className="flex-1 border border-neutral-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder={t("Add internal note...")}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") void handleAddNote(); }}
              disabled={isSending}
            />
            <Button
              style="primary"
              title={t("Send")}
              onClick={() => void handleAddNote()}
              loading={isSending}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
