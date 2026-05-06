import { useState, useEffect, useCallback } from "react";
import Icon from "../../../components/common/Icon";
import { Button } from "../../../components/common/Buttons/Button";
import Modal from "../../../components/common/Modal";
import { useToast } from "../../../contexts/useToast";
import { adminService } from "../services/adminService";
import type {
  Ticket,
  TicketStatus,
  TicketPriority,
  TicketCategory,
  TicketComment,
} from "../types/adminTypes";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const CATEGORY_LABELS: Record<TicketCategory, string> = {
  ADD_ACCOUNT: "Add Account",
  CHANGE_ROLE: "Role Change",
  SYSTEM_CONFIG: "System Configuration",
  STORAGE: "Storage",
  OTHER: "Other",
};

const PRIORITY_META: Record<
  TicketPriority,
  { label: string; bg: string; text: string }
> = {
  LOW: { label: "Low", bg: "bg-neutral-100", text: "text-neutral-600" },
  MEDIUM: { label: "Medium", bg: "bg-blue-50", text: "text-blue-600" },
  HIGH: { label: "High", bg: "bg-orange-50", text: "text-orange-600" },
  CRITICAL: { label: "Critical", bg: "bg-red-50", text: "text-red-600" },
};

const STATUS_META: Record<
  TicketStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  PENDING: {
    label: "Pending",
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    dot: "bg-yellow-400",
  },
  IN_PROGRESS: {
    label: "In Progress",
    bg: "bg-blue-50",
    text: "text-blue-700",
    dot: "bg-blue-500",
  },
  RESOLVED: {
    label: "Resolved",
    bg: "bg-green-50",
    text: "text-green-700",
    dot: "bg-green-500",
  },
  REJECTED: {
    label: "Rejected",
    bg: "bg-red-50",
    text: "text-red-700",
    dot: "bg-red-500",
  },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: TicketStatus }) {
  const m = STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${m.bg} ${m.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: TicketPriority }) {
  const m = PRIORITY_META[priority];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${m.bg} ${m.text}`}
    >
      {m.label}
    </span>
  );
}

// ─── Ticket Detail Modal ──────────────────────────────────────────────────────

interface TicketDetailModalProps {
  ticket: Ticket | null;
  isOpen: boolean;
  onClose: () => void;
  onAccept: (id: string) => Promise<void>;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
  onComment: (id: string, content: string) => Promise<void>;
}

function TicketDetailModal({
  ticket,
  isOpen,
  onClose,
  onAccept,
  onApprove,
  onReject,
  onComment,
}: TicketDetailModalProps) {
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [commentText, setCommentText] = useState("");
  const [acting, setActing] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (!isOpen) {
      setRejectMode(false);
      setRejectReason("");
      setCommentText("");
    }
  }, [isOpen]);

  if (!ticket) return null;

  const canAct =
    ticket.status === "PENDING" || ticket.status === "IN_PROGRESS";

  const handleAccept = async () => {
    setActing(true);
    try {
      await onAccept(ticket.id);
      showToast("Task accepted.", "success");
    } catch {
      showToast("Unable to accept this task.", "error");
    } finally {
      setActing(false);
    }
  };

  const handleApprove = async () => {
    setActing(true);
    try {
      await onApprove(ticket.id);
      showToast("Task marked as complete.", "success");
      onClose();
    } catch {
      showToast("Unable to complete this task.", "error");
    } finally {
      setActing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      showToast("Please enter a rejection reason.", "error");
      return;
    }
    setActing(true);
    try {
      await onReject(ticket.id, rejectReason);
      showToast("Ticket rejected.", "success");
      onClose();
    } catch {
      showToast("Unable to reject this ticket.", "error");
    } finally {
      setActing(false);
    }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    try {
      await onComment(ticket.id, commentText);
      setCommentText("");
      showToast("Note added.", "success");
    } catch {
      showToast("Unable to add note.", "error");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Ticket Details - ${ticket.code}`} maxWidth="lg">
      <div className="flex flex-col gap-5 px-8 py-5 overflow-y-auto max-h-[70vh]">
        {/* Header info */}
        <div className="flex flex-wrap gap-3 items-center">
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
          <span className="text-xs text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">
            {CATEGORY_LABELS[ticket.category]}
          </span>
        </div>

        <div>
          <h3 className="text-base font-semibold text-neutral-900 mb-1">
            {ticket.title}
          </h3>
          <p className="text-sm text-neutral-600 leading-relaxed">
            {ticket.description}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm bg-neutral-50 rounded-xl p-4 border border-neutral-100">
          <div>
            <p className="text-neutral-400 text-xs mb-0.5">Requester</p>
            <p className="font-medium text-neutral-800">{ticket.requesterName}</p>
          </div>
          <div>
            <p className="text-neutral-400 text-xs mb-0.5">Created At</p>
            <p className="font-medium text-neutral-800">{formatDate(ticket.createdAt)}</p>
          </div>
          {ticket.assigneeName && (
            <div>
              <p className="text-neutral-400 text-xs mb-0.5">Assignee</p>
              <p className="font-medium text-neutral-800">{ticket.assigneeName}</p>
            </div>
          )}
          {ticket.resolvedAt && (
            <div>
              <p className="text-neutral-400 text-xs mb-0.5">Resolved At</p>
              <p className="font-medium text-neutral-800">{formatDate(ticket.resolvedAt)}</p>
            </div>
          )}
        </div>

        {/* Comments */}
        <div>
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
            Internal Notes ({ticket.comments.length})
          </p>
          <div className="space-y-2 mb-3">
            {ticket.comments.length === 0 && (
              <p className="text-sm text-neutral-400 italic">No notes yet.</p>
            )}
            {ticket.comments.map((c: TicketComment) => (
              <div
                key={c.id}
                className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-blue-700">
                    {c.authorName}
                  </span>
                  <span className="text-[10px] text-neutral-400">
                    {formatDate(c.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-neutral-700">{c.content}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              className="flex-1 border border-neutral-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Add internal note..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleComment();
              }}
            />
            <Button
              style="primary"
              title="Send"
              onClick={() => void handleComment()}
            />
          </div>
        </div>

        {/* Action panel */}
        {canAct && (
          <div className="border-t border-neutral-100 pt-4">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
              Action Panel
            </p>
            {!rejectMode ? (
              <div className="flex gap-3 justify-end">
                {ticket.status === "PENDING" && (
                  <Button
                    style="primary"
                    iconLeft={<Icon name="assignment_turned_in" size={16} color="#0014A8" />}
                    title="Accept Task"
                    onClick={() => void handleAccept()}
                    loading={acting}
                  />
                )}
                {ticket.status === "IN_PROGRESS" && (
                  <Button
                    style="primary"
                    iconLeft={<Icon name="check_circle" size={16} color="#0014A8" />}
                    title="Mark Complete"
                    onClick={() => void handleApprove()}
                    loading={acting}
                  />
                )}
                <Button
                  style="danger"
                  iconLeft={<Icon name="cancel" size={16} color="#ef4444" />}
                  title="Reject"
                  onClick={() => setRejectMode(true)}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <textarea
                  className="w-full border border-red-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 resize-none"
                  rows={3}
                  placeholder="Rejection reason (required)..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    style="sub"
                    title="Cancel"
                    onClick={() => setRejectMode(false)}
                  />
                  <Button
                    style="danger"
                    title="Confirm Reject"
                    onClick={() => void handleReject()}
                    loading={acting}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

// ─── Filter bar ───────────────────────────────────────────────────────────────

const STATUS_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "REJECTED", label: "Rejected" },
];

let requestCenterTicketsSnapshot: Ticket[] | null = null;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RequestCenterPage() {
  const [initialTickets] = useState<Ticket[] | null>(
    () => adminService.getCachedTickets() ?? requestCenterTicketsSnapshot
  );
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets ?? []);
  const [isLoading, setIsLoading] = useState(!initialTickets);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const { showToast } = useToast();

  const upsertTicket = useCallback((updatedTicket: Ticket) => {
    setTickets((prev) => {
      const ticketExists = prev.some((ticket) => ticket.id === updatedTicket.id);
      const nextTickets = ticketExists
        ? prev.map((ticket) => (ticket.id === updatedTicket.id ? updatedTicket : ticket))
        : [updatedTicket, ...prev];

      requestCenterTicketsSnapshot = nextTickets;
      return nextTickets;
    });
  }, []);

  const load = useCallback(
    async (showLoading = false, forceRefresh = false) => {
      if (showLoading) {
        setIsLoading(true);
      }

      try {
        const data = await adminService.listTickets({ forceRefresh });
        requestCenterTicketsSnapshot = data;
        setTickets(data);
      } catch (error) {
        console.error("Failed to load request center tickets:", error);
        if (!requestCenterTicketsSnapshot) {
          setTickets([]);
        }
        if (showLoading) {
          showToast("Unable to refresh tickets.", "error");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [showToast]
  );

  const refreshTicket = useCallback(
    async (ticketId: string) => {
      const latest = await adminService.getTicket(ticketId, { forceRefresh: true });
      upsertTicket(latest);
      setSelectedTicket((prev) => (prev?.id === ticketId ? latest : prev));
      return latest;
    },
    [upsertTicket]
  );

  const handleOpenTicket = useCallback(
    async (ticket: Ticket) => {
      setSelectedTicket(ticket);
      try {
        await refreshTicket(ticket.id);
      } catch (error) {
        console.error("Failed to load ticket detail:", error);
      }
    },
    [refreshTicket]
  );

  useEffect(() => {
    void load(!initialTickets, false);
  }, [initialTickets, load]);

  const handleAccept = async (id: string) => {
    await adminService.acceptTicket(id);
    await refreshTicket(id);
  };

  const handleApprove = async (id: string) => {
    await adminService.approveTicket(id);
    await refreshTicket(id);
  };

  const handleReject = async (id: string, reason: string) => {
    await adminService.rejectTicket(id, reason);
    await refreshTicket(id);
  };

  const handleComment = async (id: string, content: string) => {
    await adminService.addTicketComment(id, content, true);
    await refreshTicket(id);
  };

  const filtered = tickets.filter((t) => {
    const matchStatus = filterStatus === "ALL" || t.status === filterStatus;
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      t.code.toLowerCase().includes(q) ||
      t.title.toLowerCase().includes(q) ||
      t.requesterName.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const pendingCount = tickets.filter((t) => t.status === "PENDING").length;

  return (
    <div className="onfis-section">
      {/* Navbar */}
      <div className="navbar-style">
        <div className="flex items-center gap-3">
          <Icon name="support_agent" size={22} color="#0014A8" />
          <div>
            <h1 className="text-base font-bold text-neutral-900">
              Request Center
            </h1>
            <p className="text-xs text-neutral-500">
              Manage tickets from leadership / CEO
            </p>
          </div>
          {pendingCount > 0 && (
            <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {pendingCount} pending
            </span>
          )}
        </div>
        <Button
          style="sub"
          iconLeft={<Icon name="refresh" size={16} color="#62748E" />}
          title="Refresh"
          onClick={() => void load(true, true)}
        />
      </div>

      {/* Filter bar */}
      <div className="px-6 pt-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Icon
            name="search"
            size={16}
            color="#9CA3AF"
            className="absolute left-3 top-1/2 -translate-y-1/2"
          />
          <input
            type="text"
            placeholder="Search ticket code, title, requester..."
            className="w-full pl-9 pr-3 py-1.5 text-sm border border-neutral-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5">
          {STATUS_FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setFilterStatus(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filterStatus === opt.value
                  ? "bg-primary text-white shadow-sm"
                  : "bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Data grid */}
      <div className="px-6 pt-4 pb-6">
        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 bg-neutral-100 rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-neutral-400">
            <Icon name="inbox" size={40} color="#D1D5DB" />
            <p className="mt-2 text-sm">No matching tickets found.</p>
          </div>
        ) : (
          <div className="section-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden md:table-cell">
                    Requester
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden lg:table-cell">
                    Category
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden lg:table-cell">
                    Priority
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden xl:table-cell">
                    Created At
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {filtered.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="hover:bg-neutral-50 transition-colors cursor-pointer group"
                    onClick={() => void handleOpenTicket(ticket)}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-neutral-500">
                      {ticket.code}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-neutral-900 line-clamp-1 max-w-[260px]">
                        {ticket.title}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-neutral-600 hidden md:table-cell">
                      {ticket.requesterName}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded">
                        {CATEGORY_LABELS[ticket.category]}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <PriorityBadge priority={ticket.priority} />
                    </td>
                    <td className="px-4 py-3 text-neutral-500 text-xs hidden xl:table-cell">
                      {formatDate(ticket.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={ticket.status} />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-neutral-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleOpenTicket(ticket);
                        }}
                      >
                        <Icon name="open_in_new" size={14} color="#62748E" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <TicketDetailModal
        ticket={selectedTicket}
        isOpen={selectedTicket !== null}
        onClose={() => setSelectedTicket(null)}
        onAccept={handleAccept}
        onApprove={handleApprove}
        onReject={handleReject}
        onComment={handleComment}
      />
    </div>
  );
}
