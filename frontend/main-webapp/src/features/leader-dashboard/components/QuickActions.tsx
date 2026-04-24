import { useNavigate } from "react-router-dom";

interface QuickActionsProps {
  tenant: string;
}

const actions = [
  {
    label: "Ủy quyền",
    desc: "Tạo và theo dõi nhiệm vụ",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M19 8v6M22 11h-6" />
      </svg>
    ),
    path: "delegation",
    color: "from-indigo-500 to-purple-500",
    bgLight: "bg-indigo-50",
  },
  {
    label: "Vị trí",
    desc: "Quản lý sơ đồ tổ chức",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="2" y="2" width="6" height="6" rx="1" />
        <rect x="16" y="2" width="6" height="6" rx="1" />
        <rect x="9" y="16" width="6" height="6" rx="1" />
        <path d="M5 8v3a1 1 0 001 1h12a1 1 0 001-1V8M12 12v4" />
      </svg>
    ),
    path: "positions",
    color: "from-blue-500 to-cyan-500",
    bgLight: "bg-blue-50",
  },
  {
    label: "Thông báo",
    desc: "Truyền thông toàn công ty",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
    path: "announcements",
    color: "from-amber-500 to-orange-500",
    bgLight: "bg-amber-50",
  },
  {
    label: "Dự án",
    desc: "Quản lý dự án & tasks",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
    path: "projects",
    color: "from-emerald-500 to-teal-500",
    bgLight: "bg-emerald-50",
  },
  {
    label: "Thảo luận",
    desc: "Chat & trao đổi nội bộ",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    path: "discuss",
    color: "from-pink-500 to-rose-500",
    bgLight: "bg-pink-50",
  },
];

export default function QuickActions({ tenant }: QuickActionsProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-2xl border border-neutral-200/80 p-6">
      <h3 className="text-base font-semibold text-neutral-900 mb-4">Truy cập nhanh</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {actions.map((action, i) => (
          <button
            key={action.path}
            onClick={() => navigate(`/${tenant}/${action.path}`)}
            className="group flex flex-col items-center gap-3 p-4 rounded-xl border border-neutral-200/80 hover:border-indigo-200 hover:shadow-md transition-all duration-200 animate-page-enter"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className={`w-12 h-12 rounded-xl ${action.bgLight} flex items-center justify-center text-neutral-600 group-hover:scale-110 transition-transform duration-200`}>
              {action.icon}
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-neutral-800">{action.label}</p>
              <p className="text-[10px] text-neutral-400 mt-0.5">{action.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
