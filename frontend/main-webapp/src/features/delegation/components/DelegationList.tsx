import { useState } from "react";
import type { ExecutiveRequest } from "../services/delegationService";
import DelegationCard from "./DelegationCard";
import Icon from "../../../components/common/Icon";

interface DelegationListProps {
  requests: ExecutiveRequest[];
  onStatusChange: (id: string, status: ExecutiveRequest["status"]) => void;
  onDelete: (id: string) => void;
  filter: string;
  onFilterChange: (filter: string) => void;
}

const FILTERS = [
  { value: "all", label: "Tất cả" },
  { value: "PENDING", label: "Chờ xử lý" },
  { value: "IN_PROGRESS", label: "Đang xử lý" },
  { value: "COMPLETED", label: "Hoàn thành" },
];

const PRIORITY_OPTIONS = [
  { value: "all", label: "Mức độ ưu tiên" },
  { value: "URGENT", label: "Khẩn cấp" },
  { value: "HIGH", label: "Cao" },
  { value: "MEDIUM", label: "Trung bình" },
  { value: "LOW", label: "Thấp" },
];

const ITEMS_PER_PAGE = 10;

export default function DelegationList({ requests, onStatusChange, onDelete, filter, onFilterChange }: DelegationListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Filter requests
  const filtered = requests.filter((r) => {
    // 1. Status Filter
    if (filter !== "all" && r.status !== filter) return false;
    
    // 2. Priority Filter
    if (priorityFilter !== "all" && r.priority !== priorityFilter) return false;

    // 3. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = r.title.toLowerCase().includes(q);
      const matchDesc = r.description?.toLowerCase().includes(q);
      const matchAssignees = r.assignees?.some(
        (a) => a.firstName?.toLowerCase().includes(q) || 
               a.lastName?.toLowerCase().includes(q) || 
               a.email.toLowerCase().includes(q)
      );
      if (!matchTitle && !matchDesc && !matchAssignees) return false;
    }
    
    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const currentData = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // When filter changes, reset to page 1
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Helper to change filter and reset page
  const handleTabChange = (val: string) => {
    onFilterChange(val);
    setCurrentPage(1);
  };

  const handlePriorityChange = (val: string) => {
    setPriorityFilter(val);
    setCurrentPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Top bar: Search and Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Filter tabs */}
        <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl w-fit overflow-x-auto">
          {FILTERS.map((f) => {
            const count = f.value === "all" ? requests.length : requests.filter((r) => r.status === f.value).length;
            return (
              <button
                key={f.value}
                onClick={() => handleTabChange(f.value)}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap
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

        {/* Search and Priority Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
              <Icon name="search" size={16} color="currentColor" />
            </span>
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9 pr-3 py-2 text-sm border border-neutral-200 rounded-xl outline-none focus:border-indigo-500 w-[200px]"
            />
          </div>
          
          <div className="relative">
            <select
              value={priorityFilter}
              onChange={(e) => handlePriorityChange(e.target.value)}
              className="pl-3 pr-8 py-2 text-sm border border-neutral-200 rounded-xl outline-none focus:border-indigo-500 appearance-none bg-white cursor-pointer"
            >
              {PRIORITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
              <Icon name="expand_more" size={16} color="currentColor" />
            </span>
          </div>
        </div>
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center bg-white rounded-xl border border-neutral-200/80">
          <span className="text-3xl text-neutral-300 inline-block mb-3">
            <Icon name="inbox" size={48} color="currentColor" />
          </span>
          <p className="text-sm text-neutral-400">Chưa có yêu cầu nào phù hợp</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {currentData.map((req, i) => (
              <div key={req.id} className="animate-page-enter" style={{ animationDelay: `${(i % ITEMS_PER_PAGE) * 50}ms` }}>
                <DelegationCard request={req} onStatusChange={onStatusChange} onDelete={onDelete} />
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 hover:bg-neutral-50 disabled:opacity-50 disabled:hover:bg-transparent"
              >
                <Icon name="chevron_left" size={16} color="currentColor" />
              </button>
              
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => handlePageChange(i + 1)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors
                    ${currentPage === i + 1 
                      ? "bg-indigo-600 text-white" 
                      : "text-neutral-600 hover:bg-neutral-100"
                    }`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 hover:bg-neutral-50 disabled:opacity-50 disabled:hover:bg-transparent"
              >
                <Icon name="chevron_right" size={16} color="currentColor" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
