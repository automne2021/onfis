import type { ExecutiveRequest } from "../services/delegationService";
import DelegationCard from "./DelegationCard";

interface DelegationListProps {
  requests: ExecutiveRequest[];
  onStatusChange: (id: string, status: ExecutiveRequest["status"]) => void;
  filter: string;
  onFilterChange: (filter: string) => void;
}

const FILTERS = [
  { value: "all", label: "Tất cả" },
  { value: "PENDING", label: "Chờ xử lý" },
  { value: "IN_PROGRESS", label: "Đang xử lý" },
  { value: "COMPLETED", label: "Hoàn thành" },
];

export default function DelegationList({ requests, onStatusChange, filter, onFilterChange }: DelegationListProps) {
  const filtered = filter === "all" ? requests : requests.filter((r) => r.status === filter);

  return (
    <div className="flex flex-col gap-4">
      {/* Filter tabs */}
      <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl w-fit">
        {FILTERS.map((f) => {
          const count = f.value === "all" ? requests.length : requests.filter((r) => r.status === f.value).length;
          return (
            <button
              key={f.value}
              onClick={() => onFilterChange(f.value)}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5
                ${filter === f.value
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-700"
                }`}
            >
              {f.label}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold
                ${filter === f.value ? "bg-indigo-100 text-indigo-600" : "bg-neutral-200 text-neutral-500"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center bg-white rounded-xl border border-neutral-200/80">
          <span className="text-3xl">📭</span>
          <p className="text-sm text-neutral-400 mt-3">Chưa có yêu cầu nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((req, i) => (
            <div key={req.id} className="animate-page-enter" style={{ animationDelay: `${i * 50}ms` }}>
              <DelegationCard request={req} onStatusChange={onStatusChange} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
