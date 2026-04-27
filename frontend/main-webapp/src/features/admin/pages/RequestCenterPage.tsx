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

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_TICKETS: Ticket[] = [
  {
    id: "1",
    code: "TK-001",
    title: "Thêm tài khoản nhân viên mới – Phòng Kỹ thuật",
    description:
      "Cần tạo tài khoản mới cho 3 nhân viên vừa onboard vào phòng Kỹ thuật. Thông tin chi tiết đính kèm trong payload.",
    requesterId: "ceo-001",
    requesterName: "Nguyễn Văn CEO",
    category: "ADD_ACCOUNT",
    priority: "HIGH",
    status: "PENDING",
    createdAt: "2026-04-25T08:30:00Z",
    updatedAt: "2026-04-25T08:30:00Z",
    comments: [],
    payload: {
      employees: [
        { name: "Trần Thị A", email: "trantha@company.vn", role: "EMPLOYEE" },
        { name: "Lê Văn B", email: "levanb@company.vn", role: "EMPLOYEE" },
        { name: "Phạm Thị C", email: "phamthic@company.vn", role: "MANAGER" },
      ],
    },
  },
  {
    id: "2",
    code: "TK-002",
    title: "Đổi quyền – Nâng cấp lên Manager cho Hoàng Minh Tuấn",
    description:
      "Sau khi xét duyệt nội bộ, đề nghị nâng quyền tài khoản của nhân viên Hoàng Minh Tuấn từ EMPLOYEE lên MANAGER.",
    requesterId: "ceo-001",
    requesterName: "Nguyễn Văn CEO",
    category: "CHANGE_ROLE",
    priority: "MEDIUM",
    status: "IN_PROGRESS",
    createdAt: "2026-04-24T14:00:00Z",
    updatedAt: "2026-04-26T10:15:00Z",
    assigneeId: "admin-001",
    assigneeName: "Admin A",
    comments: [
      {
        id: "c1",
        authorId: "admin-001",
        authorName: "Admin A",
        content: "Đã kiểm tra hồ sơ, đang tiến hành xử lý.",
        createdAt: "2026-04-26T10:15:00Z",
        isInternal: true,
      },
    ],
  },
  {
    id: "3",
    code: "TK-003",
    title: "Cấu hình hệ thống – Thay đổi múi giờ sang UTC+7",
    description:
      "Hệ thống hiện đang dùng UTC+0, cần cập nhật sang UTC+7 (Giờ Việt Nam) để đồng bộ với hoạt động kinh doanh.",
    requesterId: "ceo-001",
    requesterName: "Nguyễn Văn CEO",
    category: "SYSTEM_CONFIG",
    priority: "CRITICAL",
    status: "RESOLVED",
    createdAt: "2026-04-20T09:00:00Z",
    updatedAt: "2026-04-21T11:00:00Z",
    resolvedAt: "2026-04-21T11:00:00Z",
    comments: [],
  },
  {
    id: "4",
    code: "TK-004",
    title: "Tăng giới hạn dung lượng upload file",
    description:
      "Team thiết kế cần upload file PSD/AI lớn. Đề nghị nâng giới hạn từ 10MB lên 50MB.",
    requesterId: "ceo-001",
    requesterName: "Nguyễn Văn CEO",
    category: "STORAGE",
    priority: "LOW",
    status: "PENDING",
    createdAt: "2026-04-27T07:00:00Z",
    updatedAt: "2026-04-27T07:00:00Z",
    comments: [],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const CATEGORY_LABELS: Record<TicketCategory, string> = {
  ADD_ACCOUNT: "Thêm tài khoản",
  CHANGE_ROLE: "Đổi quyền",
  SYSTEM_CONFIG: "Cấu hình hệ thống",
  STORAGE: "Lưu trữ",
  OTHER: "Khác",
};

const PRIORITY_META: Record<
  TicketPriority,
  { label: string; bg: string; text: string }
> = {
  LOW: { label: "Thấp", bg: "bg-neutral-100", text: "text-neutral-600" },
  MEDIUM: { label: "Trung bình", bg: "bg-blue-50", text: "text-blue-600" },
  HIGH: { label: "Cao", bg: "bg-orange-50", text: "text-orange-600" },
  CRITICAL: { label: "Khẩn cấp", bg: "bg-red-50", text: "text-red-600" },
};

const STATUS_META: Record<
  TicketStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  PENDING: {
    label: "Chờ xử lý",
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    dot: "bg-yellow-400",
  },
  IN_PROGRESS: {
    label: "Đang xử lý",
    bg: "bg-blue-50",
    text: "text-blue-700",
    dot: "bg-blue-500",
  },
  RESOLVED: {
    label: "Đã giải quyết",
    bg: "bg-green-50",
    text: "text-green-700",
    dot: "bg-green-500",
  },
  REJECTED: {
    label: "Từ chối",
    bg: "bg-red-50",
    text: "text-red-700",
    dot: "bg-red-500",
  },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("vi-VN", {
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
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
  onComment: (id: string, content: string) => Promise<void>;
}

function TicketDetailModal({
  ticket,
  isOpen,
  onClose,
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

  const handleApprove = async () => {
    setActing(true);
    try {
      await onApprove(ticket.id);
      showToast("Ticket đã được chấp thuận & thực thi.", "success");
      onClose();
    } catch {
      showToast("Không thể thực thi yêu cầu.", "error");
    } finally {
      setActing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      showToast("Vui lòng nhập lý do từ chối.", "error");
      return;
    }
    setActing(true);
    try {
      await onReject(ticket.id, rejectReason);
      showToast("Ticket đã bị từ chối.", "success");
      onClose();
    } catch {
      showToast("Không thể từ chối ticket.", "error");
    } finally {
      setActing(false);
    }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    try {
      await onComment(ticket.id, commentText);
      setCommentText("");
      showToast("Đã thêm ghi chú.", "success");
    } catch {
      showToast("Không thể thêm ghi chú.", "error");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Chi tiết Ticket – ${ticket.code}`} maxWidth="lg">
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
            <p className="text-neutral-400 text-xs mb-0.5">Người yêu cầu</p>
            <p className="font-medium text-neutral-800">{ticket.requesterName}</p>
          </div>
          <div>
            <p className="text-neutral-400 text-xs mb-0.5">Thời gian tạo</p>
            <p className="font-medium text-neutral-800">{formatDate(ticket.createdAt)}</p>
          </div>
          {ticket.assigneeName && (
            <div>
              <p className="text-neutral-400 text-xs mb-0.5">Người xử lý</p>
              <p className="font-medium text-neutral-800">{ticket.assigneeName}</p>
            </div>
          )}
          {ticket.resolvedAt && (
            <div>
              <p className="text-neutral-400 text-xs mb-0.5">Giải quyết lúc</p>
              <p className="font-medium text-neutral-800">{formatDate(ticket.resolvedAt)}</p>
            </div>
          )}
        </div>

        {/* Payload details */}
        {ticket.payload && (
          <div>
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
              Thông tin yêu cầu
            </p>
            <pre className="text-xs bg-neutral-900 text-green-400 rounded-lg p-4 overflow-x-auto">
              {JSON.stringify(ticket.payload, null, 2)}
            </pre>
          </div>
        )}

        {/* Comments */}
        <div>
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
            Ghi chú nội bộ ({ticket.comments.length})
          </p>
          <div className="space-y-2 mb-3">
            {ticket.comments.length === 0 && (
              <p className="text-sm text-neutral-400 italic">Chưa có ghi chú nào.</p>
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
              placeholder="Thêm ghi chú nội bộ..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleComment();
              }}
            />
            <Button
              style="primary"
              title="Gửi"
              onClick={() => void handleComment()}
            />
          </div>
        </div>

        {/* Action panel */}
        {canAct && (
          <div className="border-t border-neutral-100 pt-4">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
              Khu vực xử lý
            </p>
            {!rejectMode ? (
              <div className="flex gap-3">
                <Button
                  style="primary"
                  iconLeft={<Icon name="check_circle" size={16} color="#0014A8" />}
                  title="Chấp thuận & Thực thi"
                  onClick={() => void handleApprove()}
                  loading={acting}
                />
                <Button
                  style="danger"
                  iconLeft={<Icon name="cancel" size={16} color="#ef4444" />}
                  title="Từ chối"
                  onClick={() => setRejectMode(true)}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <textarea
                  className="w-full border border-red-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 resize-none"
                  rows={3}
                  placeholder="Lý do từ chối (bắt buộc)..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button
                    style="danger"
                    title="Xác nhận từ chối"
                    onClick={() => void handleReject()}
                    loading={acting}
                  />
                  <Button
                    style="sub"
                    title="Hủy"
                    onClick={() => setRejectMode(false)}
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
  { value: "ALL", label: "Tất cả" },
  { value: "PENDING", label: "Chờ xử lý" },
  { value: "IN_PROGRESS", label: "Đang xử lý" },
  { value: "RESOLVED", label: "Đã giải quyết" },
  { value: "REJECTED", label: "Từ chối" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RequestCenterPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const { showToast } = useToast();

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await adminService.listTickets();
      setTickets(data);
    } catch {
      // Fallback to mock data when backend is unavailable
      setTickets(MOCK_TICKETS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleApprove = async (id: string) => {
    try {
      await adminService.approveTicket(id);
    } catch {
      // mock: update locally
    }
    setTickets((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, status: "RESOLVED" as TicketStatus } : t
      )
    );
    showToast("Ticket đã được chấp thuận.", "success");
  };

  const handleReject = async (id: string, reason: string) => {
    try {
      await adminService.rejectTicket(id, reason);
    } catch {
      // mock: update locally
    }
    setTickets((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, status: "REJECTED" as TicketStatus } : t
      )
    );
    showToast("Ticket đã bị từ chối.", "success");
  };

  const handleComment = async (id: string, content: string) => {
    await adminService.addTicketComment(id, content, true);
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        return {
          ...t,
          comments: [
            ...t.comments,
            {
              id: crypto.randomUUID(),
              authorId: "current-admin",
              authorName: "Bạn",
              content,
              createdAt: new Date().toISOString(),
              isInternal: true,
            },
          ],
        };
      })
    );
    // Update selected ticket too
    if (selectedTicket?.id === id) {
      setSelectedTicket((prev) =>
        prev
          ? {
              ...prev,
              comments: [
                ...prev.comments,
                {
                  id: crypto.randomUUID(),
                  authorId: "current-admin",
                  authorName: "Bạn",
                  content,
                  createdAt: new Date().toISOString(),
                  isInternal: true,
                },
              ],
            }
          : null
      );
    }
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
              Trung tâm xử lý yêu cầu
            </h1>
            <p className="text-xs text-neutral-500">
              Quản lý ticket từ Ban lãnh đạo / CEO
            </p>
          </div>
          {pendingCount > 0 && (
            <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {pendingCount} chờ xử lý
            </span>
          )}
        </div>
        <Button
          style="sub"
          iconLeft={<Icon name="refresh" size={16} color="#62748E" />}
          title="Làm mới"
          onClick={() => void load()}
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
            placeholder="Tìm mã ticket, tiêu đề, người yêu cầu..."
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
            <p className="mt-2 text-sm">Không có ticket nào phù hợp.</p>
          </div>
        ) : (
          <div className="section-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    Mã
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    Tiêu đề
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden md:table-cell">
                    Người yêu cầu
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden lg:table-cell">
                    Phân loại
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden lg:table-cell">
                    Ưu tiên
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden xl:table-cell">
                    Thời gian tạo
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {filtered.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="hover:bg-neutral-50 transition-colors cursor-pointer group"
                    onClick={() => setSelectedTicket(ticket)}
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
                          setSelectedTicket(ticket);
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
        onApprove={handleApprove}
        onReject={handleReject}
        onComment={handleComment}
      />
    </div>
  );
}
